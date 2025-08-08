# Nomado AI Smart Contract Interactions Guide 🛠️

This guide provides comprehensive examples for interacting with the deployed Nomado AI smart contracts on Hedera EVM testnet.

## 📋 Contract Information

### Deployed Addresses (Hedera Testnet)
```javascript
const CONTRACTS = {
  NomadoAI: "0xeb3FC122deCCe205C4767a9535948F0c61f8394E",
  BookingManager: "0x85Ca575996344cf7d033D58505D4bEf9A75313A2",
  UserReputation: "0xc15d3598925b4e8535Fc32578ed9E33394c03B94",
  PaymentTracker: "0xa945ae577157f1a11E7ADa90a014F05e052e3596",
  RewardSystem: "0x67ffdb76d60e6637fd609f622139d98830b38A48"
};
```

### Network Configuration
```javascript
const HEDERA_CONFIG = {
  chainId: 296,
  name: "Hedera Testnet",
  rpcUrl: "https://testnet.hashio.io/api",
  blockExplorer: "https://hashscan.io/testnet",
  nativeCurrency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18
  }
};
```

## 🔗 Setup & Connection

### 1. Hardhat Environment Setup
```javascript
// scripts/interact-example.js
const { ethers } = require("hardhat");

async function main() {
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Interacting with contracts using account:", deployer.address);
  
  // Connect to contracts
  const nomadoAI = await ethers.getContractAt("NomadoAI", CONTRACTS.NomadoAI);
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  const userReputation = await ethers.getContractAt("UserReputation", CONTRACTS.UserReputation);
  const paymentTracker = await ethers.getContractAt("PaymentTracker", CONTRACTS.PaymentTracker);
  const rewardSystem = await ethers.getContractAt("RewardSystem", CONTRACTS.RewardSystem);
  
  console.log("✅ Connected to all contracts successfully!");
  
  // Your interaction code here...
}

main().catch(console.error);
```

### 2. Web3.js Setup
```javascript
const Web3 = require('web3');
const web3 = new Web3('https://testnet.hashio.io/api');

// Contract ABIs (import from your compiled artifacts)
const NomadoAI_ABI = require('./artifacts/contracts/NomadoAI.sol/NomadoAI.json').abi;

// Connect to contract
const nomadoAI = new web3.eth.Contract(NomadoAI_ABI, CONTRACTS.NomadoAI);
```

### 3. Ethers.js Frontend Setup
```javascript
import { ethers } from 'ethers';

// Connect to Hedera testnet
const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

// Connect with MetaMask
const signer = await window.ethereum.request({ method: 'eth_requestAccounts' });
const userSigner = provider.getSigner();

// Contract instance
const nomadoAI = new ethers.Contract(CONTRACTS.NomadoAI, NomadoAI_ABI, userSigner);
```

## 🏨 Booking Management

### Creating Different Types of Bookings

#### 1. Hotel Booking
```javascript
async function createHotelBooking() {
  const nomadoAI = await ethers.getContractAt("NomadoAI", CONTRACTS.NomadoAI);
  
  const bookingDetails = {
    bookingType: 1, // BookingType.HOTEL
    serviceDate: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
    metadataURI: "QmHotelBookingDetails123...", // IPFS hash with booking details
    isRefundable: true,
    refundDeadline: Math.floor(Date.now() / 1000) + (5 * 24 * 60 * 60), // 5 days from now
    serviceProvider: "0x1234567890123456789012345678901234567890", // Hotel provider address
    paymentAmount: ethers.parseEther("2.5") // 2.5 HBAR for 2 nights
  };
  
  try {
    const tx = await nomadoAI.createBookingWithPayment(
      bookingDetails.bookingType,
      bookingDetails.serviceDate,
      bookingDetails.metadataURI,
      bookingDetails.isRefundable,
      bookingDetails.refundDeadline,
      bookingDetails.serviceProvider,
      { value: bookingDetails.paymentAmount }
    );
    
    const receipt = await tx.wait();
    console.log("✅ Hotel booking created successfully!");
    console.log("Transaction hash:", receipt.hash);
    
    // Extract booking ID from events
    const bookingCreatedEvent = receipt.logs.find(log => 
      log.topics[0] === ethers.id("BookingCreated(uint256,address,uint8,uint256,string,bool)")
    );
    
    if (bookingCreatedEvent) {
      const bookingId = ethers.decodeLog(
        ["uint256 indexed bookingId", "address indexed user", "uint8 bookingType", "uint256 serviceDate", "string metadataURI", "bool isRefundable"],
        bookingCreatedEvent.data,
        bookingCreatedEvent.topics
      ).bookingId;
      
      console.log("Booking ID:", bookingId.toString());
      return bookingId;
    }
  } catch (error) {
    console.error("❌ Error creating hotel booking:", error);
  }
}
```

