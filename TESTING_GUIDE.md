# 🧪 Local Testing Guide for Nomado AI Smart Contracts

## Quick Start Testing

### Step 1: Start Local Blockchain
```bash
# Terminal 1: Start local Hardhat network
npm run node
```

### Step 2: Deploy Contracts Locally
```bash
# Terminal 2: Deploy all contracts
npm run deploy:local
```

### Step 3: Run Comprehensive Tests
```bash
# Terminal 2: Run the comprehensive test suite
npm run test:local
```

## Sample Test Scenarios

### 🏨 Hotel Booking Example
```javascript
// Create a hotel booking
nomadoAI.createBookingWithPayment(
  1,                              // BookingType.HOTEL
  serviceDate,                    // 7 days from now
  "QmHotelBookingIPFSHash123",   // IPFS metadata
  true,                          // refundable
  refundDeadline,                // 1 hour before service
  serviceProviderAddress,
  { value: ethers.parseEther("2.5") } // 2.5 ETH
);
```

### ✈️ Flight Booking Example
```javascript
// Create a flight booking
nomadoAI.createBookingWithPayment(
  0,                              // BookingType.FLIGHT
  flightServiceDate,             // 14 days from now
  "QmFlightBookingIPFSHash456",  // IPFS metadata
  true,                          // refundable
  flightRefundDeadline,          // 2 hours before flight
  serviceProviderAddress,
  { value: ethers.parseEther("1.8") } // 1.8 ETH
);
```

### 💼 Co-working Space Booking Example
```javascript
// Create a co-working space booking
nomadoAI.createBookingWithPayment(
  2,                              // BookingType.COWORKING
  coworkingServiceDate,          // 3 days from now
  "QmCoworkingBookingIPFSHash789", // IPFS metadata
  false,                         // non-refundable
  0,                             // no refund deadline
  serviceProviderAddress,
  { value: ethers.parseEther("0.5") } // 0.5 ETH
);
```

### ⭐ Review Submission Example
```javascript
// Submit a verified review
nomadoAI.submitVerifiedReview(
  serviceProviderAddress,
  bookingId,
  5,                             // 5-star rating
  "Excellent service! Highly recommended."
);
```

### 🎁 Staking for Rewards Example
```javascript
// Stake ETH for rewards
rewardSystem.stake(
  86400 * 90,                    // 90 days lock period
  { value: ethers.parseEther("1.0") } // 1 ETH stake
);
```

## Test Accounts and Sample Data

### Pre-configured Test Accounts
- **Owner**: Contract deployer and admin
- **Customer 1**: Creates hotel and co-working bookings
- **Customer 2**: Creates flight booking
- **Service Provider 1**: Provides hotel and co-working services
- **Service Provider 2**: Provides flight services

### Sample Booking Amounts
- **Hotel**: 2.5 ETH (represents premium hotel stay)
- **Flight**: 1.8 ETH (represents international flight)
- **Co-working**: 0.5 ETH (represents monthly co-working pass)

### Platform Configuration
- **Platform Fee**: 2.5% of booking amount
- **Escrow Period**: 1 day (86400 seconds)
- **Dispute Period**: 7 days (604800 seconds)
- **Base Reward Rate**: 10% APY (1000 basis points)
- **Booking Reward**: 1% of booking amount (100 basis points)
- **Minimum Stake**: 0.1 ETH

## Expected Test Results

### ✅ Successful Operations
1. All 5 contracts deploy successfully
2. Contracts link and authorize each other
3. Bookings created with proper payment tracking
4. Reviews submitted and verified automatically
5. Rewards distributed for completed bookings
6. Platform statistics updated correctly
7. User profiles track booking history and trust scores

### 📊 Sample Output Data
```
Platform Statistics:
  Total Bookings: 3
  Total Payments: 3
  Total Reviews: 1

Customer 1 Statistics:
  Trust Score: 75 (increased from completed booking)
  Total Bookings: 2
  Completed Bookings: 1
  Average Rating: N/A (as service provider)
  Is Verified: false
  User Bookings: [1, 3]
  User Stakes: [1]
```

## Manual Testing with Hardhat Console

### Start Interactive Console
```bash
npx hardhat console --network localhost
```

### Sample Console Commands
```javascript
// Get contract instances
const nomadoAI = await ethers.getContractAt("NomadoAI", "DEPLOYED_ADDRESS");
const [owner, customer1] = await ethers.getSigners();

// Check platform status
await nomadoAI.getPlatformStats();

// Check user eligibility
await nomadoAI.canUserBook(customer1.address);

// Get detailed booking info
await nomadoAI.getBookingDetails(1);
```

## Troubleshooting

### Common Issues
1. **"Platform is paused"**: Check if emergency pause is active
2. **"Invalid booking amount"**: Ensure msg.value > 0
3. **"Not the booking customer"**: Verify caller is the booking owner
4. **"Fee too high"**: Platform fee must be ≤ 10% (1000 basis points)

### Gas Estimation
- **Booking Creation**: ~150,000-200,000 gas
- **Booking Completion**: ~100,000-150,000 gas
- **Review Submission**: ~80,000-120,000 gas
- **Staking**: ~60,000-100,000 gas

## Integration Points

### Frontend Integration
```javascript
// Example Web3 integration
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();
const nomadoAI = new ethers.Contract(contractAddress, abi, signer);

// Create booking
const tx = await nomadoAI.createBookingWithPayment(
  bookingType,
  serviceDate,
  metadataHash,
  isRefundable,
  refundDeadline,
  serviceProvider,
  { value: bookingAmount }
);
```

### API Integration Points
- Booking creation and management
- User reputation and reviews
- Payment tracking and escrow
- Reward distribution and staking
- Platform statistics and analytics
