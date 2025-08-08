// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  1: {
    TravelBooking: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  },
  // Polygon Mainnet
  137: {
    TravelBooking: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  },
  // Arbitrum One
  42161: {
    TravelBooking: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  },
  // Optimism
  10: {
    TravelBooking: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  },
  // Sepolia Testnet (for testing)
  11155111: {
    TravelBooking: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  },
  // Polygon Mumbai Testnet (for testing)
  80001: {
    TravelBooking: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  },
} as const;

// Supported tokens for payments
export const SUPPORTED_TOKENS = {
  // Native tokens
  ETH: "0x0000000000000000000000000000000000000000",
  MATIC: "0x0000000000000000000000000000000000000000",
  
  // Stablecoins
  USDC: {
    1: "0xA0b86a33E6441Eb3422132E5EdD6bf1Ed32E7AFE", // Ethereum
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
    42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Arbitrum
    10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // Optimism
  },
  USDT: {
    1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Ethereum
    137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum
    10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // Optimism
  },
  DAI: {
    1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Ethereum
    137: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // Polygon
    42161: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // Arbitrum
    10: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // Optimism
  },
} as const;

// Network configurations
export const NETWORK_CONFIG = {
  1: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    blockExplorer: "https://etherscan.io",
  },
  137: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
  },
  42161: {
    name: "Arbitrum",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
  },
  10: {
    name: "Optimism",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
  },
  11155111: {
    name: "Sepolia",
    symbol: "ETH",
    decimals: 18,
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  80001: {
    name: "Mumbai",
    symbol: "MATIC",
    decimals: 18,
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    blockExplorer: "https://mumbai.polygonscan.com",
  },
} as const;

// Booking status enum mapping
export const BOOKING_STATUS = {
  0: "Pending",
  1: "Confirmed", 
  2: "CheckedIn",
  3: "Completed",
  4: "Cancelled",
  5: "Refunded",
} as const;

// Platform fee configuration
export const PLATFORM_CONFIG = {
  DEFAULT_FEE: 250, // 2.5% in basis points
  MAX_FEE: 1000, // 10% maximum
  FEE_PRECISION: 10000, // Basis points precision
} as const;

// Gas price configurations for different networks
export const GAS_CONFIG = {
  1: { // Ethereum
    gasPrice: "20000000000", // 20 gwei
    gasLimit: "500000",
  },
  137: { // Polygon
    gasPrice: "30000000000", // 30 gwei
    gasLimit: "300000",
  },
  42161: { // Arbitrum
    gasPrice: "1000000000", // 1 gwei
    gasLimit: "2000000",
  },
  10: { // Optimism
    gasPrice: "1000000000", // 1 gwei
    gasLimit: "2000000",
  },
} as const;

export type ChainId = keyof typeof CONTRACT_ADDRESSES;
export type NetworkConfig = typeof NETWORK_CONFIG[ChainId];
export type BookingStatus = keyof typeof BOOKING_STATUS;