#### 2. Flight Booking
```javascript
async function createFlightBooking() {
  const nomadoAI = await ethers.getContractAt("NomadoAI", CONTRACTS.NomadoAI);
  
  const flightDetails = {
    bookingType: 0, // BookingType.FLIGHT
    serviceDate: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 2 weeks from now
    metadataURI: "QmFlightBookingDetails456...", // IPFS with flight details
    isRefundable: true,
    refundDeadline: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week before flight
    serviceProvider: "0xAirlineProviderAddress...",
    paymentAmount: ethers.parseEther("5.0") // 5 HBAR for international flight
  };
  
  const tx = await nomadoAI.createBookingWithPayment(
    flightDetails.bookingType,
    flightDetails.serviceDate,
    flightDetails.metadataURI,
    flightDetails.isRefundable,
    flightDetails.refundDeadline,
    flightDetails.serviceProvider,
    { value: flightDetails.paymentAmount }
  );
  
  await tx.wait();
  console.log("✅ Flight booking created successfully!");
}
```

#### 3. Co-working Space Booking
```javascript
async function createCoworkingBooking() {
  const nomadoAI = await ethers.getContractAt("NomadoAI", CONTRACTS.NomadoAI);
  
  const coworkingDetails = {
    bookingType: 2, // BookingType.COWORKING
    serviceDate: Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60), // 3 days from now
    metadataURI: "QmCoworkingSpaceDetails789...",
    isRefundable: false, // Non-refundable day pass
    refundDeadline: 0, // No refund deadline since non-refundable
    serviceProvider: "0xCoworkingSpaceAddress...",
    paymentAmount: ethers.parseEther("0.1") // 0.1 HBAR for day pass
  };
  
  const tx = await nomadoAI.createBookingWithPayment(
    coworkingDetails.bookingType,
    coworkingDetails.serviceDate,
    coworkingDetails.metadataURI,
    coworkingDetails.isRefundable,
    coworkingDetails.refundDeadline,
    coworkingDetails.serviceProvider,
    { value: coworkingDetails.paymentAmount }
  );
  
  await tx.wait();
  console.log("✅ Co-working space booking created successfully!");
}
```

### Booking Management Operations

#### 1. Confirm a Booking (Service Provider)
```javascript
async function confirmBooking(bookingId) {
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  try {
    const tx = await bookingManager.confirmBooking(bookingId);
    await tx.wait();
    console.log(`✅ Booking ${bookingId} confirmed successfully!`);
  } catch (error) {
    console.error("❌ Error confirming booking:", error);
  }
}
```

#### 2. Cancel a Booking
```javascript
async function cancelBooking(bookingId) {
  const nomadoAI = await ethers.getContractAt("NomadoAI", CONTRACTS.NomadoAI);
  
  try {
    const tx = await nomadoAI.cancelBooking(bookingId);
    await tx.wait();
    console.log(`✅ Booking ${bookingId} cancelled successfully!`);
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
  }
}
```

#### 3. Complete a Booking (Service Provider)
```javascript
async function completeBooking(bookingId) {
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  try {
    const tx = await bookingManager.completeBooking(bookingId);
    await tx.wait();
    console.log(`✅ Booking ${bookingId} marked as completed!`);
  } catch (error) {
    console.error("❌ Error completing booking:", error);
  }
}
```

#### 4. Get Booking Details
```javascript
async function getBookingDetails(bookingId) {
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  try {
    const booking = await bookingManager.getBooking(bookingId);
    console.log("📋 Booking Details:");
    console.log("- User:", booking.user);
    console.log("- Type:", ["Flight", "Hotel", "Coworking", "Other"][booking.bookingType]);
    console.log("- Status:", ["Pending", "Confirmed", "Cancelled", "Completed", "Refunded"][booking.status]);
    console.log("- Service Date:", new Date(Number(booking.serviceDate) * 1000).toLocaleString());
    console.log("- Amount:", ethers.formatEther(booking.amount), "HBAR");
    console.log("- Refundable:", booking.isRefundable);
    console.log("- Metadata URI:", booking.metadataURI);
    
    return booking;
  } catch (error) {
    console.error("❌ Error fetching booking details:", error);
  }
}
```

