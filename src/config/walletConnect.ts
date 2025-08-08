// Wallet connection configuration for ethers.js integration
// Compatible with our existing Web3Provider implementation

export interface SupportedChain {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  rpcUrl: string;
  blockExplorer: string;
}

export const supportedChains: SupportedChain[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://etherscan.io'
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '⬡',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    icon: '🔷',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    icon: '🔴',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  }
]

// Wallet connection utilities
export const getChainById = (chainId: number): SupportedChain | undefined => {
  return supportedChains.find(chain => chain.id === chainId);
}

export const isChainSupported = (chainId: number): boolean => {
  return supportedChains.some(chain => chain.id === chainId);
}

export const getDefaultChain = (): SupportedChain => {
  return supportedChains[0]; // Ethereum mainnet
}
