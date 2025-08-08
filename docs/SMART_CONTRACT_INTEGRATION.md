# Smart Contract Integration Guide for Nomado AI

## Overview
This document outlines how to integrate smart contracts with the existing Nomado AI booking platform. The platform already has Web3Provider infrastructure in place with WalletConnect support.

## Current Web3 Infrastructure

### Existing Components
- **Web3Provider.tsx**: Wallet connection and management
- **PaymentModal.tsx**: Payment interface with Web3 integration
- **Header.tsx**: Wallet connection UI
- **Types**: Ethereum window declarations

### Supported Networks
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism

## Smart Contract Architecture

### Recommended Contract Structure

```solidity
// contracts/TravelBooking.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TravelBooking is ReentrancyGuard, Ownable {
    struct Booking {
        uint256 id;
        address customer;
        string bookingType; // "flight", "hotel", "tour", "activity"
        string details; // IPFS hash or encoded details
        uint256 amount;
        address token; // ERC20 token address (0x0 for native)
        uint256 timestamp;
        BookingStatus status;
    }
    
    enum BookingStatus {
        Pending,
        Confirmed,
        Cancelled,
        Completed
    }
    
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public userBookings;
    
    uint256 public nextBookingId = 1;
    uint256 public platformFee = 250; // 2.5%
    
    event BookingCreated(uint256 indexed bookingId, address indexed customer, string bookingType, uint256 amount);
    event BookingConfirmed(uint256 indexed bookingId);
    event BookingCancelled(uint256 indexed bookingId);
    
    function createBooking(
        string memory _bookingType,
        string memory _details,
        uint256 _amount,
        address _token
    ) external payable nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        
        if (_token == address(0)) {
            require(msg.value >= _amount, "Insufficient ETH sent");
        } else {
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        }
        
        bookings[nextBookingId] = Booking({
            id: nextBookingId,
            customer: msg.sender,
            bookingType: _bookingType,
            details: _details,
            amount: _amount,
            token: _token,
            timestamp: block.timestamp,
            status: BookingStatus.Pending
        });
        
        userBookings[msg.sender].push(nextBookingId);
        
        emit BookingCreated(nextBookingId, msg.sender, _bookingType, _amount);
        nextBookingId++;
    }
    
    function confirmBooking(uint256 _bookingId) external onlyOwner {
        require(bookings[_bookingId].status == BookingStatus.Pending, "Booking not pending");
        bookings[_bookingId].status = BookingStatus.Confirmed;
        emit BookingConfirmed(_bookingId);
    }
    
    function cancelBooking(uint256 _bookingId) external {
        Booking storage booking = bookings[_bookingId];
        require(booking.customer == msg.sender || owner() == msg.sender, "Not authorized");
        require(booking.status == BookingStatus.Pending, "Cannot cancel");
        
        booking.status = BookingStatus.Cancelled;
        
        // Refund with fee deduction
        uint256 refundAmount = booking.amount * (10000 - platformFee) / 10000;
        
        if (booking.token == address(0)) {
            payable(booking.customer).transfer(refundAmount);
        } else {
            IERC20(booking.token).transfer(booking.customer, refundAmount);
        }
        
        emit BookingCancelled(_bookingId);
    }
    
    function getUserBookings(address _user) external view returns (uint256[] memory) {
        return userBookings[_user];
    }
}
```

## Frontend Integration

### Contract ABIs and Addresses

Create configuration files for deployed contracts:

```typescript
// src/contracts/config.ts
export const CONTRACT_ADDRESSES = {
  mainnet: {
    TravelBooking: "0x...", // Deployed address
  },
  polygon: {
    TravelBooking: "0x...", // Deployed address
  },
  arbitrum: {
    TravelBooking: "0x...", // Deployed address
  },
} as const;

export const SUPPORTED_TOKENS = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "0xA0b86a33E6441Eb3422132E5EdD6bf1Ed32E7AFE", // Example USDC address
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Example USDT address
} as const;
```

### Contract Service

```typescript
// src/services/contractService.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from '@/contracts/config';
import TravelBookingABI from '@/contracts/abis/TravelBooking.json';

export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize(provider: ethers.Provider, chainId: number) {
    this.provider = provider;
    
    const networkConfig = this.getNetworkConfig(chainId);
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    this.contract = new ethers.Contract(
      networkConfig.TravelBooking,
      TravelBookingABI,
      provider
    );
  }

  async setSigner(signer: ethers.Signer) {
    this.signer = signer;
    if (this.contract) {
      this.contract = this.contract.connect(signer);
    }
  }

  private getNetworkConfig(chainId: number) {
    switch (chainId) {
      case 1: return CONTRACT_ADDRESSES.mainnet;
      case 137: return CONTRACT_ADDRESSES.polygon;
      case 42161: return CONTRACT_ADDRESSES.arbitrum;
      default: return null;
    }
  }

  async createBooking(
    bookingType: string,
    details: string,
    amount: string,
    token: string = SUPPORTED_TOKENS.ETH
  ): Promise<ethers.TransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not set');
    }

    const amountWei = ethers.parseEther(amount);
    
    if (token === SUPPORTED_TOKENS.ETH) {
      return await this.contract.createBooking(
        bookingType,
        details,
        amountWei,
        token,
        { value: amountWei }
      );
    } else {
      // For ERC20 tokens, need to approve first
      const tokenContract = new ethers.Contract(
        token,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        this.signer
      );
      
      await tokenContract.approve(this.contract.getAddress(), amountWei);
      return await this.contract.createBooking(bookingType, details, amountWei, token);
    }
  }

  async getBookingDetails(bookingId: number) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.contract.bookings(bookingId);
  }

  async getUserBookings(userAddress: string): Promise<number[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.contract.getUserBookings(userAddress);
  }

  async cancelBooking(bookingId: number): Promise<ethers.TransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not set');
    }
    
    return await this.contract.cancelBooking(bookingId);
  }
}

export const contractService = new ContractService();
```