## ⭐ User Reputation System

### 1. Submit a Review
```javascript
async function submitReview(serviceProvider, bookingId, rating, reviewText) {
  const userReputation = await ethers.getContractAt("UserReputation", CONTRACTS.UserReputation);
  
  try {
    const tx = await userReputation.submitReview(
      serviceProvider,
      bookingId,
      rating, // 1-5 stars
      reviewText
    );
    
    await tx.wait();
    console.log("✅ Review submitted successfully!");
  } catch (error) {
    console.error("❌ Error submitting review:", error);
  }
}

// Usage example
await submitReview(
  "0xHotelProviderAddress...",
  1, // booking ID
  5, // 5-star rating
  "Excellent service! The hotel was clean and the staff was very helpful."
);
```

### 2. Get User Trust Score
```javascript
async function getUserTrustScore(userAddress) {
  const userReputation = await ethers.getContractAt("UserReputation", CONTRACTS.UserReputation);
  
  try {
    const profile = await userReputation.getUserProfile(userAddress);
    console.log(`📊 User ${userAddress} Trust Score: ${profile.trustScore}/100`);
    console.log(`Total Bookings: ${profile.totalBookings}`);
    console.log(`Successful Bookings: ${profile.successfulBookings}`);
    console.log(`Average Rating: ${profile.averageRating}/5`);
    console.log(`Total Reviews: ${profile.totalReviews}`);
    
    return profile;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
  }
}
```

### 3. Get Reviews for a Service Provider
```javascript
async function getProviderReviews(serviceProvider, startIndex = 0, count = 10) {
  const userReputation = await ethers.getContractAt("UserReputation", CONTRACTS.UserReputation);
  
  try {
    const reviews = await userReputation.getReviewsForProvider(serviceProvider, startIndex, count);
    
    console.log(`📝 Reviews for ${serviceProvider}:`);
    reviews.forEach((review, index) => {
      console.log(`\nReview ${startIndex + index + 1}:`);
      console.log(`- Rating: ${"⭐".repeat(review.rating)}`);
      console.log(`- Comment: ${review.reviewText}`);
      console.log(`- Date: ${new Date(Number(review.timestamp) * 1000).toLocaleDateString()}`);
      console.log(`- Reviewer: ${review.reviewer}`);
    });
    
    return reviews;
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
  }
}
```

## 💰 Payment & Escrow System

### 1. Check Payment Status
```javascript
async function checkPaymentStatus(bookingId) {
  const paymentTracker = await ethers.getContractAt("PaymentTracker", CONTRACTS.PaymentTracker);
  
  try {
    const payment = await paymentTracker.getPayment(bookingId);
    console.log("💳 Payment Details:");
    console.log("- Amount:", ethers.formatEther(payment.amount), "HBAR");
    console.log("- Status:", ["Pending", "Completed", "Refunded", "Disputed"][payment.status]);
    console.log("- Platform Fee:", ethers.formatEther(payment.platformFee), "HBAR");
    console.log("- Service Provider:", payment.serviceProvider);
    console.log("- Created:", new Date(Number(payment.timestamp) * 1000).toLocaleString());
    
    return payment;
  } catch (error) {
    console.error("❌ Error fetching payment details:", error);
  }
}
```

### 2. Release Escrow (Service Provider)
```javascript
async function releaseEscrow(bookingId) {
  const paymentTracker = await ethers.getContractAt("PaymentTracker", CONTRACTS.PaymentTracker);
  
  try {
    const tx = await paymentTracker.releaseEscrow(bookingId);
    await tx.wait();
    console.log(`✅ Escrow released for booking ${bookingId}!`);
  } catch (error) {
    console.error("❌ Error releasing escrow:", error);
  }
}
```

