// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BerachainGame
 * @dev On‑chain implementation of the step‑risk game designed for Berachain.
 *      · Uses Pyth Entropy for secure randomness
 *      · One game → one player → multiple steps. Lose once and the stake is burnt; cash‑out any time.
 *      · Fairness is delegated to Pyth Entropy.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// Import the entropy SDK in order to interact with the entropy contracts
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

contract BerachainGame is ReentrancyGuard, IEntropyConsumer {
    /* ────────────────────────  Types  ───────────────────────── */

    enum Difficulty {
        Easy,
        Medium,
        Hard,
        Hardcore
    }

    struct Game {
        address player; // wallet that owns the game session
        Difficulty difficulty; // chosen difficulty
        uint8 currentStep; // 0‑based; increments only on success
        uint256 bet; // stake locked in the contract
        bool active; // true ⇢ still running / waiting for cash‑out
        bool lost; // true ⇢ player has already blown up
        bool pendingRandomness; // true ⇢ waiting for Pyth entropy callback
    }

    /* ─────────────────────── Storage  ───────────────────────── */

    // Pyth Entropy integration
    IEntropy private entropy;
    address private entropyProvider;

    // ↳ games[gameId] ⇒ Game metadata
    mapping(uint256 => Game) public games;
    uint256 public nextGameId;

    // Map entropy sequence numbers to game IDs for async callback
    mapping(uint64 => uint256) private sequenceToGame;

    // Step‑success probability per difficulty, in basis points (1 bp = 0.01 %)
    uint16 private constant PROB_EASY = 9000; // 90.00 %
    uint16 private constant PROB_MEDIUM = 8500; // 85.00 %
    uint16 private constant PROB_HARD = 7000; // 70.00 %
    uint16 private constant PROB_HARDCORE = 5500; // 55.00 %

    // Maximum number of successful steps allowed for each mode
    uint8 internal constant MAX_EASY = 24;
    uint8 internal constant MAX_MEDIUM = 22;
    uint8 internal constant MAX_HARD = 20;
    uint8 internal constant MAX_HARDCORE = 15;

    // Payout multipliers (× 10 000 for fixed‑point maths). 0‑th index unused.
    mapping(Difficulty => uint256[]) private multipliers;

    /// @notice Enable/disable entropy for debugging
    bool public entropyEnabled = true;

    /* ───────────────────────  Events  ───────────────────────── */

    event GameStarted(
        uint256 indexed gameId,
        address indexed player,
        Difficulty difficulty,
        uint256 bet
    );
    event StepRequested(uint256 indexed gameId, uint8 step, uint64 sequenceNumber);
    event StepResult(uint256 indexed gameId, uint8 step, bool success);
    event GameLost(uint256 indexed gameId, uint8 step);
    event Cashout(uint256 indexed gameId, uint256 payout);
    event StepRequestFailed(uint256 indexed gameId, uint8 step, string reason);

    /* ──────────────────────  Constructor  ───────────────────── */

    constructor(address _entropy, address _entropyProvider) payable {
        entropy = IEntropy(_entropy);
        entropyProvider = _entropyProvider;

        multipliers[Difficulty.Easy] = new uint256[](MAX_EASY + 1);
        multipliers[Difficulty.Medium] = new uint256[](MAX_MEDIUM + 1);
        multipliers[Difficulty.Hard] = new uint256[](MAX_HARD + 1);
        multipliers[Difficulty.Hardcore] = new uint256[](MAX_HARDCORE + 1);

        // Easy: 24 steps, from 1.02x to 24.50x
        multipliers[Difficulty.Easy] = [
            0, // index 0 unused
            10200,
            11217,
            12234,
            13251,
            14268,
            15285,
            16302,
            17319,
            18336,
            19353,
            20370,
            21387,
            22404,
            23421,
            24438,
            25455,
            26472,
            27489,
            28506,
            29523,
            30540,
            31557,
            32574,
            33591,
            34608
        ];

        // Medium: 22 steps, from 1.11x to 2,254x
        multipliers[Difficulty.Medium] = [
            0,
            11100,
            21200,
            31300,
            41400,
            51500,
            61600,
            71700,
            81800,
            91900,
            102000,
            112100,
            122200,
            132300,
            142400,
            152500,
            162600,
            172700,
            182800,
            192900,
            203000,
            213100,
            225400
        ];

        // Hard: 20 steps, from 1.22x to 52,067.39x
        multipliers[Difficulty.Hard] = [
            0,
            12200,
            27340,
            42480,
            57620,
            72760,
            87900,
            103040,
            118180,
            133320,
            148460,
            163600,
            178740,
            193880,
            209020,
            224160,
            239300,
            254440,
            269580,
            284720,
            5206739
        ];

        // Hardcore: 15 steps, from 1.63x to 3,203,384.80x
        multipliers[Difficulty.Hardcore] = [
            0,
            16300,
            228293,
            440286,
            652279,
            864272,
            1076265,
            1288258,
            1500251,
            1712244,
            1924237,
            2136230,
            2348223,
            2560216,
            2772209,
            320338480
        ];
    }

    /* ──────────────────────  Game flow  ─────────────────────── */

    /// @notice Start a brand‑new game. First step is auto‑requested.
    function startGame(
        Difficulty difficulty,
        bytes32 userRandomNumber
    ) external payable nonReentrant returns (uint256 gameId) {
        require(msg.value > 0, "stake == 0");

        // Calculate entropy fee
        uint256 entropyFee = getEntropyFee();
        require(msg.value > entropyFee, "insufficient fee for entropy");

        gameId = nextGameId++;
        games[gameId] = Game({
            player: msg.sender,
            difficulty: difficulty,
            currentStep: 0,
            bet: msg.value - entropyFee, // Subtract entropy fee from bet
            active: true,
            lost: false,
            pendingRandomness: false
        });

        emit GameStarted(gameId, msg.sender, difficulty, msg.value - entropyFee);
        _requestStep(gameId, userRandomNumber, entropyFee); // Request the first step
    }

    /// @notice Attempt the next step – request RNG from Pyth Entropy.
    function playStep(uint256 gameId, bytes32 userRandomNumber) external payable nonReentrant {
        Game storage g = games[gameId];
        require(msg.sender == g.player, "not-your-game");
        require(g.active && !g.lost, "inactive");
        require(!g.pendingRandomness, "already-pending");

        // Check entropy fee
        uint256 entropyFee = getEntropyFee();
        require(msg.value >= entropyFee, "insufficient fee for entropy");

        _requestStep(gameId, userRandomNumber, entropyFee);
    }

    /// @notice Exit early and redeem winnings. Allowed only if not busted.
    function doCashout(uint256 gameId) external nonReentrant {
        Game storage g = games[gameId];
        require(msg.sender == g.player, "not-your-game");
        require(g.active && !g.lost, "cannot");
        require(!g.pendingRandomness, "pending-randomness");

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

    /* ───────────────────────  Pyth Entropy Integration  ───────────────────────── */

    /// @dev Request randomness from Pyth Entropy for the next step
    function _requestStep(uint256 gameId, bytes32 userRandomNumber, uint256 entropyFee) internal {
        Game storage g = games[gameId];
        uint8 nextStep = g.currentStep + 1;
        require(nextStep <= _maxSteps(g.difficulty), "maxed");

        if (entropyEnabled && address(entropy) != address(0)) {
            // Try Pyth Entropy
            g.pendingRandomness = true;

            try entropy.requestWithCallback{value: entropyFee}(
                entropyProvider,
                userRandomNumber
            ) returns (uint64 sequenceNumber) {
                sequenceToGame[sequenceNumber] = gameId;
                emit StepRequested(gameId, nextStep, sequenceNumber);
            } catch Error(string memory reason) {
                g.pendingRandomness = false;
                emit StepRequestFailed(gameId, nextStep, reason);
                _resolveStepFallback(gameId, userRandomNumber);
            } catch {
                g.pendingRandomness = false;
                emit StepRequestFailed(gameId, nextStep, "Unknown entropy error");
                _resolveStepFallback(gameId, userRandomNumber);
            }
        } else {
            // Fallback: use block-based randomness
            _resolveStepFallback(gameId, userRandomNumber);
        }
    }

    /// @dev Fallback randomness resolution using block hash
    function _resolveStepFallback(uint256 gameId, bytes32 userRandomNumber) internal {
        uint256 blockHash = uint256(blockhash(block.number - 1));
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            blockHash,
            userRandomNumber,
            block.timestamp,
            block.difficulty,
            gameId
        )));
        
        emit StepRequested(gameId, games[gameId].currentStep + 1, 0); // sequenceNumber = 0 for fallback
        _resolveStep(gameId, randomValue);
    }

    /// @dev This method is required by the IEntropyConsumer interface.
    /// It is called by the entropy contract when a random number is generated.
    function entropyCallback(
        uint64 sequenceNumber,
        address, // provider address (unused)
        bytes32 randomNumber
    ) internal override {
        uint256 gameId = sequenceToGame[sequenceNumber];
        require(gameId != 0, "invalid-sequence");

        // Clean up mapping
        delete sequenceToGame[sequenceNumber];

        // Convert random bytes to uint256 and resolve step
        uint256 randomValue = uint256(randomNumber);
        _resolveStep(gameId, randomValue);
    }

    /// @dev This method is required by the IEntropyConsumer interface.
    /// It returns the address of the entropy contract which will call the callback.
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function _resolveStep(uint256 gameId, uint256 randomNumber) internal {
        Game storage g = games[gameId];
        require(g.pendingRandomness, "not-pending");
        
        g.pendingRandomness = false;
        
        uint16 threshold = _probability(g.difficulty);
        bool success = _isWin(randomNumber, threshold);

        emit StepResult(gameId, g.currentStep + 1, success);

        if (!success) {
            g.active = false;
            g.lost = true;
            emit GameLost(gameId, g.currentStep + 1);
        } else {
            g.currentStep += 1;

            // Auto‑cash‑out on final step success
            if (g.currentStep == _maxSteps(g.difficulty)) {
                _cashout(gameId);
            }
        }
    }

    /* ───────────────────────  Utility Functions  ──────────────────────── */

    /// @notice Get the entropy fee required for a step
    function getEntropyFee() public view returns (uint256) {
        if (entropyEnabled && address(entropy) != address(0)) {
            return entropy.getFee(entropyProvider);
        }
        return 0; // No fee if entropy disabled
    }

    /// @notice Get minimum value needed to start a game (bet + entropy fee)
    function getMinimumGameValue() public view returns (uint256) {
        return getEntropyFee() + 1 wei; // minimum bet of 1 wei + entropy fee
    }
    
    /// @notice Toggle entropy usage (only for debugging)
    function setEntropyEnabled(bool _enabled) external {
        entropyEnabled = _enabled;
    }

    /* ───────────────────────  Helpers  ──────────────────────── */

    function _probability(Difficulty diff) private pure returns (uint16) {
        if (diff == Difficulty.Easy) return PROB_EASY;
        if (diff == Difficulty.Medium) return PROB_MEDIUM;
        if (diff == Difficulty.Hard) return PROB_HARD;
        return PROB_HARDCORE;
    }

    function _maxSteps(Difficulty diff) private pure returns (uint8) {
        if (diff == Difficulty.Easy) return MAX_EASY;
        if (diff == Difficulty.Medium) return MAX_MEDIUM;
        if (diff == Difficulty.Hard) return MAX_HARD;
        return MAX_HARDCORE;
    }

    function _calcPayout(
        Difficulty diff,
        uint8 step,
        uint256 bet
    ) private view returns (uint256) {
        if (step == 0) return bet; // nothing gained yet
        uint256 m = multipliers[diff][step]; // × 10 000 fixed‑point
        return (bet * m) / 10_000;
    }

    function _isWin(uint256 random, uint256 threshold) internal pure returns (bool) {
        // Map random number to range [0, 9999]
        uint256 bp = random % 10000;
        return bp < threshold;
    }

    /* ──────  house‑keeping  ───── */

    receive() external payable {}
    fallback() external payable {}
}
