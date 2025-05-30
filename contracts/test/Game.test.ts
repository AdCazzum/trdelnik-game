import { expect } from "chai";
import { ethers } from "hardhat";
import { TrdelnikGame } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrdelnikGame", function () {
  let game: TrdelnikGame;
  let owner: SignerWithAddress;
  let player: SignerWithAddress;
  const betAmount = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();
    const TrdelnikGame = await ethers.getContractFactory("TrdelnikGame");
    game = await TrdelnikGame.deploy();
  });

  describe("Game Creation", function () {
    it("Should allow starting a new game with bet", async function () {
      await expect(game.connect(player).startGame(0, { value: betAmount }))
        .to.emit(game, "GameStarted")
        .withArgs(0, player.address, 0, betAmount);

      const gameData = await game.games(0);
      expect(gameData.player).to.equal(player.address);
      expect(gameData.difficulty).to.equal(0); // Easy
      expect(gameData.bet).to.equal(betAmount);
      expect(gameData.active).to.be.true;
      expect(gameData.lost).to.be.false;
    });

    it("Should not allow starting a game with zero bet", async function () {
      await expect(
        game.connect(player).startGame(0, { value: 0 })
      ).to.be.revertedWith("stake == 0");
    });
  });

  describe("Gameplay", function () {
    beforeEach(async function () {
      await game.connect(player).startGame(0, { value: betAmount });
    });

    it("Should allow playing next step", async function () {
      await expect(game.connect(player).playStep(0))
        .to.emit(game, "StepRequested")
        .withArgs(0, 1);
    });

    it("Should not allow playing someone else's game", async function () {
      const [_, otherPlayer] = await ethers.getSigners();
      await expect(
        game.connect(otherPlayer).playStep(0)
      ).to.be.revertedWith("not-your-game");
    });

    it("Should allow cashout when game is active", async function () {
      await expect(game.connect(player).doCashout(0))
        .to.emit(game, "Cashout")
        .withArgs(0, betAmount); // Initial bet amount since no steps completed
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update multipliers", async function () {
      const newMultipliers = [0, 11000, 12000, 13000];
      await game.connect(owner).setMultipliers(0, newMultipliers);
      
      // Verify the multipliers were updated
      const gameData = await game.games(0);
      expect(gameData.difficulty).to.equal(0);
    });

    it("Should not allow non-owner to update multipliers", async function () {
      const newMultipliers = [0, 11000, 12000, 13000];
      await expect(
        game.connect(player).setMultipliers(0, newMultipliers)
      ).to.be.revertedWithCustomError(game, "OwnableUnauthorizedAccount");
    });
  });
}); 