### 3. Request Refund
```javascript
async function requestRefund(bookingId, reason) {
  const paymentTracker = await ethers.getContractAt("PaymentTracker", CONTRACTS.PaymentTracker);
  
  try {
    const tx = await paymentTracker.requestRefund(bookingId, reason);
    await tx.wait();
    console.log(`✅ Refund requested for booking ${bookingId}`);
  } catch (error) {
    console.error("❌ Error requesting refund:", error);
  }
}
```

### 4. Initiate Dispute
```javascript
async function initiateDispute(bookingId, reason) {
  const paymentTracker = await ethers.getContractAt("PaymentTracker", CONTRACTS.PaymentTracker);
  
  try {
    const tx = await paymentTracker.initiateDispute(bookingId, reason);
    await tx.wait();
    console.log(`⚖️ Dispute initiated for booking ${bookingId}`);
  } catch (error) {
    console.error("❌ Error initiating dispute:", error);
  }
}
```

## 🎁 Reward System

### 1. Stake HBAR for Rewards
```javascript
async function stakeForRewards(amount, duration) {
  const rewardSystem = await ethers.getContractAt("RewardSystem", CONTRACTS.RewardSystem);
  
  try {
    const tx = await rewardSystem.stake(duration, {
      value: ethers.parseEther(amount.toString())
    });
    
    await tx.wait();
    console.log(`✅ Staked ${amount} HBAR for ${duration / (24 * 60 * 60)} days!`);
  } catch (error) {
    console.error("❌ Error staking:", error);
  }
}

// Stake 10 HBAR for 90 days
await stakeForRewards(10, 90 * 24 * 60 * 60); // 90 days in seconds
```

### 2. Calculate Staking Rewards
```javascript
async function calculateStakingRewards(userAddress) {
  const rewardSystem = await ethers.getContractAt("RewardSystem", CONTRACTS.RewardSystem);
  
  try {
    const rewards = await rewardSystem.calculateStakingRewards(userAddress);
    console.log(`💰 Pending rewards: ${ethers.formatEther(rewards)} HBAR`);
    return rewards;
  } catch (error) {
    console.error("❌ Error calculating rewards:", error);
  }
}
```

### 3. Claim Rewards
```javascript
async function claimRewards() {
  const rewardSystem = await ethers.getContractAt("RewardSystem", CONTRACTS.RewardSystem);
  
  try {
    const tx = await rewardSystem.claimRewards();
    await tx.wait();
    console.log("✅ Rewards claimed successfully!");
  } catch (error) {
    console.error("❌ Error claiming rewards:", error);
  }
}
```

### 4. Unstake HBAR
```javascript
async function unstake(stakeIndex) {
  const rewardSystem = await ethers.getContractAt("RewardSystem", CONTRACTS.RewardSystem);
  
  try {
    const tx = await rewardSystem.unstake(stakeIndex);
    await tx.wait();
    console.log(`✅ Unstaked successfully! (Stake index: ${stakeIndex})`);
  } catch (error) {
    console.error("❌ Error unstaking:", error);
  }
}
```

### 5. Get User Tier
```javascript
async function getUserTier(userAddress) {
  const rewardSystem = await ethers.getContractAt("RewardSystem", CONTRACTS.RewardSystem);
  
  try {
    const tier = await rewardSystem.getUserTier(userAddress);
    const tierNames = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
    console.log(`🏆 User tier: ${tierNames[tier]} (Level ${tier})`);
    return tier;
  } catch (error) {
    console.error("❌ Error fetching user tier:", error);
  }
}
```

## 📊 Data Queries & Analytics

### 1. Get Platform Statistics
```javascript
async function getPlatformStats() {
  const nomadoAI = await ethers.getContractAt("NomadoAI", CONTRACTS.NomadoAI);
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  try {
    // Get total bookings
    const totalBookings = await bookingManager.getTotalBookings();
    
    // Get platform fee rate
    const feeRate = await bookingManager.platformFeeRate();
    
    console.log("📈 Platform Statistics:");
    console.log(`- Total Bookings: ${totalBookings}`);
    console.log(`- Platform Fee Rate: ${feeRate / 100}%`);
    
    return {
      totalBookings: totalBookings.toString(),
      feeRate: (feeRate / 100).toString()
    };
  } catch (error) {
    console.error("❌ Error fetching platform stats:", error);
  }
}
```

