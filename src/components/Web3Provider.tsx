'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Web3ContextType {
  isConnected: boolean
  address: string | null
  chainId: number | null
  connector: string | null
  connect: (connectorType?: string) => Promise<void>
  disconnect: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

// Supported chains configuration
export const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://cloudflare-eth.com' },
  137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-rpc.com' },
  42161: { name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
  10: { name: 'Optimism', symbol: 'ETH', rpc: 'https://mainnet.optimism.io' }
}

interface Web3ProviderProps {
  children: ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [connector, setConnector] = useState<string | null>(null)

  // Check if wallet is already connected on load
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          setConnector('MetaMask')
          
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          setChainId(parseInt(chainId, 16))
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error)
      }
    }
  }

  const connect = async (connectorType: string = 'MetaMask') => {
    try {
      if (connectorType === 'WalletConnect') {
        // Initialize WalletConnect
        await connectWalletConnect()
      } else {
        // Connect via injected wallet (MetaMask, etc.)
        await connectInjected()
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  const connectInjected = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          setConnector('MetaMask')
          
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          setChainId(parseInt(chainId, 16))

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              disconnect()
            } else {
              setAddress(accounts[0])
            }
          })

          // Listen for chain changes
          window.ethereum.on('chainChanged', (chainId: string) => {
            setChainId(parseInt(chainId, 16))
          })
        }
      } catch (error) {
        throw new Error('Failed to connect to MetaMask')
      }
    } else {
      throw new Error('MetaMask is not installed')
    }
  }

  const connectWalletConnect = async () => {
    try {
      // For now, fall back to injected wallet if WalletConnect is not available
      // In a production environment, you would properly configure WalletConnect
      if (typeof window !== 'undefined' && window.ethereum) {
        await connectInjected()
        setConnector('WalletConnect')
      } else {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.')
      }
    } catch (error) {
      throw new Error('Failed to connect via WalletConnect')
    }
  }

  const disconnect = async () => {
    try {
      setIsConnected(false)
      setAddress(null)
      setChainId(null)
      setConnector(null)
      
      // If WalletConnect, disconnect properly
      if (connector === 'WalletConnect' && typeof window !== 'undefined') {
        // Clear WalletConnect session if exists
        localStorage.removeItem('walletconnect')
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const value: Web3ContextType = {
    isConnected,
    address,
    chainId,
    connector,
    connect,
    disconnect
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// Helper function to get chain info
export function getChainInfo(chainId: number) {
  return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || {
    name: 'Unknown Chain',
    symbol: 'ETH',
    rpc: ''
  }
}
