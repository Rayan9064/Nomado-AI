'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { contractService, type BookingData } from '@/services/contractService'

interface Web3ContextType {
  isConnected: boolean
  address: string | null
  chainId: number | null
  connector: string | null
  provider: ethers.Provider | null
  signer: ethers.Signer | null
  connect: (connectorType?: string) => Promise<void>
  disconnect: () => Promise<void>
  createBooking: (bookingData: BookingData) => Promise<{ transactionHash: string; bookingId?: number }>
  getUserBookings: () => Promise<any[]>
  cancelBooking: (bookingId: number) => Promise<string>
  checkInToBooking: (bookingId: number) => Promise<string>
  getContractStats: () => Promise<{ totalBookings: number; totalValue: string; platformRevenue: string }>
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
  const [provider, setProvider] = useState<ethers.Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)

  // Check if wallet is already connected on load
  useEffect(() => {
    checkConnection()
  }, [])

  // Initialize contract service when provider/chainId changes
  useEffect(() => {
    if (provider && chainId) {
      initializeContract()
    }
  }, [provider, chainId])

  // Set signer when provider and address change
  useEffect(() => {
    if (provider && address) {
      setupSigner()
    }
  }, [provider, address])

  const initializeContract = async () => {
    if (provider && chainId) {
      try {
        await contractService.initialize(provider, chainId)
        
        // Show user if mock mode is enabled
        if (contractService.isMockMode()) {
          console.log('🔧 Contract initialized in MOCK MODE - transactions will be simulated')
        } else {
          console.log('🔗 Contract initialized successfully - using real blockchain')
        }
        
        if (signer) {
          await contractService.setSigner(signer)
        }
      } catch (error) {
        console.error('Failed to initialize contract service:', error)
      }
    }
  }

  const setupSigner = async () => {
    if (provider && address && typeof window !== 'undefined' && window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum as any)
        const signer = await browserProvider.getSigner()
        setSigner(signer)
        
        if (chainId) {
          await contractService.setSigner(signer)
        }
      } catch (error) {
        console.error('Failed to setup signer:', error)
      }
    }
  }

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
          
          // Setup provider
          const browserProvider = new ethers.BrowserProvider(window.ethereum as any)
          setProvider(browserProvider)
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

          // Setup provider
          const browserProvider = new ethers.BrowserProvider(window.ethereum as any)
          setProvider(browserProvider)

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
      setProvider(null)
      setSigner(null)
      
      // Clean up contract service listeners
      contractService.removeAllListeners()
      
      // If WalletConnect, disconnect properly
      if (connector === 'WalletConnect' && typeof window !== 'undefined') {
        // Clear WalletConnect session if exists
        localStorage.removeItem('walletconnect')
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  // Contract interaction methods
  const createBooking = async (bookingData: BookingData) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    return await contractService.createBooking(bookingData)
  }

  const getUserBookings = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    const bookings = await contractService.getUserBookingDetails(address)
    return bookings.map(booking => contractService.formatBookingForDisplay(booking))
  }

  const cancelBooking = async (bookingId: number) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    return await contractService.cancelBooking(bookingId)
  }

  const checkInToBooking = async (bookingId: number) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    return await contractService.checkInToBooking(bookingId)
  }

  const getContractStats = async () => {
    return await contractService.getContractStats()
  }

  const value: Web3ContextType = {
    isConnected,
    address,
    chainId,
    connector,
    provider,
    signer,
    connect,
    disconnect,
    createBooking,
    getUserBookings,
    cancelBooking,
    checkInToBooking,
    getContractStats
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