### 2. Get User's Booking History
```javascript
async function getUserBookingHistory(userAddress, startIndex = 0, count = 10) {
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  try {
    const bookings = await bookingManager.getUserBookings(userAddress, startIndex, count);
    
    console.log(`📚 Booking History for ${userAddress}:`);
    bookings.forEach((booking, index) => {
      console.log(`\nBooking ${startIndex + index + 1}:`);
      console.log(`- ID: ${booking.id}`);
      console.log(`- Type: ${["Flight", "Hotel", "Coworking", "Other"][booking.bookingType]}`);
      console.log(`- Status: ${["Pending", "Confirmed", "Cancelled", "Completed", "Refunded"][booking.status]}`);
      console.log(`- Amount: ${ethers.formatEther(booking.amount)} HBAR`);
      console.log(`- Date: ${new Date(Number(booking.serviceDate) * 1000).toLocaleDateString()}`);
    });
    
    return bookings;
  } catch (error) {
    console.error("❌ Error fetching booking history:", error);
  }
}
```

## 🔧 Administrative Functions

### 1. Update Platform Fee (Owner Only)
```javascript
async function updatePlatformFee(newFeeRate) {
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  try {
    const tx = await bookingManager.updatePlatformFeeRate(newFeeRate);
    await tx.wait();
    console.log(`✅ Platform fee updated to ${newFeeRate / 100}%`);
  } catch (error) {
    console.error("❌ Error updating platform fee:", error);
  }
}
```

### 2. Pause/Unpause Contracts (Owner Only)
```javascript
async function pauseContract(contractName) {
  const contract = await ethers.getContractAt(contractName, CONTRACTS[contractName]);
  
  try {
    const tx = await contract.pause();
    await tx.wait();
    console.log(`⏸️ ${contractName} paused successfully`);
  } catch (error) {
    console.error(`❌ Error pausing ${contractName}:`, error);
  }
}

async function unpauseContract(contractName) {
  const contract = await ethers.getContractAt(contractName, CONTRACTS[contractName]);
  
  try {
    const tx = await contract.unpause();
    await tx.wait();
    console.log(`▶️ ${contractName} unpaused successfully`);
  } catch (error) {
    console.error(`❌ Error unpausing ${contractName}:`, error);
  }
}
```

## 🔍 Event Listening

### 1. Listen for Booking Events
```javascript
async function listenForBookingEvents() {
  const bookingManager = await ethers.getContractAt("BookingManager", CONTRACTS.BookingManager);
  
  // Listen for new bookings
  bookingManager.on("BookingCreated", (bookingId, user, bookingType, serviceDate, metadataURI, isRefundable) => {
    console.log("🆕 New Booking Created:");
    console.log(`- Booking ID: ${bookingId}`);
    console.log(`- User: ${user}`);
    console.log(`- Type: ${["Flight", "Hotel", "Coworking", "Other"][bookingType]}`);
    console.log(`- Service Date: ${new Date(Number(serviceDate) * 1000).toLocaleString()}`);
  });
  
  // Listen for booking confirmations
  bookingManager.on("BookingConfirmed", (bookingId, serviceProvider) => {
    console.log(`✅ Booking ${bookingId} confirmed by ${serviceProvider}`);
  });
  
  // Listen for booking cancellations
  bookingManager.on("BookingCancelled", (bookingId, user) => {
    console.log(`❌ Booking ${bookingId} cancelled by ${user}`);
  });
  
  console.log("👂 Listening for booking events...");
}
```

### 2. Listen for Payment Events
```javascript
async function listenForPaymentEvents() {
  const paymentTracker = await ethers.getContractAt("PaymentTracker", CONTRACTS.PaymentTracker);
  
  paymentTracker.on("PaymentCreated", (bookingId, user, amount, serviceProvider) => {
    console.log("💳 New Payment Created:");
    console.log(`- Booking ID: ${bookingId}`);
    console.log(`- Amount: ${ethers.formatEther(amount)} HBAR`);
    console.log(`- Service Provider: ${serviceProvider}`);
  });
  
  paymentTracker.on("EscrowReleased", (bookingId, serviceProvider, amount) => {
    console.log(`💰 Escrow released for booking ${bookingId}: ${ethers.formatEther(amount)} HBAR`);
  });
  
  paymentTracker.on("RefundIssued", (bookingId, user, amount) => {
    console.log(`💸 Refund issued for booking ${bookingId}: ${ethers.formatEther(amount)} HBAR`);
  });
  
  console.log("👂 Listening for payment events...");
}
```

