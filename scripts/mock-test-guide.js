// Mock Mode Testing Guide
// Add this to browser console or create a testing component

// Test Mock Mode Functions
console.log('🧪 Testing Nomado AI Mock Mode');

// 1. Check if mock mode is enabled
console.log('Mock mode enabled:', contractService.isMockMode());

// 2. Force enable mock mode for testing
contractService.setMockMode(true);
console.log('✅ Mock mode enabled');

// 3. Test mock booking creation
const testBooking = async () => {
  const mockBookingData = {
    type: 'hotel',
    details: {
      title: 'Test Hotel Booking',
      description: 'Mock hotel for testing',
      price: 100,
      currency: 'USD',
      rating: 4.5,
      details: {
        location: 'Test City, Test Country'
      }
    },
    amount: '0.01', // 0.01 ETH
    token: 'ETH',
    checkInDate: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    checkOutDate: Math.floor(Date.now() / 1000) + 172800, // Day after tomorrow
    metadataURI: ''
  };

  try {
    const result = await contractService.createBooking(mockBookingData);
    console.log('✅ Mock booking created:', result);
    return result;
  } catch (error) {
    console.error('❌ Mock booking failed:', error);
  }
};

// 4. Test getting mock bookings
const testGetBookings = async () => {
  const mockAddress = '0x742d35cc6647c93f0f6b0b4e4c4e61b7e55bb94e';
  
  try {
    const bookingIds = await contractService.getUserBookings(mockAddress);
    console.log('✅ User booking IDs:', bookingIds);
    
    const bookingDetails = await contractService.getUserBookingDetails(mockAddress);
    console.log('✅ User booking details:', bookingDetails);
    
    return { bookingIds, bookingDetails };
  } catch (error) {
    console.error('❌ Get bookings failed:', error);
  }
};

// 5. Test contract stats
const testStats = async () => {
  try {
    const stats = await contractService.getContractStats();
    console.log('✅ Contract stats:', stats);
    
    const fee = await contractService.getPlatformFee();
    console.log('✅ Platform fee:', fee + ' basis points');
    
    return { stats, fee };
  } catch (error) {
    console.error('❌ Stats failed:', error);
  }
};

// 6. Test booking cancellation
const testCancel = async (bookingId) => {
  try {
    const txHash = await contractService.cancelBooking(bookingId);
    console.log('✅ Booking cancelled:', txHash);
    return txHash;
  } catch (error) {
    console.error('❌ Cancel failed:', error);
  }
};

// 7. View all mock data
const viewMockData = () => {
  const mockBookings = contractService.getMockBookings();
  console.log('📊 All mock bookings:', mockBookings);
  return mockBookings;
};

// 8. Clear mock data
const clearData = () => {
  contractService.clearMockData();
  console.log('🧹 Mock data cleared');
};

// Export test functions for browser console use
window.mockTests = {
  createBooking: testBooking,
  getBookings: testGetBookings,
  getStats: testStats,
  cancelBooking: testCancel,
  viewData: viewMockData,
  clearData: clearData,
  enableMock: () => contractService.setMockMode(true),
  disableMock: () => contractService.setMockMode(false),
  isMockMode: () => contractService.isMockMode()
};

console.log('✅ Mock test functions available as window.mockTests');
console.log('Example usage:');
console.log('  await mockTests.createBooking()');
console.log('  await mockTests.getBookings()');
console.log('  await mockTests.getStats()');
console.log('  mockTests.viewData()');
console.log('  mockTests.clearData()');
