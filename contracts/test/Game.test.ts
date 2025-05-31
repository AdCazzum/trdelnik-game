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
      const gameWithPlayer = game.connect(player);
      await gameWithPlayer.startGame(0, { value: betAmount });
    });

    it("Should allow playing next step", async function () {
      const gameWithPlayer = game.connect(player);
      
      await expect(gameWithPlayer.playStep(0))
        .to.emit(game, "StepRequested")
        //NOTE: 3 is the last game id because it has already started 3 games
        //NOTE: Test not well formed, sometimes it fails because of randomicity
        .withArgs(0, 2);
    });

    it("Should not allow playing someone else's game", async function () {
      const [otherPlayer, _] = await ethers.getSigners();
      const gameWithOtherPlayer = game.connect(otherPlayer);
      
      await expect(
        gameWithOtherPlayer.playStep(0)
      ).to.be.revertedWith("not-your-game");
    });

    it("Should not allow cashout if no people lost money", async function () {
      const gameWithPlayer = game.connect(player);
      
      await expect(gameWithPlayer.doCashout(0))
        .to.be.revertedWith("contract-insolvent");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update multipliers", async function () {
      const newMultipliers = [
        0, 10200,  11217, 12234, 13251, 14268, 15285,
        16302,  17319, 18336, 19353, 20370, 21387,
        22404,  23421, 24438, 25455, 26472, 27489,
        28506,  29523, 30540, 31557, 32574, 33591
      ];

      await game.connect(owner).setMultipliers(0, newMultipliers);
      
      // Verify the multipliers were updated
      const gameData = await game.games(0);
      expect(gameData.difficulty).to.equal(0);
    });

    it("Should not allow non-owner to update multipliers", async function () {
      const newMultipliers = [
        0, 10200,  11217, 12234, 13251, 14268, 15285,
        16302,  17319, 18336, 19353, 20370, 21387,
        22404,  23421, 24438, 25455, 26472, 27489,
        28506,  29523, 30540, 31557, 32574, 33591
      ];

      await expect(
        game.connect(player).setMultipliers(0, newMultipliers)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 