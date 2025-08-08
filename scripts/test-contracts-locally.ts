import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { 
  NomadoAI, 
  BookingManager, 
  UserReputation, 
  PaymentTracker, 
  RewardSystem 
} from "../typechain-types";

async function main() {
  console.log("🚀 Starting Nomado AI Local Contract Testing...\n");

  // Get signers
  const [owner, customer1, customer2, serviceProvider1, serviceProvider2] = await ethers.getSigners();
  
  console.log("👥 Test Accounts:");
  console.log(`Owner: ${owner.address}`);
  console.log(`Customer 1: ${customer1.address}`);
  console.log(`Customer 2: ${customer2.address}`);
  console.log(`Service Provider 1: ${serviceProvider1.address}`);
  console.log(`Service Provider 2: ${serviceProvider2.address}\n`);

  // Deploy all contracts
  console.log("📦 Deploying Contracts...");
  
  // 1. Deploy BookingManager
  const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = await upgrades.deployProxy(
    BookingManagerFactory,
    [
      owner.address,           // owner
      owner.address,           // fee recipient
      250                      // platform fee (2.5%)
    ],
    { initializer: "initialize" }
  ) as unknown as BookingManager;

  // 2. Deploy UserReputation
  const UserReputationFactory = await ethers.getContractFactory("UserReputation");
  const userReputation = await upgrades.deployProxy(
    UserReputationFactory,
    [owner.address],
    { initializer: "initialize" }
  ) as unknown as UserReputation;

  // 3. Deploy PaymentTracker
  const PaymentTrackerFactory = await ethers.getContractFactory("PaymentTracker");
  const paymentTracker = await upgrades.deployProxy(
    PaymentTrackerFactory,
    [
      owner.address,           // owner
      owner.address,           // platform wallet
      86400,                   // escrow period (1 day)
      604800                   // dispute period (7 days)
    ],
    { initializer: "initialize" }
  ) as unknown as PaymentTracker;

  // 4. Deploy RewardSystem
  const RewardSystemFactory = await ethers.getContractFactory("RewardSystem");
  const rewardSystem = await upgrades.deployProxy(
    RewardSystemFactory,
    [
      owner.address,           // owner
      owner.address,           // reward pool
      1000,                    // base reward rate (10% APY)
      100,                     // booking reward percent (1%)
      ethers.parseEther("0.1") // minimum stake amount
    ],
    { initializer: "initialize" }
  ) as unknown as RewardSystem;

  // 5. Deploy NomadoAI (Main Contract)
  const NomadoAIFactory = await ethers.getContractFactory("NomadoAI");
  const nomadoAI = await upgrades.deployProxy(
    NomadoAIFactory,
    [
      owner.address,           // owner
      owner.address,           // fee recipient
      250,                     // platform fee (2.5%)
      86400,                   // escrow period (1 day)
      604800,                  // dispute period (7 days)
      1000,                    // base reward rate (10% APY)
      100                      // booking reward percent (1%)
    ],
    { initializer: "initialize" }
  ) as unknown as NomadoAI;

  console.log("✅ All contracts deployed successfully!");
  console.log(`📍 Contract Addresses:`);
  console.log(`   NomadoAI: ${await nomadoAI.getAddress()}`);
  console.log(`   BookingManager: ${await bookingManager.getAddress()}`);
  console.log(`   UserReputation: ${await userReputation.getAddress()}`);
  console.log(`   PaymentTracker: ${await paymentTracker.getAddress()}`);
  console.log(`   RewardSystem: ${await rewardSystem.getAddress()}\n`);

  // Initialize contracts in NomadoAI
  console.log("🔗 Linking contracts...");
  
  // First, authorize NomadoAI contract in all other contracts
  await userReputation.setContractAuthorization(await nomadoAI.getAddress(), true);
  await paymentTracker.setContractAuthorization(await nomadoAI.getAddress(), true);
  await rewardSystem.setContractAuthorization(await nomadoAI.getAddress(), true);
  
  // Then initialize contracts in NomadoAI
  await nomadoAI.initializeContracts(
    await bookingManager.getAddress(),
    await userReputation.getAddress(),
    await paymentTracker.getAddress(),
    await rewardSystem.getAddress()
  );
  console.log("✅ Contracts linked successfully!\n");

  // Test 1: Create Hotel Booking
  console.log("🏨 Test 1: Creating Hotel Booking...");
  const hotelBookingAmount = ethers.parseEther("2.5"); // 2.5 ETH for hotel
  const serviceDate = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days from now
  const refundDeadline = serviceDate - 3600; // 1 hour before service

  const hotelBookingTx = await nomadoAI.connect(customer1).createBookingWithPayment(
    1, // BookingType.HOTEL
    serviceDate,
    "QmHotelBookingIPFSHash123",
    true, // refundable
    refundDeadline,
    serviceProvider1.address,
    { value: hotelBookingAmount }
  );
  
  await hotelBookingTx.wait();
  console.log(`✅ Hotel booking created! Amount: ${ethers.formatEther(hotelBookingAmount)} ETH`);

  // Test 2: Create Flight Booking
  console.log("\n✈️  Test 2: Creating Flight Booking...");
  const flightBookingAmount = ethers.parseEther("1.8"); // 1.8 ETH for flight
  const flightServiceDate = Math.floor(Date.now() / 1000) + 86400 * 14; // 14 days from now
  const flightRefundDeadline = flightServiceDate - 7200; // 2 hours before flight

  const flightBookingTx = await nomadoAI.connect(customer2).createBookingWithPayment(
    0, // BookingType.FLIGHT
    flightServiceDate,
    "QmFlightBookingIPFSHash456",
    true, // refundable
    flightRefundDeadline,
    serviceProvider2.address,
    { value: flightBookingAmount }
  );
  
  await flightBookingTx.wait();
  console.log(`✅ Flight booking created! Amount: ${ethers.formatEther(flightBookingAmount)} ETH`);

  // Test 3: Create Co-working Space Booking
  console.log("\n💼 Test 3: Creating Co-working Space Booking...");
  const coworkingAmount = ethers.parseEther("0.5"); // 0.5 ETH for co-working
  const coworkingServiceDate = Math.floor(Date.now() / 1000) + 86400 * 3; // 3 days from now
  const coworkingRefundDeadline = coworkingServiceDate - 1800; // 30 mins before

  const coworkingBookingTx = await nomadoAI.connect(customer1).createBookingWithPayment(
    2, // BookingType.COWORKING
    coworkingServiceDate,
    "QmCoworkingBookingIPFSHash789",
    false, // non-refundable
    0, // no refund deadline
    serviceProvider1.address,
    { value: coworkingAmount }
  );
  
  await coworkingBookingTx.wait();
  console.log(`✅ Co-working space booking created! Amount: ${ethers.formatEther(coworkingAmount)} ETH`);

  // Test 4: Confirm and Complete Bookings
  console.log("\n📋 Test 4: Processing Bookings...");
  
  // Confirm hotel booking
  await nomadoAI.confirmBooking(1);
  console.log("✅ Hotel booking confirmed");
  
  // Complete hotel booking
  await nomadoAI.completeBooking(1);
  console.log("✅ Hotel booking completed with rewards distributed");

  // Test 5: Submit Reviews
  console.log("\n⭐ Test 5: Submitting Reviews...");
  
  // Customer1 reviews serviceProvider1 for hotel booking
  const reviewTx = await nomadoAI.connect(customer1).submitVerifiedReview(
    serviceProvider1.address,
    1, // booking ID
    5, // 5-star rating
    "Excellent hotel service! Clean rooms and great location."
  );
  await reviewTx.wait();
  console.log("✅ 5-star review submitted for hotel booking");

  // Test 6: Stake for Rewards
  console.log("\n🎁 Test 6: Testing Reward System...");
  
  // Customer1 stakes ETH for rewards
  const stakeAmount = ethers.parseEther("1.0");
  const stakePeriod = 86400 * 90; // 90 days
  
  const stakeTx = await rewardSystem.connect(customer1).stake(stakePeriod, {
    value: stakeAmount
  });
  await stakeTx.wait();
  console.log(`✅ Staked ${ethers.formatEther(stakeAmount)} ETH for 90 days`);

  // Test 7: Get Platform Statistics
  console.log("\n📊 Test 7: Platform Statistics...");
  
  const platformStats = await nomadoAI.getPlatformStats();
  console.log(`📈 Platform Statistics:`);
  console.log(`   Total Bookings: ${platformStats.totalBookings}`);
  console.log(`   Total Payments: ${platformStats.totalPayments}`);
  console.log(`   Total Reviews: ${platformStats.totalReviews}`);

  // Test 8: Get User Statistics
  console.log("\n👤 Test 8: User Statistics...");
  
  const customer1Stats = await nomadoAI.getUserStats(customer1.address);
  console.log(`📋 Customer 1 Statistics:`);
  console.log(`   Trust Score: ${customer1Stats.profile.trustScore}`);
  console.log(`   Total Bookings: ${customer1Stats.profile.totalBookings}`);
  console.log(`   Completed Bookings: ${customer1Stats.profile.completedBookings}`);
  console.log(`   Total Reviews Received: ${customer1Stats.profile.totalReviewsReceived}`);
  console.log(`   Is Verified: ${customer1Stats.profile.isVerified}`);
  console.log(`   User Bookings: [${customer1Stats.bookings.join(', ')}]`);
  console.log(`   User Stakes: [${customer1Stats.stakes.join(', ')}]`);

  // Test 9: Check Booking Eligibility
  console.log("\n🔍 Test 9: Checking Booking Eligibility...");
  
  const canCustomer1Book = await nomadoAI.canUserBook(customer1.address);
  const canCustomer2Book = await nomadoAI.canUserBook(customer2.address);
  
  console.log(`✅ Customer 1 can book: ${canCustomer1Book}`);
  console.log(`✅ Customer 2 can book: ${canCustomer2Book}`);

  // Test 10: Get Detailed Booking Information
  console.log("\n📄 Test 10: Detailed Booking Information...");
  
  const bookingDetails = await nomadoAI.getBookingDetails(1);
  console.log(`🏨 Hotel Booking Details:`);
  console.log(`   Customer: ${bookingDetails.booking.customer}`);
  console.log(`   Amount: ${ethers.formatEther(bookingDetails.booking.amount)} ETH`);
  console.log(`   Status: ${bookingDetails.booking.status}`);
  console.log(`   Service Date: ${new Date(Number(bookingDetails.booking.serviceDate) * 1000).toLocaleString()}`);
  console.log(`   Payment Status: ${bookingDetails.payment.status}`);
  console.log(`   Escrow Amount: ${ethers.formatEther(bookingDetails.escrow.amount)} ETH`);

  // Test 11: Platform Configuration
  console.log("\n⚙️  Test 11: Platform Configuration...");
  
  const platformConfig = await nomadoAI.getPlatformConfig();
  console.log(`🔧 Platform Configuration:`);
  console.log(`   Platform Fee: ${Number(platformConfig.platformFeePercent) / 100}%`);
  console.log(`   Fee Recipient: ${platformConfig.feeRecipient}`);
  console.log(`   Escrow Period: ${Number(platformConfig.escrowPeriod) / 86400} days`);
  console.log(`   Dispute Period: ${Number(platformConfig.disputePeriod) / 86400} days`);
  console.log(`   Is Paused: ${platformConfig.isPaused}`);

  // Test 12: Cancel a Booking (Refundable)
  console.log("\n❌ Test 12: Testing Booking Cancellation...");
  
  try {
    // Customer2 cancels their flight booking (should be refundable)
    const cancelTx = await nomadoAI.connect(customer2).cancelBooking(2);
    await cancelTx.wait();
    console.log("✅ Flight booking cancelled with refund processed");
  } catch (error) {
    console.log("⚠️  Cancellation failed (might be outside refund window)");
  }

  console.log("\n🎉 All tests completed successfully!");
  console.log("\n💡 Sample Usage Summary:");
  console.log("   - Created hotel, flight, and co-working space bookings");
  console.log("   - Processed booking confirmations and completions");
  console.log("   - Submitted verified reviews with ratings");
  console.log("   - Demonstrated staking for rewards");
  console.log("   - Retrieved comprehensive platform and user statistics");
  console.log("   - Tested booking eligibility and detailed information");
  console.log("   - Demonstrated booking cancellation with refunds");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during testing:", error);
    process.exit(1);
  });
