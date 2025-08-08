import { ethers, network } from "hardhat";

async function main() {
  console.log("🔍 Debug: Checking Hedera network connection...\n");
  
  try {
    console.log(`Network: ${network.name}`);
    console.log(`Network Config:`, network.config);
    
    console.log("\n📡 Testing provider connection...");
    const provider = ethers.provider;
    const networkInfo = await provider.getNetwork();
    console.log(`Chain ID: ${networkInfo.chainId}`);
    console.log(`Network Name: ${networkInfo.name}`);
    
    console.log("\n👤 Testing signers...");
    const signers = await ethers.getSigners();
    console.log(`Number of signers: ${signers.length}`);
    
    if (signers.length > 0) {
      const deployer = signers[0];
      console.log(`Deployer address: ${deployer.address}`);
      
      const balance = await provider.getBalance(deployer.address);
      console.log(`Balance: ${ethers.formatEther(balance)} HBAR`);
    } else {
      console.log("❌ No signers found!");
      console.log("Check your PRIVATE_KEY in .env file");
    }
    
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

main().catch(console.error);
