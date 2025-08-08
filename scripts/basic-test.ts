import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Basic Contract Test...\n");

  const [owner, customer1, serviceProvider1] = await ethers.getSigners();
  
  console.log("👥 Accounts:");
  console.log(`Owner: ${owner.address}`);
  console.log(`Customer: ${customer1.address}\n`);

  // Deploy and test BookingManager only first
  console.log("📦 Testing BookingManager...");
  const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = await upgrades.deployProxy(BookingManagerFactory, [
    owner.address, owner.address, 250
  ], { initializer: "initialize" });

  console.log(`✅ BookingManager deployed at: ${await bookingManager.getAddress()}`);

  // Test booking creation
  console.log("\n🏨 Creating booking...");
  const tx = await bookingManager.connect(customer1).createBooking(
    1, // HOTEL
    Math.floor(Date.now() / 1000) + 86400 * 7,
    "QmTestHash",
    true,
    Math.floor(Date.now() / 1000) + 86400 * 6,
    { value: ethers.parseEther("1.0") }
  );
  
  await tx.wait();
  console.log("✅ BookingManager booking created!");

  // Check booking details
  const booking = await bookingManager.getBooking(1);
  console.log(`📋 Booking: Customer=${booking.customer}, Amount=${ethers.formatEther(booking.amount)} ETH`);

  // Now test PaymentTracker
  console.log("\n💰 Testing PaymentTracker...");
  const PaymentTrackerFactory = await ethers.getContractFactory("PaymentTracker");
  const paymentTracker = await upgrades.deployProxy(PaymentTrackerFactory, [
    owner.address, owner.address, 86400, 604800
  ], { initializer: "initialize" });

  console.log(`✅ PaymentTracker deployed at: ${await paymentTracker.getAddress()}`);

  // Authorize owner to create payments
  await paymentTracker.setContractAuthorization(owner.address, true);

  // Test payment creation
  console.log("\n💳 Creating payment...");
  const paymentTx = await paymentTracker.connect(owner).createPayment(
    1, // booking ID
    serviceProvider1.address, // payee
    ethers.parseEther("0.025"), // platform fee (2.5%)
    true, // refundable
    Math.floor(Date.now() / 1000) + 86400 * 6, // refund deadline
    "NOMADO-1", // payment hash
    { value: ethers.parseEther("1.0") }
  );

  await paymentTx.wait();
  console.log("✅ PaymentTracker payment created!");

  const payment = await paymentTracker.getPayment(1);
  console.log(`📋 Payment: Payer=${payment.payer}, Amount=${ethers.formatEther(payment.amount)} ETH`);

  console.log("\n🎉 Basic tests completed successfully!");
  console.log("✅ Both BookingManager and PaymentTracker work independently");
  console.log("💡 The issue is in NomadoAI integration - it tries to send ETH to both contracts");
}

main().catch(console.error);
