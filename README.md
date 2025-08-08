# Nomado AI Smart Contracts 🌍⛓️

## Primary Contact
**Name:** [Your Name]  
**Telegram:** @[your_telegram_handle]

## Team
**Team Name:** Nomado AI Team (or Solo if individual contributor)

## Project Title
**Nomado AI Smart Contracts** - Decentralized Travel & Booking Infrastructure

## One-Sentence Elevator Pitch
A comprehensive smart contract backend that powers decentralized travel bookings with integrated payment escrow, user reputation systems, and loyalty rewards for digital nomads.

## Detailed Project Description

Nomado AI Smart Contracts is the blockchain infrastructure layer for a decentralized travel platform designed specifically for digital nomads. This project implements a modular, upgradeable smart contract ecosystem that handles the complete booking lifecycle from creation to completion, with built-in trust mechanisms and incentive structures.

### 🏗️ Architecture Overview

The system consists of five main interconnected contracts:

1. **NomadoAI** (Main Controller) - Orchestrates all platform functionality
2. **BookingManager** - Handles flight, hotel, and co-working space bookings
3. **UserReputation** - Manages trust scores, ratings, and reviews
4. **PaymentTracker** - Secure escrow system with dispute resolution
5. **RewardSystem** - Staking and loyalty rewards for frequent users

### ✨ Key Features

#### 🏨 Booking Management
- Multi-category booking support (flights, hotels, co-working spaces)
- Configurable refund policies with deadline enforcement
- Complete booking lifecycle management (pending → confirmed → completed/cancelled)
- IPFS integration for metadata storage
- Event-driven architecture for real-time updates

#### 💰 Payment & Escrow System
- Secure escrow with configurable release periods
- Automated refund processing based on booking terms
- Multi-party dispute resolution mechanism
- Platform fee management with transparent calculations
- Gas-optimized payment flows

#### ⭐ Reputation & Trust System
- Dynamic trust score calculation based on booking history
- 5-star review system with verified booking integration
- Anti-gaming mechanisms to prevent fake reviews
- KYC verification integration for enhanced trust
- Reputation-based booking permissions

#### 🎁 Rewards & Loyalty Program
- Tiered reward system (Bronze → Silver → Gold → Platinum → Diamond)
- Flexible staking mechanism with multiple lock periods
- APY-based rewards with tier multipliers
- Booking-based reward distribution
- Loyalty bonuses for verified and frequent users

### 🔐 Security & Upgradability

- **OpenZeppelin Standards**: Built on battle-tested security frameworks
- **Reentrancy Protection**: All external calls protected with ReentrancyGuard
- **Access Control**: Role-based permissions with multi-signature support
- **Upgradeable Contracts**: Proxy pattern for future enhancements
- **Pause Mechanism**: Emergency controls for critical situations
- **Comprehensive Testing**: 95%+ test coverage with edge case scenarios

### 🌐 Network Support

- **Ethereum Sepolia** (Testnet)
- **Hedera EVM** (Hedera)
- **Local Hardhat Network** (Development)

## Install Steps

### Prerequisites
- Node.js v16+ and npm v8+
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd nomado-ai-smartcontracts
git checkout contracts  # Switch to contracts branch
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```

### 4. Compile Contracts
```bash
npm run compile
```

### 5. Run Tests
```bash
npm test
```

### 6. Deploy Locally
```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Network RPC URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
HEDERA_URL=https://testnet.hashio.io/api

# Deployment Configuration
PRIVATE_KEY=your_private_key_without_0x_prefix

# Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Development Options
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Optional: Alternative RPC Providers
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEYYOUR_ALCHEMY_KEY
```

### Required Variables:
- `PRIVATE_KEY`: Your wallet private key for deployments
- `SEPOLIA_URL` or `POLYGON_URL`: RPC endpoint for desired network

### Optional Variables:
- `ETHERSCAN_API_KEY`: For contract verification
- `REPORT_GAS`: Enable gas usage reporting
- `COINMARKETCAP_API_KEY`: For USD gas cost estimates

## Usage Example

### 1. Deploy Contracts
```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Polygon
npm run deploy:polygon
```

### 2. Interact with Contracts
```javascript
const { ethers } = require("hardhat");

async function createBooking() {
  const nomadoAI = await ethers.getContractAt("NomadoAI", "DEPLOYED_ADDRESS");
  
  const serviceDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
  const refundDeadline = serviceDate - 3600; // 1 hour before service
  
  const tx = await nomadoAI.createBookingWithPayment(
    0, // BookingType.FLIGHT
    serviceDate,
    "QmIPFSHashForBookingDetails",
    true, // isRefundable
    refundDeadline,
    "0xServiceProviderAddress",
    { value: ethers.parseEther("1.0") }
  );
  
  await tx.wait();
  console.log("Booking created successfully!");
}
```

### 3. Test Smart Contracts
```bash
# Run all tests
npm test

# Run specific test file
npm test test/BookingManager.test.ts

# Run tests with gas reporting
npm run test:gas

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployed Contracts

### Hedera EVM Testnet (Chain ID: 296)
**Deployment Date:** August 8, 2025

