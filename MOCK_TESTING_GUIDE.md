# 🧪 Mock Mode Testing Guide

Your Nomado AI project now includes comprehensive mock mode functionality that allows you to test all smart contract integrations without deploying actual contracts.

## 🔧 How Mock Mode Works

Mock mode is **automatically enabled** when:
- Smart contracts are not deployed on the current network
- Contract initialization fails
- No contract addresses are configured for the network

## 🚀 Testing the Integration

### 1. **Start the Development Server**
```bash
npm run dev
```

### 2. **Check Mock Mode Status**
- Look for the **yellow "Mock Mode" indicator** in the header
- Open browser console to see initialization messages:
  - `🔧 Contract initialized in MOCK MODE` = Mock enabled
  - `🔗 Contract initialized successfully` = Real contracts

### 3. **Test Booking Flow**

#### A. Search for Hotels
1. Go to `/hotel-search`
2. Search for "Goa" or "Mumbai" 
3. Click "Book Now" on any hotel

#### B. Test Payment Process
1. Click "Pay with Crypto" in the payment modal
2. Connect your wallet (MetaMask)
3. Click "Confirm Booking"
4. Watch the mock transaction process:
   - ✅ Shows processing animation
   - ✅ Simulates 1-second blockchain delay
   - ✅ Returns mock transaction hash
   - ✅ Creates booking in memory

#### C. View Mock Bookings
1. Click "My Bookings" in the header
2. See your mock bookings listed
3. Test cancel/check-in functionality

### 4. **Browser Console Testing**

Open browser console and use the test functions:

```javascript
// Check mock mode
contractService.isMockMode()

// Create a test booking
const result = await contractService.createBooking({
  type: 'hotel',
  details: {
    title: 'Test Hotel',
    description: 'Test booking',
    price: 100,
    currency: 'USD',
    details: { location: 'Test City' }
  },
  amount: '0.01',
  checkInDate: Math.floor(Date.now() / 1000) + 86400,
  checkOutDate: Math.floor(Date.now() / 1000) + 172800
})

// Get mock statistics
await contractService.getContractStats()

// View all mock bookings
contractService.getMockBookings()

// Clear mock data
contractService.clearMockData()
```

### 5. **Advanced Testing**

Use the test script for comprehensive testing:

```javascript
// Load test functions (in browser console)
// Copy contents of scripts/mock-test-guide.js

// Run full test suite
await mockTests.createBooking()
await mockTests.getBookings()
await mockTests.getStats()
mockTests.viewData()
```

## 🎯 What Gets Tested

### ✅ **Mock Transactions**
- Booking creation with mock transaction hashes
- Payment processing simulation
- Transaction confirmations

### ✅ **User Journey**
- Wallet connection flow
- Hotel search and selection
- Payment modal interaction
- Booking history management

### ✅ **Smart Contract Methods**
- `createBooking()` - Creates mock bookings
- `getUserBookings()` - Returns user's booking IDs
- `getUserBookingDetails()` - Returns full booking data
- `cancelBooking()` - Updates booking status
- `checkInToBooking()` - Processes check-ins
- `getContractStats()` - Platform statistics
- `getPlatformFee()` - Returns 2.5% platform fee

### ✅ **Error Handling**
- Network connection issues
- Wallet connection failures
- Transaction rejections
- Invalid booking data

## 🔗 Switching to Real Contracts

When you're ready to use real smart contracts:

1. **Deploy contracts** to your target network
2. **Update contract addresses** in `src/contracts/config.ts`
3. **Connect to the network** - mock mode will automatically disable
4. **Test with real transactions** using the same UI flow

## 📊 Mock Data Features

- **Persistent in-memory storage** during session
- **Realistic transaction hashes** for UI testing
- **Proper booking lifecycle** simulation
- **Platform fee calculations**
- **Multi-user booking simulation**

## 🚨 Important Notes

- Mock data is **session-only** (cleared on page refresh)
- Mock transactions **don't cost gas**
- UI behaves identically to real contract mode
- All error scenarios are properly simulated

## 🐛 Debugging Tips

1. **Check console logs** for detailed mock operations
2. **Use mock mode indicator** in header to confirm status
3. **Clear mock data** if needed: `contractService.clearMockData()`
4. **Force mock mode**: `contractService.setMockMode(true)`

This mock implementation lets you thoroughly test your entire Web3 booking flow without any blockchain deployment requirements!
