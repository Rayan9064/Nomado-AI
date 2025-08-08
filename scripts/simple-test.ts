import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Nomado AI Simplified Test...\n");

  const [owner, customer1, serviceProvider1] = await ethers.getSigners();
  
  console.log("👥 Accounts:");
  console.log(`Owner: ${owner.address}`);
  console.log(`Customer: ${customer1.address}`);
  console.log(`Service Provider: ${serviceProvider1.address}\n`);

  // Deploy contracts individually
  console.log("📦 Deploying contracts...");
  
  const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = await upgrades.deployProxy(BookingManagerFactory, [
    owner.address, owner.address, 250
  ], { initializer: "initialize" });

  const UserReputationFactory = await ethers.getContractFactory("UserReputation");
  const userReputation = await upgrades.deployProxy(UserReputationFactory, [
    owner.address
  ], { initializer: "initialize" });

  const PaymentTrackerFactory = await ethers.getContractFactory("PaymentTracker");
  const paymentTracker = await upgrades.deployProxy(PaymentTrackerFactory, [
    owner.address, owner.address, 86400, 604800
  ], { initializer: "initialize" });

  const RewardSystemFactory = await ethers.getContractFactory("RewardSystem");
  const rewardSystem = await upgrades.deployProxy(RewardSystemFactory, [
    owner.address, owner.address, 1000, 100, ethers.parseEther("0.1")
  ], { initializer: "initialize" });

  const NomadoAIFactory = await ethers.getContractFactory("NomadoAI");
  const nomadoAI = await upgrades.deployProxy(NomadoAIFactory, [
    owner.address, owner.address, 250, 86400, 604800, 1000, 100
  ], { initializer: "initialize" });

  console.log("✅ All contracts deployed!");

  // Authorize contracts
  await userReputation.setContractAuthorization(await nomadoAI.getAddress(), true);
  await paymentTracker.setContractAuthorization(await nomadoAI.getAddress(), true);
  await rewardSystem.setContractAuthorization(await nomadoAI.getAddress(), true);

  // Initialize NomadoAI
  await nomadoAI.initializeContracts(
    await bookingManager.getAddress(),
    await userReputation.getAddress(),
    await paymentTracker.getAddress(),
    await rewardSystem.getAddress()
  );

  console.log("✅ Contracts linked!\n");

  // Test simple booking
  console.log("🏨 Creating booking...");
  
  try {
    const tx = await nomadoAI.connect(customer1).createBookingWithPayment(
      1, // HOTEL
      Math.floor(Date.now() / 1000) + 86400 * 7,
      "QmTestHash",
      true,
      Math.floor(Date.now() / 1000) + 86400 * 6,
      serviceProvider1.address,
      { value: ethers.parseEther("1.0") }
    );
    
    await tx.wait();
    console.log("✅ Booking created successfully!");
    
    // Get platform stats
    const stats = await nomadoAI.getPlatformStats();
    console.log(`📊 Platform Stats:`);
    console.log(`   Total Bookings: ${stats.totalBookings}`);
    console.log(`   Total Payments: ${stats.totalPayments}`);
    
  } catch (error: any) {
    console.error("❌ Booking failed:", error.message);
    
    // Try to get more details
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.code) {
      console.error("Error Code:", error.code);
    }
  }

  console.log("\n🎉 Simplified test completed!");
}

main().catch(console.error);
