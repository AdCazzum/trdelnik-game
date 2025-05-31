import { ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = Number(network.chainId);
  
  console.log(`🌐 Detected network: ${networkName} (Chain ID: ${chainId})`);
  
  let contractName: string;
  let deploymentArgs: any[] = [];
  
  // Automatic contract selection based on network
  if (chainId === 80094 || chainId === 80069) {
    // Berachain mainnet (80094) or Bepolia testnet (80069)
    contractName = "BerachainGame";
    console.log("🐻 Berachain network detected → Deploying BerachainGame with Pyth Entropy");
    
    // Pyth Entropy configuration
    let entropyAddress: string;
    let entropyProvider: string;
    
    if (chainId === 80094) {
      // Berachain mainnet
      console.log("🐻 Berachain mainnet detected");
      // TODO: Update these addresses when Pyth Entropy is deployed on Berachain mainnet
      entropyAddress = process.env.BERACHAIN_ENTROPY_ADDRESS || "0x0000000000000000000000000000000000000000";
      entropyProvider = process.env.BERACHAIN_ENTROPY_PROVIDER || "0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344";
    } else {
      // Bepolia testnet
      console.log("🧪 Bepolia testnet detected");
      // TODO: Update these addresses when Pyth Entropy is deployed on Bepolia testnet
      entropyAddress = process.env.BEPOLIA_ENTROPY_ADDRESS || "0x0000000000000000000000000000000000000000";
      entropyProvider = process.env.BEPOLIA_ENTROPY_PROVIDER || "0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344";
    }

    // Validate entropy addresses
    if (entropyAddress === "0x0000000000000000000000000000000000000000") {
      console.error("❌ Entropy contract address not configured for this network");
      console.error("Please set environment variables:");
      console.error(chainId === 80094 ? "  BERACHAIN_ENTROPY_ADDRESS=0x..." : "  BEPOLIA_ENTROPY_ADDRESS=0x...");
      console.error("You can find Pyth Entropy contract addresses at: https://docs.pyth.network/entropy");
      process.exit(1);
    }

    deploymentArgs = [entropyAddress, entropyProvider];
    console.log(`🔀 Entropy Contract: ${entropyAddress}`);
    console.log(`⚡ Entropy Provider: ${entropyProvider}`);
    
  } else if (chainId === 14 || chainId === 114) {
    // Flare mainnet (14) or Coston2 testnet (114)
    contractName = "TrdelnikGame";
    console.log("🔥 Flare network detected → Deploying TrdelnikGame");
    deploymentArgs = []; // TrdelnikGame doesn't require constructor parameters
  } else {
    console.error(`❌ Unsupported network: ${networkName} (Chain ID: ${chainId})`);
    console.error("Supported networks:");
    console.error("  - Berachain (80094) → BerachainGame + Pyth Entropy");
    console.error("  - Bepolia (80069) → BerachainGame + Pyth Entropy");
    console.error("  - Flare (14) → TrdelnikGame");
    console.error("  - Coston2 (114) → TrdelnikGame");
    process.exit(1);
  }
  
  console.log(`📦 Deploying ${contractName}...`);
  
  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    
    // Deploy with appropriate arguments
    const contract = deploymentArgs.length > 0 
      ? await ContractFactory.deploy(...deploymentArgs)
      : await ContractFactory.deploy();
    
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    
    console.log(`✅ ${contractName} deployed successfully!`);
    console.log(`📍 Contract address: ${address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    
    // For BerachainGame, try to get entropy fee info
    if (contractName === "BerachainGame") {
      try {
        const entropyFeeResult = await contract.getFunction("getEntropyFee")();
        const minimumGameValueResult = await contract.getFunction("getMinimumGameValue")();
        
        console.log(`💰 Entropy Fee: ${ethers.formatEther(entropyFeeResult)} BERA`);
        console.log(`🎮 Minimum Game Value: ${ethers.formatEther(minimumGameValueResult)} BERA`);
      } catch (error) {
        console.warn(`⚠️  Could not fetch entropy fee (this is normal if entropy contracts are not yet deployed)`);
      }
    }
    
    // Show explorer link
    let explorerUrl: string;
    switch (chainId) {
      case 80094:
        explorerUrl = `https://berascan.com/address/${address}`;
        break;
      case 80069:
        explorerUrl = `https://bepolia.beratrail.io/address/${address}`;
        break;
      case 14:
        explorerUrl = `https://flare-explorer.flare.network/address/${address}`;
        break;
      case 114:
        explorerUrl = `https://coston2-explorer.flare.network/address/${address}`;
        break;
      default:
        explorerUrl = "Unknown explorer";
    }
    
    console.log(`🔍 View on explorer: ${explorerUrl}`);
    
    // Show next steps
    if (contractName === "BerachainGame") {
      console.log(`\n📋 Next Steps for BerachainGame:`);
      console.log(`1. 🔐 Update frontend .env with contract address:`);
      console.log(`   VITE_BERACHAIN_CONTRACT_ADDRESS=${address}`);
      console.log(`2. 🎮 Update frontend to handle new function signatures:`);
      console.log(`   - startGame(difficulty, userRandomNumber) + entropy fee`);
      console.log(`   - playStep(gameId, userRandomNumber) + entropy fee`);
    } else {
      console.log(`\n📋 Next Steps for TrdelnikGame:`);
      console.log(`1. 🔐 Update frontend .env with contract address:`);
      console.log(`   VITE_COSTON2_CONTRACT_ADDRESS=${address}`);
      console.log(`2. 🎮 Use standard function signatures:`);
      console.log(`   - startGame(difficulty)`);
      console.log(`   - playStep(gameId)`);
    }
    
    return address;
    
  } catch (error: any) {
    console.error(`💥 Deployment failed:`, error.message);
    
    if (error.message.includes("entropy") && contractName === "BerachainGame") {
      console.error(`\n🔧 Troubleshooting Entropy Issues:`);
      console.error(`1. Ensure Pyth Entropy is deployed on ${networkName}`);
      console.error(`2. Verify entropy contract address in environment variables`);
      console.error(`3. Check entropy provider address: ${deploymentArgs[1]}`);
      console.error(`4. Visit https://docs.pyth.network/entropy for latest addresses`);
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exitCode = 1;
}); 