'use client';

import type { BookingOption } from '@/types';
import { AlertCircle, CheckCircle, CreditCard, Shield, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useWeb3, getChainInfo } from './Web3Provider';

interface PaymentModalProps {
  booking: BookingOption;
  onClose: () => void;
  onPaymentComplete: (transactionId: string) => void;
}

export default function PaymentModal({ booking, onClose, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'bridge'>('crypto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { isConnected, address, chainId, connect, createBooking } = useWeb3();

  const formatPrice = () => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: booking.currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 0,
    }).format(booking.price);
  };

  const calculateCheckInDate = () => {
    // Default to tomorrow if no date specified
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (booking.details?.checkIn) {
      return new Date(booking.details.checkIn);
    }
    return tomorrow;
  };

  const calculateCheckOutDate = () => {
    const checkIn = calculateCheckInDate();
    const checkOut = new Date(checkIn);
    
    if (booking.details?.checkOut) {
      return new Date(booking.details.checkOut);
    }
    
    // Default to 1 day later for hotels, 3 days for tours, 1 day for activities/flights
    let daysToAdd = 1;
    if (booking.type === 'tour') daysToAdd = 3;
    if (booking.type === 'flight') daysToAdd = 0; // Same day for flights
    
    checkOut.setDate(checkOut.getDate() + daysToAdd);
    return checkOut;
  };

  const handlePayment = async () => {
    if (!isConnected) {
      try {
        await connect('MetaMask');
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setErrorMessage('Failed to connect wallet. Please try again.');
        setPaymentStep('error');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStep('processing');
    setErrorMessage('');

    try {
      const checkInDate = calculateCheckInDate();
      const checkOutDate = calculateCheckOutDate();
      
      const bookingData = {
        type: booking.type,
        details: booking,
        amount: (booking.price / 100000).toString(), // Convert from paisa to ETH (rough conversion)
        token: 'ETH', // Default to native token
        checkInDate: Math.floor(checkInDate.getTime() / 1000),
        checkOutDate: Math.floor(checkOutDate.getTime() / 1000),
        metadataURI: ''
      };

      // Check if we're in mock mode
      const isMockMode = await import('@/services/contractService').then(m => m.contractService.isMockMode());
      if (isMockMode) {
        console.log('🔧 Processing MOCK transaction - no real blockchain interaction');
      }

      const result = await createBooking(bookingData);
      
      setPaymentStep('success');
      
      setTimeout(() => {
        onPaymentComplete(result.transactionHash);
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setPaymentStep('error');
      setIsProcessing(false);
    }
  };

  const chainInfo = chainId ? getChainInfo(chainId) : null;

  if (paymentStep === 'processing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-gray-600">
              {paymentMethod === 'crypto' 
                ? 'Confirming blockchain transaction...' 
                : 'Processing Web3 to Web2 bridge payment...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please do not close this window
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">Your booking has been confirmed on the blockchain.</p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                Network: {chainInfo?.name || 'Ethereum'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You will receive confirmation details shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Payment Failed</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setPaymentStep('select');
                  setErrorMessage('');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">{booking.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{booking.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">{formatPrice()}</span>
            <span className="text-sm text-gray-500">{booking.type}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Choose Payment Method</h3>
          
          <div className="space-y-3">
            {/* Crypto Payment */}
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="crypto"
                checked={paymentMethod === 'crypto'}
                onChange={() => setPaymentMethod('crypto')}
                className="mr-3"
              />
              <div className="flex items-center space-x-3">
                <Wallet className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-medium">WalletConnect / MetaMask</div>
                  <div className="text-sm text-gray-500">
                    {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect your Web3 wallet'}
                    {chainInfo && <span className="ml-1">({chainInfo.name})</span>}
                  </div>
                </div>
              </div>
              {booking.type === 'flight' || booking.type === 'tour' ? (
                <div className="ml-auto">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Native Web3</span>
                </div>
              ) : null}
            </label>

            {/* Bridge Payment */}
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="bridge"
                checked={paymentMethod === 'bridge'}
                onChange={() => setPaymentMethod('bridge')}
                className="mr-3"
              />
              <div className="flex items-center space-x-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">Web3 → Web2 Bridge</div>
                  <div className="text-sm text-gray-500">Via P2P.me for traditional vendors</div>
                </div>
              </div>
              {booking.type === 'hotel' ? (
                <div className="ml-auto">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Bridge</span>
                </div>
              ) : null}
            </label>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          {paymentMethod === 'crypto' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Secure Crypto Payment</span>
              </div>
              <p className="text-blue-800 text-sm">
                Your payment will be processed directly through your connected Web3 wallet using smart contracts.
                Transaction will be confirmed on the {chainInfo?.name || 'blockchain'}.
              </p>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">Bridge Payment</span>
              </div>
              <p className="text-purple-800 text-sm">
                Your crypto will be converted and transferred to the vendor&apos;s traditional payment system
                through our secure P2P.me bridge.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Processing...' : isConnected ? `Pay ${formatPrice()}` : `Connect Wallet & Pay ${formatPrice()}`}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <Shield className="h-4 w-4 inline mr-1" />
          Secured by blockchain technology and MCP protocol
        </div>
      </div>
    </div>
  );
}
