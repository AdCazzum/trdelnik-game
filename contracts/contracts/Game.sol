// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

/**
 * @title TrdelnikGame
 * @dev On‑chain implementation of the step‑risk game described in the spec.
 *      · Designed for Hedera's EVM (but is plain‑Solidity → deployable anywhere).
 *      · One game → one player → multiple steps.  Lose once and the stake is burnt; cash‑out any time.
 *      · Fairness is delegated to an external VRF provider – currently stubbed with block entropy. Replace before main‑net.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TrdelnikGame is Ownable, ReentrancyGuard {
    /* ────────────────────────  Types  ───────────────────────── */

    enum Difficulty {
        Easy,
        Medium,
        Hard,
        Hardcore
    }

    struct Game {
        address player;        // wallet that owns the game session
        Difficulty difficulty; // chosen difficulty
        uint8 currentStep;     // 0‑based; increments only on success
        uint256 bet;           // stake locked in the contract
        bool active;           // true ⇢ still running / waiting for cash‑out
        bool lost;             // true ⇢ player has already blown up
    }

    /* ─────────────────────── Storage  ───────────────────────── */

    // ↳ games[gameId] ⇒ Game metadata
    mapping(uint256 => Game) public games;
    uint256 public nextGameId;

    // Step‑success probability per difficulty, in basis points (1 bp = 0.01 %)
    uint16 private constant PROB_EASY      = 9_600; // 96.00 %
    uint16 private constant PROB_MEDIUM    = 8_800; // 88.00 %
    uint16 private constant PROB_HARD      = 8_000; // 80.00 %
    uint16 private constant PROB_HARDCORE  = 6_000; // 60.00 %

    // Maximum number of successful steps allowed for each mode
    uint8 internal constant MAX_EASY      = 24;
    uint8 internal constant MAX_MEDIUM    = 22;
    uint8 internal constant MAX_HARD      = 20;
    uint8 internal constant MAX_HARDCORE  = 15;

    // Payout multipliers (× 10 000 for fixed‑point maths). 0‑th index unused.
    mapping(Difficulty => uint256[]) private multipliers;

    // (Optional) VRF request ↔ game relation; kept so we can finish in the async callback path
    mapping(uint256 => uint256) private requestToGame;

    /* ───────────────────────  Events  ───────────────────────── */

    event GameStarted(uint256 indexed gameId, address indexed player, Difficulty difficulty, uint256 bet);
    event StepRequested(uint256 indexed gameId, uint8 step);
    event StepResult(uint256 indexed gameId, uint8 step, bool success);
    event GameLost(uint256 indexed gameId, uint8 step);
    event Cashout(uint256 indexed gameId, uint256 payout);

    /* ──────────────────────  Constructor  ───────────────────── */

    constructor() payable Ownable() {
        multipliers[Difficulty.Easy] = new uint256[](MAX_EASY + 1);
        multipliers[Difficulty.Medium] = new uint256[](MAX_MEDIUM + 1);
        multipliers[Difficulty.Hard] = new uint256[](MAX_HARD + 1);
        multipliers[Difficulty.Hardcore] = new uint256[](MAX_HARDCORE + 1);

        // Easy: 24 steps, from 1.02x to 24.50x
        multipliers[Difficulty.Easy] = [
            0,      // index 0 unused
            10200,  11217, 12234, 13251, 14268, 15285,
            16302,  17319, 18336, 19353, 20370, 21387,
            22404,  23421, 24438, 25455, 26472, 27489,
            28506,  29523, 30540, 31557, 32574, 33591,
            34608
        ];

        // Medium: 22 steps, from 1.11x to 2,254x
        multipliers[Difficulty.Medium] = [
            0,
            11100, 21200, 31300, 41400, 51500, 61600,
            71700, 81800, 91900, 102000, 112100, 122200,
            132300, 142400, 152500, 162600, 172700, 182800,
            192900, 203000, 213100, 225400
        ];

        // Hard: 20 steps, from 1.22x to 52,067.39x
        multipliers[Difficulty.Hard] = [
            0,
            12200, 27340, 42480, 57620, 72760, 87900,
            103040, 118180, 133320, 148460, 163600, 178740,
            193880, 209020, 224160, 239300, 254440, 269580,
            284720, 5206739
        ];

        // Hardcore: 15 steps, from 1.63x to 3,203,384.80x
        multipliers[Difficulty.Hardcore] = [
            0,
            16300, 228293, 440286, 652279, 864272,
            1076265, 1288258, 1500251, 1712244,
            1924237, 2136230, 2348223, 2560216,
            2772209, 320338480
        ];
    }

    /* ────────────────────  Administration  ─────────────────── */

    function setMultipliers(Difficulty diff, uint256[] calldata table) external onlyOwner {
        require(table.length == _maxSteps(diff) + 1, "wrong-length table");
        multipliers[diff] = table;
    }

    /* ──────────────────────  Game flow  ─────────────────────── */

    /// @notice Start a brand‑new game. First step is auto‑resolved.
    function startGame(Difficulty difficulty) external payable nonReentrant returns (uint256 gameId) {
        require(msg.value > 0, "stake == 0");

        gameId = nextGameId++;
        games[gameId] = Game({
            player: msg.sender,
            difficulty: difficulty,
            currentStep: 0,
            bet: msg.value,
            active: true,
            lost: false
        });

        emit GameStarted(gameId, msg.sender, difficulty, msg.value);
        _requestStep(gameId); // instantly evaluate the first attempt
    }

    /// @notice Attempt the next step – getter for RNG + state progression.
    function playStep(uint256 gameId) external nonReentrant {
        Game storage g = games[gameId];
        require(msg.sender == g.player, "not-your-game");
        require(g.active && !g.lost, "inactive");

        _requestStep(gameId);
    }

    /// @notice Exit early and redeem winnings. Allowed only if not busted.
    function doCashout(uint256 gameId) external nonReentrant {
        Game storage g = games[gameId];
        require(msg.sender == g.player, "not-your-game");
        require(g.active && !g.lost, "cannot");

        g.active = false;

        uint256 payout = _calcPayout(g.difficulty, g.currentStep, g.bet);
        require(address(this).balance >= payout, "contract-insolvent");

        emit Cashout(gameId, payout);
        payable(g.player).transfer(payout);
    }

    function _cashout(uint256 gameId) internal {
        Game storage g = games[gameId];
        require(g.active && !g.lost, "cannot");

        g.active = false;

        uint256 payout = _calcPayout(g.difficulty, g.currentStep, g.bet);
        require(address(this).balance >= payout, "contract-insolvent");

        emit Cashout(gameId, payout);
        payable(g.player).transfer(payout);
    }

    /* ───────────────────────  Randomness  ───────────────────── */

    /// @dev Stubs out the VRF flow with block entropy for now – *replace before production*.
    function _requestStep(uint256 gameId) internal {
        Game storage g = games[gameId];
        uint8 nextStep = g.currentStep + 1;
        require(nextStep <= _maxSteps(g.difficulty), "maxed");

        // Pseudo‑random synchronous path – external VRF should be plugged here.
        uint256 randomBp = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, gameId, nextStep))) % 10_000;
        _resolveStep(gameId, randomBp);
    }

    function _resolveStep(uint256 gameId, uint256 randomBp) internal {
        Game storage g = games[gameId];
        uint16 threshold = _probability(g.difficulty);
        bool success = randomBp < threshold; // 0 ‑ 9999 < threshold → win

        emit StepResult(gameId, g.currentStep + 1, success);

        if (!success) {
            g.active = false;
            g.lost = true;
            emit GameLost(gameId, g.currentStep + 1);
        } else {
            g.currentStep += 1;
            emit StepRequested(gameId, g.currentStep);

            // Auto‑cash‑out on final step success
            if (g.currentStep == _maxSteps(g.difficulty)) {
                _cashout(gameId);
            }
        }
    }

    /* ───────────────────────  Helpers  ──────────────────────── */

    function _probability(Difficulty diff) private pure returns (uint16) {
        if (diff == Difficulty.Easy)     return PROB_EASY;
        if (diff == Difficulty.Medium)   return PROB_MEDIUM;
        if (diff == Difficulty.Hard)     return PROB_HARD;
        return PROB_HARDCORE;
    }

    function _maxSteps(Difficulty diff) private pure returns (uint8) {
        if (diff == Difficulty.Easy)     return MAX_EASY;
        if (diff == Difficulty.Medium)   return MAX_MEDIUM;
        if (diff == Difficulty.Hard)     return MAX_HARD;
        return MAX_HARDCORE;
    }

    function _calcPayout(Difficulty diff, uint8 step, uint256 bet) private view returns (uint256) {
        if (step == 0) return bet; // nothing gained yet
        uint256 m = multipliers[diff][step]; // × 10 000 fixed‑point
        return (bet * m) / 10_000;
    }

    /* ──────  house‑keeping  ───── */

    receive() external payable {}
    fallback() external payable {}
}