### Updated Web3Provider

Add contract service integration to the existing Web3Provider:

```typescript
// Update src/components/Web3Provider.tsx
import { contractService } from '@/services/contractService';

// Add to the Web3Context
interface Web3ContextType {
  // ... existing properties
  contractService: typeof contractService;
  createBooking: (bookingData: BookingData) => Promise<string>;
}

// In the provider component, add contract initialization
useEffect(() => {
  if (provider && chainId) {
    contractService.initialize(provider, chainId);
    if (signer) {
      contractService.setSigner(signer);
    }
  }
}, [provider, chainId, signer]);

const createBooking = async (bookingData: BookingData): Promise<string> => {
  try {
    const tx = await contractService.createBooking(
      bookingData.type,
      JSON.stringify(bookingData.details),
      bookingData.amount.toString(),
      bookingData.token || SUPPORTED_TOKENS.ETH
    );
    
    await tx.wait(); // Wait for confirmation
    return tx.hash;
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
```

### Updated PaymentModal

Integrate smart contract booking into the existing PaymentModal:

```typescript
// Update src/components/PaymentModal.tsx
import { useWeb3 } from '@/components/Web3Provider';

export default function PaymentModal({ booking, onClose, onPaymentComplete }: PaymentModalProps) {
  const { isConnected, address, createBooking, chainInfo } = useWeb3();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleWeb3Payment = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    try {
      const bookingData = {
        type: booking.type,
        details: {
          title: booking.title,
          description: booking.description,
          price: booking.price,
          currency: booking.currency,
          ...booking.details
        },
        amount: booking.price / 100, // Convert from paisa to ETH equivalent
        token: '0x0000000000000000000000000000000000000000' // ETH
      };
      
      const transactionHash = await createBooking(bookingData);
      onPaymentComplete(transactionHash);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add Web3 payment button to the existing payment methods
  return (
    // ... existing modal structure
    <button
      onClick={handleWeb3Payment}
      disabled={isProcessing || !isConnected}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isProcessing ? 'Processing...' : `Pay with ${chainInfo?.name || 'Web3'}`}
    </button>
  );
}
```

## Deployment Guide

### Using Hardhat

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY
    }
  }
};
```

### Deployment Script

```javascript
// scripts/deploy.js
async function main() {
  const TravelBooking = await ethers.getContractFactory("TravelBooking");
  const travelBooking = await TravelBooking.deploy();
  
  await travelBooking.waitForDeployment();
  
  console.log("TravelBooking deployed to:", await travelBooking.getAddress());
  
  // Verify contract
  if (network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await travelBooking.deploymentTransaction().wait(6);
    
    await hre.run("verify:verify", {
      address: await travelBooking.getAddress(),
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## Testing

### Unit Tests

```javascript
// test/TravelBooking.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TravelBooking", function () {
  let travelBooking;
  let owner;
  let customer;

  beforeEach(async function () {
    [owner, customer] = await ethers.getSigners();
    
    const TravelBooking = await ethers.getContractFactory("TravelBooking");
    travelBooking = await TravelBooking.deploy();
  });

  it("Should create a booking", async function () {
    const amount = ethers.parseEther("1.0");
    
    await expect(
      travelBooking.connect(customer).createBooking(
        "hotel",
        "Hotel booking details",
        amount,
        ethers.ZeroAddress,
        { value: amount }
      )
    ).to.emit(travelBooking, "BookingCreated");
    
    const booking = await travelBooking.bookings(1);
    expect(booking.customer).to.equal(customer.address);
    expect(booking.amount).to.equal(amount);
  });
});
```

## Security Considerations

1. **Reentrancy Protection**: Use OpenZeppelin's ReentrancyGuard
2. **Access Control**: Implement proper role-based access
3. **Input Validation**: Validate all user inputs
4. **Oracle Integration**: For real-time pricing (Chainlink)
5. **Upgrade Patterns**: Consider using proxy patterns for upgradability

## Integration Checklist

- [ ] Deploy smart contracts to target networks
- [ ] Update contract addresses in frontend config
- [ ] Add contract ABIs to the project
- [ ] Integrate contractService with Web3Provider
- [ ] Update PaymentModal with smart contract calls
- [ ] Test booking flow end-to-end
- [ ] Add error handling and user feedback
- [ ] Implement booking history and status tracking
- [ ] Add cancellation and refund functionality
- [ ] Set up monitoring and alerts

## Next Steps

1. Deploy contracts to testnets first
2. Integrate with existing Web3Provider
3. Test the complete booking flow
4. Add advanced features like:
   - Multi-token support
   - Booking insurance
   - Loyalty programs
   - Dispute resolution
   - Dynamic pricing

This integration maintains the existing Web3 infrastructure while adding powerful smart contract capabilities for decentralized booking management.
