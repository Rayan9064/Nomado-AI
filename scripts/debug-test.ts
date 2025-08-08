import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
  console.log("🔍 Debug Test - Isolated Contract Testing...\n");

  // Get signers
  const [owner, customer1, serviceProvider1] = await ethers.getSigners();
  
  console.log("👥 Test Accounts:");
  console.log(`Owner: ${owner.address}`);
  console.log(`Customer 1: ${customer1.address}`);
  console.log(`Service Provider 1: ${serviceProvider1.address}\n`);

  // Deploy BookingManager only
  console.log("📦 Deploying BookingManager...");
  const BookingManagerFactory = await ethers.getContractFactory("BookingManager");
  const bookingManager = await upgrades.deployProxy(
    BookingManagerFactory,
    [
      owner.address,           // owner
      owner.address,           // fee recipient
      250                      // platform fee (2.5%)
    ],
    { initializer: "initialize" }
  );

  console.log(`✅ BookingManager deployed at: ${await bookingManager.getAddress()}\n`);

  // Test direct booking creation
  console.log("🏨 Test: Creating Hotel Booking Directly...");
  const hotelBookingAmount = ethers.parseEther("2.5");
  const serviceDate = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days from now
  const refundDeadline = serviceDate - 3600; // 1 hour before service

  try {
    const tx = await bookingManager.connect(customer1).createBooking(
      1, // BookingType.HOTEL
      serviceDate,
      "QmHotelBookingIPFSHash123",
      true, // refundable
      refundDeadline,
      { value: hotelBookingAmount }
    );
    
    await tx.wait();
    console.log(`✅ Hotel booking created directly! Amount: ${ethers.formatEther(hotelBookingAmount)} ETH`);
    
    // Get booking details
    const booking = await bookingManager.getBooking(1);
    console.log(`📋 Booking Details:`);
    console.log(`   Customer: ${booking.customer}`);
    console.log(`   Amount: ${ethers.formatEther(booking.amount)} ETH`);
    console.log(`   Status: ${booking.status}`);
    
  } catch (error) {
    console.error("❌ Direct booking failed:", error);
  }

  console.log("\n🎉 Debug test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug test failed:", error);
    process.exit(1);
  });