## 🚀 Complete Workflow Example

### End-to-End Hotel Booking Workflow
```javascript
async function completeHotelBookingWorkflow() {
  console.log("🏨 Starting complete hotel booking workflow...\n");
  
  // Step 1: Create hotel booking
  console.log("Step 1: Creating hotel booking...");
  const bookingId = await createHotelBooking();
  
  // Step 2: Get booking details
  console.log("\nStep 2: Fetching booking details...");
  await getBookingDetails(bookingId);
  
  // Step 3: Simulate service provider confirming booking
  console.log("\nStep 3: Service provider confirming booking...");
  await confirmBooking(bookingId);
  
  // Step 4: Simulate completing the stay
  console.log("\nStep 4: Completing the booking...");
  await completeBooking(bookingId);
  
  // Step 5: Release escrow payment
  console.log("\nStep 5: Releasing escrow payment...");
  await releaseEscrow(bookingId);
  
  // Step 6: Submit review
  console.log("\nStep 6: Submitting review...");
  await submitReview(
    "0xHotelProviderAddress...",
    bookingId,
    5,
    "Amazing hotel! Great location and excellent service."
  );
  
  console.log("\n✅ Complete hotel booking workflow finished!");
}
```

## 📱 Frontend Integration Examples

### React Hook for Contract Interaction
```javascript
// hooks/useNomadoAI.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useNomadoAI() {
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function initContracts() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const nomadoAI = new ethers.Contract(CONTRACTS.NomadoAI, NomadoAI_ABI, signer);
        const bookingManager = new ethers.Contract(CONTRACTS.BookingManager, BookingManager_ABI, signer);
        // ... other contracts
        
        setContracts({
          nomadoAI,
          bookingManager,
          // ... other contracts
        });
        setLoading(false);
      }
    }
    
    initContracts();
  }, []);
  
  const createBooking = async (bookingData) => {
    if (!contracts) return;
    
    const tx = await contracts.nomadoAI.createBookingWithPayment(
      bookingData.type,
      bookingData.serviceDate,
      bookingData.metadataURI,
      bookingData.isRefundable,
      bookingData.refundDeadline,
      bookingData.serviceProvider,
      { value: bookingData.amount }
    );
    
    return await tx.wait();
  };
  
  return {
    contracts,
    loading,
    createBooking,
    // ... other functions
  };
}
```

## 🛠️ Testing & Debugging

### 1. Test Contract Deployment
```bash
# Run this to test all contract interactions
npx hardhat run scripts/test-interactions.js --network hedera
```

### 2. Debug Transaction Failures
```javascript
async function debugTransaction(txHash) {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log("Transaction Receipt:", receipt);
    
    if (receipt.status === 0) {
      console.log("❌ Transaction failed");
      // Try to get revert reason
      const tx = await provider.getTransaction(txHash);
      try {
        await provider.call(tx, tx.blockNumber);
      } catch (error) {
        console.log("Revert reason:", error.reason);
      }
    } else {
      console.log("✅ Transaction successful");
    }
  } catch (error) {
    console.error("Error debugging transaction:", error);
  }
}
```

## 📋 Common Issues & Solutions

### Issue 1: "Insufficient funds" error
**Solution**: Ensure your wallet has enough HBAR for transaction fees
```javascript
// Check balance before transaction
const balance = await provider.getBalance(address);
console.log("Balance:", ethers.formatEther(balance), "HBAR");
```

### Issue 2: "Booking not found" error
**Solution**: Verify the booking ID exists
```javascript
// Check if booking exists
try {
  const booking = await bookingManager.getBooking(bookingId);
  console.log("Booking exists:", booking);
} catch (error) {
  console.log("Booking does not exist");
}
```

### Issue 3: Permission denied errors
**Solution**: Ensure you're calling functions with the correct account
```javascript
// Check current signer
const signer = await provider.getSigner();
console.log("Current signer:", await signer.getAddress());
```

---

## 📞 Support

For questions about contract interactions:
- Check the main README.md for general setup
- Review the test files in `/test/` for more examples
- Join our Telegram community for support
- Report issues on GitHub

Happy building with Nomado AI! 🚀✈️🏨
