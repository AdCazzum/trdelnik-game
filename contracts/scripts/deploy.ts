import { ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = Number(network.chainId);
  
  console.log(`🌐 Detected network: ${networkName} (Chain ID: ${chainId})`);
  
  let contractName: string;
  
  // Automatic contract selection based on network
  if (chainId === 80094 || chainId === 80069) {
    // Berachain mainnet (80094) or Bepolia testnet (80069)
    contractName = "BerachainGame";
    console.log("🐻 Berachain network detected → Deploying BerachainGame");
  } else if (chainId === 14 || chainId === 114) {
    // Flare mainnet (14) or Coston2 testnet (114)
    contractName = "TrdelnikGame";
    console.log("🔥 Flare network detected → Deploying TrdelnikGame");
  } else {
    console.error(`❌ Unsupported network: ${networkName} (Chain ID: ${chainId})`);
    console.error("Supported networks:");
    console.error("  - Berachain (80094) → BerachainGame");
    console.error("  - Bepolia (80069) → BerachainGame");
    console.error("  - Flare (14) → TrdelnikGame");
    console.error("  - Coston2 (114) → TrdelnikGame");
    process.exit(1);
  }
  
  console.log(`📦 Deploying ${contractName}...`);
  
  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy();
    
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    
    console.log(`✅ ${contractName} deployed successfully!`);
    console.log(`📍 Contract address: ${address}`);
    console.log(`🌐 Network: ${networkName} (Chain ID: ${chainId})`);
    
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
    
    return address;
    
  } catch (error: any) {
    console.error(`💥 Deployment failed:`, error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exitCode = 1;
}); 