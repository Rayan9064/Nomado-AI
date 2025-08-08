# 🌍 Nomado AI - AI-Powered Travel Booking with Web3 Payments

## 👤 Contact Information
**Name:** Mohammed Rayan A, Younus, L Priyan Raj <br>
**Telegram:** @rayan9064, @Younus_37, @Priyan370

## 🚀 Project Title
**Nomado AI** - AI-Powered Travel Booking Platform with Blockchain Payments

## 📝 One-Sentence Elevator Pitch
Nomado AI helps digital nomads book flights, stays, and experiences globally using AI agents and on-chain payments in one unified platform.

## 📖 Detailed Project Description

Nomado AI is a revolutionary travel booking platform that combines artificial intelligence with blockchain technology to create a seamless booking experience for digital nomads and travelers worldwide. The platform integrates smart contracts for secure payments, AI agents for personalized recommendations, and a modern web interface for intuitive user interactions.

### 🌟 Key Features

- **🤖 AI-Powered Search & Recommendations**: Intelligent travel planning with natural language processing
- **⛓️ Blockchain Payment Integration**: Secure on-chain payments with ETH and ERC20 tokens
- **🏨 Comprehensive Travel Services**: Hotels, flights, tours, and activities in one platform
- **💳 Multi-Chain Support**: Ethereum, Polygon, Arbitrum, and Optimism networks
- **📱 Modern UI/UX**: Responsive design with dark/light mode support
- **🔒 Web3 Wallet Integration**: MetaMask and WalletConnect support
- **📊 Real-time Booking Management**: View, cancel, and manage bookings on-chain
- **🧪 Mock Mode Testing**: Full functionality testing without deployed contracts

### 🛠️ Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum, Solidity, ethers.js
- **Smart Contracts**: Custom TravelBooking contract with full lifecycle management
- **Web3 Integration**: MetaMask, WalletConnect
- **AI/ML**: Natural language processing for travel recommendations
- **Deployment**: Vercel-ready with optimized builds

### 🎯 Use Cases

1. **Digital Nomads**: Plan and book entire trips with crypto payments
2. **Crypto Travelers**: Use blockchain assets for real-world travel bookings
3. **Travel Agencies**: Integrate decentralized payment solutions
4. **Adventure Seekers**: Discover and book unique experiences globally

## 🚀 Install Steps

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- MetaMask or compatible Web3 wallet

### 1. Clone the Repository
```bash
git clone https://github.com/Rayan9064/Nomado-AI.git
cd Nomado-AI
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

### 5. Open Application
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required for production deployment
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Blockchain Network RPCs (Optional - defaults provided)
NEXT_PUBLIC_ETHEREUM_RPC=https://cloudflare-eth.com
NEXT_PUBLIC_POLYGON_RPC=https://polygon-rpc.com
NEXT_PUBLIC_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC=https://mainnet.optimism.io

# WalletConnect Project ID (Optional - demo ID provided)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# API Keys for enhanced features (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_TRAVEL_API_KEY=your-travel-api-key

# Smart Contract Addresses (Auto-configured per network)
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_OPTIMISM=0x...
```

## 📋 Usage Example

### 1. Basic Travel Search & Booking

```typescript
// Connect wallet and search for hotels
import { useWeb3 } from '@/components/Web3Provider';

function BookingFlow() {
  const { connect, createBooking, isConnected } = useWeb3();
  
  // 1. Connect wallet
  await connect('MetaMask');
  
  // 2. Search for accommodations (AI-powered)
  const searchQuery = "Find me a beachfront hotel in Goa for 3 nights under $100";
  
  // 3. Create booking with crypto payment
  const bookingData = {
    type: 'hotel',
    details: selectedHotel,
    amount: '0.05', // ETH
    checkInDate: checkInTimestamp,
    checkOutDate: checkOutTimestamp
  };
  
  const result = await createBooking(bookingData);
  console.log(`Booking confirmed: ${result.transactionHash}`);
}
```

### 2. Mock Mode Testing

```javascript
// Test in browser console without deployed contracts
contractService.setMockMode(true);

// Create test booking
const mockBooking = await contractService.createBooking({
  type: 'hotel',
  details: { title: 'Test Hotel', price: 100 },
  amount: '0.01',
  checkInDate: Math.floor(Date.now() / 1000) + 86400,
  checkOutDate: Math.floor(Date.now() / 1000) + 172800
});

// View all mock bookings
contractService.getMockBookings();
```

### 3. Real Blockchain Integration

```typescript
// Deploy contracts and update configuration
// See: https://github.com/Rayan9064/Nomado-AI/blob/contracts/README.md

// Update contract addresses in src/contracts/config.ts
export const CONTRACT_ADDRESSES = {
  1: { TravelBooking: '0xYourMainnetAddress' },
  137: { TravelBooking: '0xYourPolygonAddress' }
};

// The app automatically switches from mock mode to real contracts
```

## 🧪 Testing & Development

### Mock Mode (No Deployment Required)
The application includes comprehensive mock mode for testing:

```bash
# Start development server
npm run dev

# Mock mode automatically activates when contracts aren't deployed
# Look for yellow "Mock Mode" indicator in header
# Test full booking flow without gas costs
```

### Smart Contract Testing
For smart contract deployment and testing:
- **Contracts Repository**: [contracts branch](https://github.com/Rayan9064/Nomado-AI/blob/contracts/README.md)
- **Deployment Guide**: See contracts branch README
- **Testnet Testing**: Supported on Sepolia, Mumbai, Arbitrum Goerli

### Build & Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy

# Lint code
npm run lint
```

## ⚠️ Known Issues

### Current Limitations
1. **Smart Contracts**: Not yet deployed to mainnet - currently in mock mode
2. **Real Travel APIs**: Using mock data for hotel/flight searches
3. **Payment Processing**: Simplified token conversion rates
4. **Mobile Optimization**: Some responsive design improvements needed

### In Development
- [ ] **MCP Integration**: Model Context Protocol for advanced AI agents
- [ ] **Real Travel APIs**: Integration with Amadeus, Booking.com APIs
- [ ] **Multi-language Support**: i18n implementation
- [ ] **Mobile App**: React Native version
- [ ] **Advanced Analytics**: User behavior and booking insights

### Browser Compatibility
- **Supported**: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Web3 Required**: MetaMask or compatible wallet needed for transactions
- **Mobile**: Progressive Web App features in development

### Performance Notes
- Initial load may be slower due to Web3 provider initialization
- Mock mode provides instant responses for testing
- Real blockchain transactions depend on network congestion

## 🔗 Additional Resources

- **Smart Contracts Documentation**: [contracts branch README](https://github.com/Rayan9064/Nomado-AI/blob/contracts/README.md)
- **Mock Testing Guide**: [MOCK_TESTING_GUIDE.md](./MOCK_TESTING_GUIDE.md)
- **API Documentation**: Coming soon
- **Demo Video**: Coming soon

## 📞 Support & Contributing

- **Issues**: [GitHub Issues](https://github.com/Rayan9064/Nomado-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Rayan9064/Nomado-AI/discussions)
- **Contact**: [@rayan_shaikh_9064](https://t.me/rayan_shaikh_9064) on Telegram

---

**Built with ❤️ for the global nomad community** 🌍✈️