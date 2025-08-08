# Contract Deployment Quick Guide

## Prerequisites
- Hardhat development environment
- Ethereum wallet with testnet/mainnet ETH
- Infura or Alchemy API keys

## Setup

1. **Install Dependencies**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts ethers
```

2. **Create Hardhat Config**
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Testnets
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    
    // Mainnets
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY
    }
  }
};
```

3. **Environment Variables (.env)**
```bash
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key
```

## Deployment Script

Create `scripts/deploy.js`:
```javascript
async function main() {
  console.log("Starting deployment...");
  
  // Deploy TravelBooking contract
  const TravelBooking = await ethers.getContractFactory("TravelBooking");
  console.log("Deploying TravelBooking...");
  
  const travelBooking = await TravelBooking.deploy();
  await travelBooking.waitForDeployment();
  
  const address = await travelBooking.getAddress();
  console.log("TravelBooking deployed to:", address);
  
  // Wait for block confirmations
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await travelBooking.deploymentTransaction().wait(6);
    
    // Verify contract
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
  
  // Output deployment info
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${network.name}`);
  console.log(`TravelBooking: ${address}`);
  console.log(`Transaction: ${travelBooking.deploymentTransaction().hash}`);
  
  // Update frontend config
  console.log("\n=== Update Frontend Config ===");
  console.log(`Add to src/contracts/config.ts:`);
  console.log(`${getChainId(network.name)}: {`);
  console.log(`  TravelBooking: "${address}",`);
  console.log(`},`);
}

function getChainId(networkName) {
  const chainIds = {
    mainnet: 1,
    sepolia: 11155111,
    polygon: 137,
    mumbai: 80001,
    arbitrum: 42161,
    optimism: 10
  };
  return chainIds[networkName] || 'unknown';
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Deployment Commands

### Testnet Deployment (Recommended First)
```bash
# Sepolia (Ethereum testnet)
npx hardhat run scripts/deploy.js --network sepolia

# Mumbai (Polygon testnet)
npx hardhat run scripts/deploy.js --network mumbai
```

### Mainnet Deployment
```bash
# Ethereum Mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Polygon
npx hardhat run scripts/deploy.js --network polygon

# Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum

# Optimism
npx hardhat run scripts/deploy.js --network optimism
```

## Post-Deployment Steps

1. **Update Frontend Config**
   - Copy the deployed addresses to `src/contracts/config.ts`
   - Update the CONTRACT_ADDRESSES object with new addresses

2. **Test Contract Functions**
```bash
# Interactive testing
npx hardhat console --network sepolia

# In console:
const TravelBooking = await ethers.getContractFactory("TravelBooking")
const contract = TravelBooking.attach("DEPLOYED_ADDRESS")
await contract.platformFee()
```

3. **Set Up Token Support** (if needed)
```javascript
// Add supported tokens
await contract.setSupportedToken("0xA0b86a33E6441Eb3422132E5EdD6bf1Ed32E7AFE", true) // USDC
await contract.setSupportedToken("0xdAC17F958D2ee523a2206206994597C13D831ec7", true) // USDT
```

4. **Configure Platform Settings**
```javascript
// Set platform fee (2.5% = 250 basis points)
await contract.setPlatformFee(250)

// Set fee collector address
await contract.setFeeCollector("YOUR_FEE_COLLECTOR_ADDRESS")
```

## Frontend Integration

After deployment, the frontend will automatically work with the deployed contracts. The key integration points are:

1. **Web3Provider** - Already configured to initialize contracts
2. **PaymentModal** - Ready to create blockchain bookings
3. **BookingHistoryModal** - Shows user's on-chain bookings
4. **ContractService** - Handles all contract interactions

## Verification

1. **Check deployment on block explorer**
2. **Test booking creation from frontend**
3. **Verify events are emitted correctly**
4. **Test cancellation and refund functionality**

## Monitoring

Set up monitoring for:
- Contract balance
- Booking events
- Failed transactions
- Gas usage optimization

The smart contracts are now ready for production use with full Web3 booking functionality!
