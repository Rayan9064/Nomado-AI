import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Deploying Nomado AI Contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy contracts in order
  console.log("📦 Deploying BookingManager...");
  const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = await upgrades.deployProxy(
    BookingManagerFactory,
    [
      deployer.address,        // owner
      deployer.address,        // fee recipient
      250                      // platform fee (2.5%)
    ],
    { initializer: "initialize" }
  );
  await bookingManager.waitForDeployment();
  console.log("✅ BookingManager deployed to:", await bookingManager.getAddress());

  console.log("📦 Deploying UserReputation...");
  const UserReputationFactory = await ethers.getContractFactory("UserReputation");
  const userReputation = await upgrades.deployProxy(
    UserReputationFactory,
    [deployer.address],
    { initializer: "initialize" }
  );
  await userReputation.waitForDeployment();
  console.log("✅ UserReputation deployed to:", await userReputation.getAddress());

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
    { initializer: "initialize" }
  );
  await paymentTracker.waitForDeployment();
  console.log("✅ PaymentTracker deployed to:", await paymentTracker.getAddress());

  console.log("📦 Deploying RewardSystem...");
  const RewardSystemFactory = await ethers.getContractFactory("RewardSystem");
  const rewardSystem = await upgrades.deployProxy(
    RewardSystemFactory,
    [
      deployer.address,        // owner
      deployer.address,        // reward pool
      1000,                    // base reward rate (10% APY)
      100,                     // booking reward percent (1%)
      ethers.parseEther("0.1") // minimum stake amount
    ],
    { initializer: "initialize" }
  );
  await rewardSystem.waitForDeployment();
  console.log("✅ RewardSystem deployed to:", await rewardSystem.getAddress());

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
    { initializer: "initialize" }
  );
  await nomadoAI.waitForDeployment();
  console.log("✅ NomadoAI deployed to:", await nomadoAI.getAddress());

  // Initialize contracts
  console.log("\n🔗 Linking contracts...");
  await nomadoAI.initializeContracts(
    await bookingManager.getAddress(),
    await userReputation.getAddress(),
    await paymentTracker.getAddress(),
    await rewardSystem.getAddress()
  );
  console.log("✅ All contracts linked successfully!");

  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log(`NomadoAI:        ${await nomadoAI.getAddress()}`);
  console.log(`BookingManager:  ${await bookingManager.getAddress()}`);
  console.log(`UserReputation:  ${await userReputation.getAddress()}`);
  console.log(`PaymentTracker:  ${await paymentTracker.getAddress()}`);
  console.log(`RewardSystem:    ${await rewardSystem.getAddress()}`);
  console.log("=====================================");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Run: npm run test:local");
  console.log("2. Or use the deployed addresses for frontend integration");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
