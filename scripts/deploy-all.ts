import { ethers, upgrades, network } from "hardhat";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

interface DeploymentAddresses {
  network: string;
  deployer: string;
  timestamp: string;
  contracts: {
    BookingManager: string;
    UserReputation: string;
    PaymentTracker: string;
    RewardSystem: string;
    NomadoAI: string;
  };
  transactionHashes: {
    BookingManager: string;
    UserReputation: string;
    PaymentTracker: string;
    RewardSystem: string;
    NomadoAI: string;
  };
}

async function main() {
  console.log("🚀 Starting Nomado AI Smart Contract Deployment...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployment Details:");
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const deploymentAddresses: DeploymentAddresses = {
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      BookingManager: "",
      UserReputation: "",
      PaymentTracker: "",
      RewardSystem: "",
      NomadoAI: ""
    },
    transactionHashes: {
      BookingManager: "",
      UserReputation: "",
      PaymentTracker: "",
      RewardSystem: "",
      NomadoAI: ""
    }
  };

  try {
    // 1. Deploy BookingManager
    console.log("📦 Deploying BookingManager...");
    const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
    const bookingManager = await upgrades.deployProxy(
      BookingManagerFactory,
      [
        deployer.address,        // owner
        deployer.address,        // fee recipient  
        250                      // platform fee (2.5%)
      ],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );
    await bookingManager.waitForDeployment();
    const bookingManagerAddress = await bookingManager.getAddress();
    const bookingManagerTx = bookingManager.deploymentTransaction();
    
    deploymentAddresses.contracts.BookingManager = bookingManagerAddress;
    deploymentAddresses.transactionHashes.BookingManager = bookingManagerTx?.hash || "";
    
    console.log(`✅ BookingManager deployed to: ${bookingManagerAddress}`);
    console.log(`   Transaction: ${bookingManagerTx?.hash}\n`);

    // 2. Deploy UserReputation
    console.log("📦 Deploying UserReputation...");
    const UserReputationFactory = await ethers.getContractFactory("UserReputation");
    const userReputation = await upgrades.deployProxy(
      UserReputationFactory,
      [deployer.address],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );
    await userReputation.waitForDeployment();
    const userReputationAddress = await userReputation.getAddress();
    const userReputationTx = userReputation.deploymentTransaction();
    
    deploymentAddresses.contracts.UserReputation = userReputationAddress;
    deploymentAddresses.transactionHashes.UserReputation = userReputationTx?.hash || "";
    
    console.log(`✅ UserReputation deployed to: ${userReputationAddress}`);
    console.log(`   Transaction: ${userReputationTx?.hash}\n`);

    // 3. Deploy PaymentTracker
    console.log("📦 Deploying PaymentTracker...");
    const PaymentTrackerFactory = await ethers.getContractFactory("PaymentTracker");
    const paymentTracker = await upgrades.deployProxy(
      PaymentTrackerFactory,
      [
        deployer.address,        // owner
        deployer.address,        // platform wallet
        86400,                   // escrow period (1 day)
        604800                   // dispute period (7 days)
      ],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );
    await paymentTracker.waitForDeployment();
    const paymentTrackerAddress = await paymentTracker.getAddress();
    const paymentTrackerTx = paymentTracker.deploymentTransaction();
    
    deploymentAddresses.contracts.PaymentTracker = paymentTrackerAddress;
    deploymentAddresses.transactionHashes.PaymentTracker = paymentTrackerTx?.hash || "";
    
    console.log(`✅ PaymentTracker deployed to: ${paymentTrackerAddress}`);
    console.log(`   Transaction: ${paymentTrackerTx?.hash}\n`);

    // 4. Deploy RewardSystem
    console.log("📦 Deploying RewardSystem...");
    const RewardSystemFactory = await ethers.getContractFactory("RewardSystem");
    const rewardSystem = await upgrades.deployProxy(
      RewardSystemFactory,
      [
        deployer.address,                // owner
        deployer.address,                // reward pool
        1000,                           // base reward rate (10% APY)
        100,                            // booking reward percent (1%)
        ethers.parseEther("0.1")        // minimum stake amount
      ],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );
    await rewardSystem.waitForDeployment();
    const rewardSystemAddress = await rewardSystem.getAddress();
    const rewardSystemTx = rewardSystem.deploymentTransaction();
    
    deploymentAddresses.contracts.RewardSystem = rewardSystemAddress;
    deploymentAddresses.transactionHashes.RewardSystem = rewardSystemTx?.hash || "";
    
    console.log(`✅ RewardSystem deployed to: ${rewardSystemAddress}`);
    console.log(`   Transaction: ${rewardSystemTx?.hash}\n`);

    // 5. Deploy NomadoAI (Main Contract)
    console.log("📦 Deploying NomadoAI...");
    const NomadoAIFactory = await ethers.getContractFactory("NomadoAI");
    const nomadoAI = await upgrades.deployProxy(
      NomadoAIFactory,
      [
        deployer.address,        // owner
        deployer.address,        // fee recipient
        250,                     // platform fee (2.5%)
        86400,                   // escrow period (1 day)
        604800,                  // dispute period (7 days)
        1000,                    // base reward rate (10% APY)
        100                      // booking reward percent (1%)
      ],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );
    await nomadoAI.waitForDeployment();
    const nomadoAIAddress = await nomadoAI.getAddress();
    const nomadoAITx = nomadoAI.deploymentTransaction();
    
    deploymentAddresses.contracts.NomadoAI = nomadoAIAddress;
    deploymentAddresses.transactionHashes.NomadoAI = nomadoAITx?.hash || "";
    
    console.log(`✅ NomadoAI deployed to: ${nomadoAIAddress}`);
    console.log(`   Transaction: ${nomadoAITx?.hash}\n`);

    // 6. Setup Contract Integration
    console.log("🔗 Setting up contract integration...");
    
    // Authorize NomadoAI in other contracts
    console.log("   Authorizing NomadoAI in UserReputation...");
    await userReputation.setContractAuthorization(nomadoAIAddress, true);
    
    console.log("   Authorizing NomadoAI in PaymentTracker...");
    await paymentTracker.setContractAuthorization(nomadoAIAddress, true);
    
    console.log("   Authorizing NomadoAI in RewardSystem...");
    await rewardSystem.setContractAuthorization(nomadoAIAddress, true);
    
    // Initialize contracts in NomadoAI
    console.log("   Initializing contracts in NomadoAI...");
    await nomadoAI.initializeContracts(
      bookingManagerAddress,
      userReputationAddress,
      paymentTrackerAddress,
      rewardSystemAddress
    );
    
    console.log("✅ Contract integration completed!\n");

    // 7. Save deployment addresses
    const deploymentsDir = join(__dirname, "..", "deployments");
    const networkFile = join(deploymentsDir, `${network.name}.json`);
    
    try {
      writeFileSync(networkFile, JSON.stringify(deploymentAddresses, null, 2));
      console.log(`📄 Deployment addresses saved to: ${networkFile}`);
    } catch (error) {
      console.log("⚠️  Could not save deployment addresses file");
    }

    // 8. Deployment Summary
    console.log("\n🎉 Deployment Summary:");
    console.log("====================");
    console.log(`Network: ${network.name}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Timestamp: ${deploymentAddresses.timestamp}\n`);
    
    console.log("📍 Contract Addresses:");
    console.log(`BookingManager:  ${bookingManagerAddress}`);
    console.log(`UserReputation:  ${userReputationAddress}`);
    console.log(`PaymentTracker:  ${paymentTrackerAddress}`);
    console.log(`RewardSystem:    ${rewardSystemAddress}`);
    console.log(`NomadoAI:        ${nomadoAIAddress}\n`);
    
    console.log("🔗 Integration Status:");
    console.log("✅ All contracts authorized and linked");
    console.log("✅ Platform ready for use");
    console.log("✅ Upgradeable proxy pattern implemented");
    
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log(`\n🔍 Verify contracts on block explorer:`);
      console.log(`npx hardhat verify ${bookingManagerAddress} --network ${network.name}`);
      console.log(`npx hardhat verify ${userReputationAddress} --network ${network.name}`);
      console.log(`npx hardhat verify ${paymentTrackerAddress} --network ${network.name}`);
      console.log(`npx hardhat verify ${rewardSystemAddress} --network ${network.name}`);
      console.log(`npx hardhat verify ${nomadoAIAddress} --network ${network.name}`);
    }

    return deploymentAddresses;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then((addresses) => {
    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
