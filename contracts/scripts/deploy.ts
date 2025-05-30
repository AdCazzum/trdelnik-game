import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TrdelnikGame contract...");

  const TrdelnikGame = await ethers.getContractFactory("TrdelnikGame");
  const game = await TrdelnikGame.deploy();

  await game.waitForDeployment();

  const address = await game.getAddress();
  console.log(`TrdelnikGame contract deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 