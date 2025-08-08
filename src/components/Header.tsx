'use client';

import { Bot, Menu, Wallet, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useWeb3, getChainInfo } from './Web3Provider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const { isConnected, address, chainId, connector, connect, disconnect } = useWeb3();
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setShowWalletOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleWalletAction = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      setShowWalletOptions(true);
    }
  };

  const connectWithProvider = async (provider: string) => {
    try {
      await connect(provider);
      setShowWalletOptions(false);
    } catch (error) {
      console.error('Failed to connect:', error);
      // You could show a toast notification here
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const chainInfo = chainId ? getChainInfo(chainId) : null;

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Nomado AI</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Home
            </Link>
            <a href="/hotel-search" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Hotel Search Demo
            </a>
            <a href="/demo" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              MCP Demo
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Flights
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Hotels
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Tours
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Activities
            </a>
          </nav>

          {/* Wallet Connection & Theme Toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {/* Wallet Connection */}
            <div className="relative" ref={walletDropdownRef}>
              <button
                onClick={handleWalletAction}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isConnected
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isConnected ? (
                    <div className="flex items-center space-x-1">
                      <span>{formatAddress(address!)}</span>
                      {chainInfo && (
                        <span className="text-xs opacity-75">({chainInfo.name})</span>
                      )}
                    </div>
                  ) : (
                    'Connect Wallet'
                  )}
                </span>
                {!isConnected && (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </button>

              {/* Wallet Options Dropdown */}
              {showWalletOptions && !isConnected && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-2">
                    <button
                      onClick={() => connectWithProvider('MetaMask')}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        🦊
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">MetaMask</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Browser wallet</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => connectWithProvider('WalletConnect')}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        🔗
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">WalletConnect</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Scan with wallet</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Home
              </Link>
              <a href="/demo" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                MCP Demo
              </a>
              <a href="#" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Flights
              </a>
              <a href="#" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Hotels
              </a>
              <a href="#" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Tours
              </a>
              <a href="#" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Activities
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
