import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const config = {
    platformFeePercent: 250, // 2.5%
    escrowPeriod: 7 * 24 * 60 * 60, // 7 days
    disputePeriod: 3 * 24 * 60 * 60, // 3 days
    baseRewardRate: 1000, // 10% APY
    bookingRewardPercent: 100, // 1% of booking amount
    minimumStakeAmount: ethers.parseEther("0.1"),
  };

  console.log("Deployment configuration:", config);

  // Deploy BookingManager
  console.log("\n1. Deploying BookingManager...");
  const BookingManager = await ethers.getContractFactory("BookingManager");
  const bookingManager = await upgrades.deployProxy(
    BookingManager,
    [deployer.address, deployer.address, config.platformFeePercent],
    { initializer: "initialize" }
  );
  await bookingManager.waitForDeployment();
  const bookingManagerAddress = await bookingManager.getAddress();
  console.log("BookingManager deployed to:", bookingManagerAddress);

  // Deploy UserReputation
  console.log("\n2. Deploying UserReputation...");
  const UserReputation = await ethers.getContractFactory("UserReputation");
  const userReputation = await upgrades.deployProxy(
    UserReputation,
    [deployer.address],
    { initializer: "initialize" }
  );
  await userReputation.waitForDeployment();
  const userReputationAddress = await userReputation.getAddress();
  console.log("UserReputation deployed to:", userReputationAddress);

  // Deploy PaymentTracker
  console.log("\n3. Deploying PaymentTracker...");
  const PaymentTracker = await ethers.getContractFactory("PaymentTracker");
  const paymentTracker = await upgrades.deployProxy(
    PaymentTracker,
    [deployer.address, deployer.address, config.escrowPeriod, config.disputePeriod],
    { initializer: "initialize" }
  );
  await paymentTracker.waitForDeployment();
  const paymentTrackerAddress = await paymentTracker.getAddress();
  console.log("PaymentTracker deployed to:", paymentTrackerAddress);

  // Deploy RewardSystem
  console.log("\n4. Deploying RewardSystem...");
  const RewardSystem = await ethers.getContractFactory("RewardSystem");
  const rewardSystem = await upgrades.deployProxy(
    RewardSystem,
    [
      deployer.address,
      deployer.address, // reward pool
      config.baseRewardRate,
      config.bookingRewardPercent,
      config.minimumStakeAmount,
    ],
    { initializer: "initialize" }
  );
  await rewardSystem.waitForDeployment();
  const rewardSystemAddress = await rewardSystem.getAddress();
  console.log("RewardSystem deployed to:", rewardSystemAddress);

  // Deploy NomadoAI main contract
  console.log("\n5. Deploying NomadoAI main contract...");
  const NomadoAI = await ethers.getContractFactory("NomadoAI");
  const nomadoAI = await upgrades.deployProxy(
    NomadoAI,
    [
      deployer.address,
      deployer.address, // fee recipient
      config.platformFeePercent,
      config.escrowPeriod,
      config.disputePeriod,
      config.baseRewardRate,
      config.bookingRewardPercent,
    ],
    { initializer: "initialize" }
  );
  await nomadoAI.waitForDeployment();
  const nomadoAIAddress = await nomadoAI.getAddress();
  console.log("NomadoAI deployed to:", nomadoAIAddress);

  // Initialize contracts in NomadoAI
  console.log("\n6. Initializing contract connections...");
  await nomadoAI.initializeContracts(
    bookingManagerAddress,
    userReputationAddress,
    paymentTrackerAddress,
    rewardSystemAddress
  );
  console.log("Contract connections initialized");

  // Set authorizations
  console.log("\n7. Setting up authorizations...");
  
  // Authorize NomadoAI in all sub-contracts
  await userReputation.setContractAuthorization(nomadoAIAddress, true);
  await paymentTracker.setContractAuthorization(nomadoAIAddress, true);
  await rewardSystem.setContractAuthorization(nomadoAIAddress, true);
  
  // Authorize BookingManager in UserReputation and RewardSystem
  await userReputation.setContractAuthorization(bookingManagerAddress, true);
  await rewardSystem.setContractAuthorization(bookingManagerAddress, true);
  
  console.log("Authorizations set up successfully");

  // Verify deployments
  console.log("\n8. Verifying deployments...");
  console.log("BookingManager owner:", await bookingManager.owner());
  console.log("UserReputation owner:", await userReputation.owner());
  console.log("PaymentTracker owner:", await paymentTracker.owner());
  console.log("RewardSystem owner:", await rewardSystem.owner());
  console.log("NomadoAI owner:", await nomadoAI.owner());

  // Summary
  console.log("\n=========== DEPLOYMENT SUMMARY ===========");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("");
  console.log("Contract Addresses:");
  console.log("NomadoAI (Main):", nomadoAIAddress);
  console.log("BookingManager:", bookingManagerAddress);
  console.log("UserReputation:", userReputationAddress);
  console.log("PaymentTracker:", paymentTrackerAddress);
  console.log("RewardSystem:", rewardSystemAddress);
  console.log("");
  console.log("Configuration:");
  console.log("Platform Fee:", config.platformFeePercent / 100, "%");
  console.log("Escrow Period:", config.escrowPeriod / (24 * 60 * 60), "days");
  console.log("Dispute Period:", config.disputePeriod / (24 * 60 * 60), "days");
  console.log("Base Reward Rate:", config.baseRewardRate / 100, "% APY");
  console.log("Booking Reward:", config.bookingRewardPercent / 100, "%");
  console.log("Minimum Stake:", ethers.formatEther(config.minimumStakeAmount), "ETH");
  console.log("==========================================");

  // Save deployment info to file
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      NomadoAI: nomadoAIAddress,
      BookingManager: bookingManagerAddress,
      UserReputation: userReputationAddress,
      PaymentTracker: paymentTrackerAddress,
      RewardSystem: rewardSystemAddress,
    },
    config,
  };

  console.log("\nDeployment completed successfully!");
  console.log("Save this deployment info for future reference:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