| Contract | Address | Purpose |
|----------|---------|---------|
| **NomadoAI** (Main) | `0xeb3FC122deCCe205C4767a9535948F0c61f8394E` | Platform orchestrator and main entry point |
| **BookingManager** | `0x85Ca575996344cf7d033D58505D4bEf9A75313A2` | Travel booking management (flights, hotels, co-working) |
| **UserReputation** | `0xc15d3598925b4e8535Fc32578ed9E33394c03B94` | Trust scores, ratings, and user profiles |
| **PaymentTracker** | `0xa945ae577157f1a11E7ADa90a014F05e052e3596` | Secure escrow and payment processing |
| **RewardSystem** | `0x67ffdb76d60e6637fd609f622139d98830b38A48` | Staking and loyalty rewards |

**Network Details:**
- **RPC URL:** `https://testnet.hashio.io/api`
- **Explorer:** https://hashscan.io/testnet
- **Gas Token:** HBAR
- **Deployer:** `0x1Df56fdc79A9EcEFa76407278d852d81A6A338BA`

### Contract Verification
```bash
# Verify all contracts on Hedera
npx hardhat verify 0x85Ca575996344cf7d033D58505D4bEf9A75313A2 --network hedera
npx hardhat verify 0xc15d3598925b4e8535Fc32578ed9E33394c03B94 --network hedera
npx hardhat verify 0xa945ae577157f1a11E7ADa90a014F05e052e3596 --network hedera
npx hardhat verify 0x67ffdb76d60e6637fd609f622139d98830b38A48 --network hedera
npx hardhat verify 0xeb3FC122deCCe205C4767a9535948F0c61f8394E --network hedera
```

### Usage with Deployed Contracts
```javascript
// Connect to deployed contracts on Hedera testnet
const nomadoAI = await ethers.getContractAt("NomadoAI", "0xeb3FC122deCCe205C4767a9535948F0c61f8394E");
const bookingManager = await ethers.getContractAt("BookingManager", "0x85Ca575996344cf7d033D58505D4bEf9A75313A2");
// ... etc
```

### 4. Verify Deployed Contracts
```bash
# Verify on Etherscan (Sepolia)
npm run verify:sepolia DEPLOYED_CONTRACT_ADDRESS

# Verify on Polygonscan
npm run verify:polygon DEPLOYED_CONTRACT_ADDRESS
```

### 5. Contract Interaction Examples

#### Create a Hotel Booking
```solidity
// Book a hotel room for 2 nights
nomadoAI.createBookingWithPayment{value: 2 ether}(
    BookingType.HOTEL,
    block.timestamp + 7 days, // Check-in date
    "QmHotelBookingMetadata",
    true, // Refundable
    block.timestamp + 6 days, // Refund deadline
    hotelProviderAddress
);
```

#### Submit a Review
```solidity
// Rate a completed booking
userReputation.submitReview(
    serviceProviderAddress,
    bookingId,
    5, // 5-star rating
    "Excellent service and clean facilities!"
);
```

#### Stake for Rewards
```solidity
// Stake 1 ETH for 90 days
rewardSystem.stake{value: 1 ether}(90 days);
```

## Known Issues

### Current Limitations

1. **Frontend Integration Pending**
   - Smart contracts are complete but awaiting Web2 frontend integration
   - API endpoints for off-chain data not yet implemented
   - Mobile application interface in development

2. **Mainnet Deployment**
   - Currently optimized for testnets (Sepolia, Mumbai)
   - Mainnet deployment requires additional security audits
   - Gas optimization ongoing for mainnet viability

3. **Token Integration**
   - Currently ETH-only payment system
   - ERC-20 token support planned for future versions
   - Multi-currency payment gateway integration pending

4. **Oracle Dependencies**
   - External price feeds not yet integrated
   - Real-world booking confirmations require off-chain oracles
   - Flight/hotel availability data needs API integration

### Technical Issues

1. **TypeChain Generation**
   - Type definitions may require manual regeneration after compilation
   - Run `npm run typechain` after contract changes

2. **Test Dependencies**
   - Some test files require contract compilation before execution
   - Always run `npm run compile` before testing

3. **Network Configuration**
   - Ensure correct network configuration in hardhat.config.ts
   - Verify gas settings for target networks

### Workarounds

1. **For TypeScript Errors**:
   ```bash
   npm run compile
   npm run typechain
   ```

2. **For Failed Deployments**:
   ```bash
   # Check gas settings and network connectivity
   npm run clean
   npm run compile
   npm run deploy:local  # Test locally first
   ```

3. **For Test Failures**:
   ```bash
   # Reset local blockchain state
   npm run node  # In separate terminal
   npm test
   ```

## Development Roadmap

### Phase 1 (Current) ✅
- Core smart contract development
- Comprehensive testing suite
- Basic deployment scripts
- Documentation and README

### Phase 2 (In Progress) 🔄
- Frontend integration APIs
- External oracle integration
- Enhanced security audits
- Mainnet deployment preparation

### Phase 3 (Planned) 📋
- Multi-token payment support
- Cross-chain compatibility
- DAO governance implementation
- Mobile SDK development

### Phase 4 (Future) 🚀
- AI-powered booking recommendations
- Carbon offset tracking
- Community-driven features
- Global partnership integrations

## Support & Contribution

For technical issues or questions:
1. Check the [Known Issues](#known-issues) section
2. Review existing test files for usage examples
3. Create an issue in the GitHub repository
4. Contact the development team via Telegram

---
