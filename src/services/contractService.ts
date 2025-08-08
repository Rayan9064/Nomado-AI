import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS, NETWORK_CONFIG, BOOKING_STATUS, PLATFORM_CONFIG } from '@/contracts/config';
import { TRAVEL_BOOKING_ABI } from '@/contracts/abis/TravelBooking';
import type { BookingOption } from '@/types';

export interface ContractBooking {
  id: bigint;
  customer: string;
  bookingType: string;
  details: string;
  amount: bigint;
  token: string;
  timestamp: bigint;
  checkInDate: bigint;
  checkOutDate: bigint;
  status: number;
  metadataURI: string;
}

export interface BookingData {
  type: string;
  details: BookingOption;
  amount: string;
  token?: string;
  checkInDate: number;
  checkOutDate: number;
  metadataURI?: string;
}

export class ContractService {
  private contract: any = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private chainId: number | null = null;
  private mockMode: boolean = false;
  private mockBookings: Map<number, ContractBooking> = new Map();
  private nextBookingId: number = 1;

  async initialize(provider: ethers.Provider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
    
    const contractAddress = this.getContractAddress(chainId);
    if (!contractAddress) {
      console.warn(`Smart contract not deployed on network ${chainId}, enabling mock mode`);
      this.mockMode = true;
      return;
    }

    try {
      this.contract = new ethers.Contract(
        contractAddress,
        TRAVEL_BOOKING_ABI,
        provider
      );
      this.mockMode = false;
    } catch (error) {
      console.warn('Failed to initialize contract, enabling mock mode:', error);
      this.mockMode = true;
    }
  }

  async setSigner(signer: ethers.Signer) {
    this.signer = signer;
    if (this.contract) {
      this.contract = this.contract.connect(signer);
    }
  }

  private getContractAddress(chainId: number): string | null {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    return addresses?.TravelBooking || null;
  }

  private getTokenAddress(tokenSymbol: string, chainId: number): string {
    if (tokenSymbol === 'ETH' || tokenSymbol === 'MATIC') {
      return SUPPORTED_TOKENS.ETH;
    }
    
    const tokenConfig = SUPPORTED_TOKENS[tokenSymbol as keyof typeof SUPPORTED_TOKENS];
    if (typeof tokenConfig === 'object') {
      return tokenConfig[chainId as keyof typeof tokenConfig] || SUPPORTED_TOKENS.ETH;
    }
    
    return SUPPORTED_TOKENS.ETH;
  }

  async createBooking(bookingData: BookingData): Promise<{
    transactionHash: string;
    bookingId?: number;
  }> {
    if (this.mockMode) {
      return this.mockCreateBooking(bookingData);
    }

    if (!this.contract || !this.signer || !this.chainId) {
      throw new Error('Contract not initialized or signer not set');
    }

    const tokenAddress = this.getTokenAddress(bookingData.token || 'ETH', this.chainId);
    const amountWei = ethers.parseEther(bookingData.amount);
    
    // Prepare booking details as JSON
    const details = JSON.stringify({
      title: bookingData.details.title,
      description: bookingData.details.description,
      price: bookingData.details.price,
      currency: bookingData.details.currency,
      location: bookingData.details.details?.location || bookingData.details.details?.details?.location,
      rating: bookingData.details.rating,
      ...bookingData.details.details
    });

    try {
      let tx: ethers.TransactionResponse;

      if (tokenAddress === SUPPORTED_TOKENS.ETH) {
        // Native token payment (ETH/MATIC)
        tx = await this.contract.createBooking(
          bookingData.type,
          details,
          amountWei,
          tokenAddress,
          bookingData.checkInDate,
          bookingData.checkOutDate,
          bookingData.metadataURI || '',
          { value: amountWei }
        );
      } else {
        // ERC20 token payment
        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function allowance(address owner, address spender) external view returns (uint256)'
          ],
          this.signer
        );
        
        // Check current allowance
        const currentAllowance = await tokenContract.allowance(
          await this.signer.getAddress(),
          await this.contract.getAddress()
        );
        
        // Approve if needed
        if (currentAllowance < amountWei) {
          const approveTx = await tokenContract.approve(
            await this.contract.getAddress(),
            amountWei
          );
          await approveTx.wait();
        }
        
        tx = await this.contract.createBooking(
          bookingData.type,
          details,
          amountWei,
          tokenAddress,
          bookingData.checkInDate,
          bookingData.checkOutDate,
          bookingData.metadataURI || ''
        );
      }

      const receipt = await tx.wait();
      
      // Extract booking ID from events
      let bookingId: number | undefined;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = this.contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'BookingCreated') {
              bookingId = Number(parsedLog.args.bookingId);
              break;
            }
          } catch (e) {
            // Skip logs that can't be parsed
            continue;
          }
        }
      }

      return {
        transactionHash: tx.hash,
        bookingId
      };
    } catch (error) {
      console.error('Create booking failed:', error);
      throw new Error(`Booking creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBookingDetails(bookingId: number): Promise<ContractBooking | null> {
    if (this.mockMode) {
      return this.mockBookings.get(bookingId) || null;
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const booking = await this.contract.getBooking(bookingId);
      return booking;
    } catch (error) {
      console.error('Get booking details failed:', error);
      return null;
    }
  }

  async getUserBookings(userAddress: string): Promise<number[]> {
    if (this.mockMode) {
      return Array.from(this.mockBookings.keys()).filter(id => 
        this.mockBookings.get(id)?.customer.toLowerCase() === userAddress.toLowerCase()
      );
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const bookingIds = await this.contract.getUserBookings(userAddress);
      return bookingIds.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Get user bookings failed:', error);
      return [];
    }
  }

  async getUserBookingDetails(userAddress: string): Promise<ContractBooking[]> {
    if (this.mockMode) {
      return Array.from(this.mockBookings.values()).filter(booking => 
        booking.customer.toLowerCase() === userAddress.toLowerCase()
      );
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const bookings = await this.contract.getUserBookingDetails(userAddress);
      return bookings;
    } catch (error) {
      console.error('Get user booking details failed:', error);
      return [];
    }
  }

  async cancelBooking(bookingId: number): Promise<string> {
    if (this.mockMode) {
      const booking = this.mockBookings.get(bookingId);
      if (booking) {
        booking.status = 2; // Cancelled status
        this.mockBookings.set(bookingId, booking);
        return `0x${'mock_cancel_tx'.padEnd(64, '0')}`;
      }
      throw new Error('Booking not found');
    }

    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not set');
    }
    
    try {
      const tx = await this.contract.cancelBooking(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Cancel booking failed:', error);
      throw new Error(`Booking cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkInToBooking(bookingId: number): Promise<string> {
    if (this.mockMode) {
      const booking = this.mockBookings.get(bookingId);
      if (booking) {
        booking.status = 3; // Checked-in status
        this.mockBookings.set(bookingId, booking);
        return `0x${'mock_checkin_tx'.padEnd(64, '0')}`;
      }
      throw new Error('Booking not found');
    }

    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not set');
    }
    
    try {
      const tx = await this.contract.checkIn(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Check in failed:', error);
      throw new Error(`Check-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContractStats(): Promise<{
    totalBookings: number;
    totalValue: string;
    platformRevenue: string;
  }> {
    if (this.mockMode) {
      const totalBookings = this.mockBookings.size;
      const totalValue = Array.from(this.mockBookings.values())
        .reduce((sum, booking) => sum + Number(ethers.formatEther(booking.amount)), 0);
      const platformRevenue = totalValue * 0.025; // 2.5% platform fee
      
      return {
        totalBookings,
        totalValue: totalValue.toString(),
        platformRevenue: platformRevenue.toString()
      };
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const stats = await this.contract.getStats();
      return {
        totalBookings: Number(stats.totalBookings),
        totalValue: ethers.formatEther(stats.totalValue),
        platformRevenue: ethers.formatEther(stats.platformRevenue)
      };
    } catch (error) {
      console.error('Get contract stats failed:', error);
      return {
        totalBookings: 0,
        totalValue: '0',
        platformRevenue: '0'
      };
    }
  }

  async getPlatformFee(): Promise<number> {
    if (this.mockMode) {
      return 250; // 2.5% (250 basis points)
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const fee = await this.contract.platformFee();
      return Number(fee);
    } catch (error) {
      console.error('Get platform fee failed:', error);
      return PLATFORM_CONFIG.DEFAULT_FEE;
    }
  }

  async isTokenSupported(tokenAddress: string): Promise<boolean> {
    if (this.mockMode) {
      // Mock: support ETH and common stablecoins
      const supportedTokens = [
        SUPPORTED_TOKENS.ETH,
        typeof SUPPORTED_TOKENS.USDC === 'string' ? SUPPORTED_TOKENS.USDC : SUPPORTED_TOKENS.USDC[1],
        typeof SUPPORTED_TOKENS.USDT === 'string' ? SUPPORTED_TOKENS.USDT : SUPPORTED_TOKENS.USDT[1],
        typeof SUPPORTED_TOKENS.DAI === 'string' ? SUPPORTED_TOKENS.DAI : SUPPORTED_TOKENS.DAI[1]
      ].filter(Boolean);
      
      return supportedTokens.some(token => token === tokenAddress);
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      return await this.contract.supportedTokens(tokenAddress);
    } catch (error) {
      console.error('Check token support failed:', error);
      return false;
    }
  }

  formatBookingStatus(status: number): string {
    return BOOKING_STATUS[status as keyof typeof BOOKING_STATUS] || 'Unknown';
  }

  // Convert contract booking to display format
  formatBookingForDisplay(contractBooking: ContractBooking): {
    id: number;
    customer: string;
    type: string;
    details: any;
    amount: string;
    amountUSD: string;
    token: string;
    status: string;
    statusCode: number;
    createdAt: Date;
    checkInDate: Date;
    checkOutDate: Date;
    metadataURI: string;
  } {
    return {
      id: Number(contractBooking.id),
      customer: contractBooking.customer,
      type: contractBooking.bookingType,
      details: JSON.parse(contractBooking.details),
      amount: ethers.formatEther(contractBooking.amount),
      amountUSD: ethers.formatEther(contractBooking.amount), // Convert to USD in real implementation
      token: contractBooking.token === SUPPORTED_TOKENS.ETH ? 'ETH' : 'ERC20',
      status: this.formatBookingStatus(contractBooking.status),
      statusCode: contractBooking.status,
      createdAt: new Date(Number(contractBooking.timestamp) * 1000),
      checkInDate: new Date(Number(contractBooking.checkInDate) * 1000),
      checkOutDate: new Date(Number(contractBooking.checkOutDate) * 1000),
      metadataURI: contractBooking.metadataURI
    };
  }

  // Listen to contract events
  onBookingCreated(callback: (bookingId: number, customer: string, bookingType: string, amount: string, token: string) => void) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.contract.on('BookingCreated', (bookingId: any, customer: any, bookingType: any, amount: any, token: any) => {
      callback(
        Number(bookingId),
        customer,
        bookingType,
        ethers.formatEther(amount),
        token
      );
    });
  }

  onBookingStatusChanged(callback: (bookingId: number, status: string) => void) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.contract.on('BookingConfirmed', (bookingId: any) => {
      callback(Number(bookingId), 'Confirmed');
    });

    this.contract.on('BookingCancelled', (bookingId: any) => {
      callback(Number(bookingId), 'Cancelled');
    });

    this.contract.on('BookingCompleted', (bookingId: any) => {
      callback(Number(bookingId), 'Completed');
    });
  }

  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Mock implementation methods
  private async mockCreateBooking(bookingData: BookingData): Promise<{
    transactionHash: string;
    bookingId?: number;
  }> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const bookingId = this.nextBookingId++;
    const amountWei = ethers.parseEther(bookingData.amount);
    const mockAddress = '0x742d35cc6647c93f0f6b0b4e4c4e61b7e55bb94e'; // Mock user address

    const mockBooking: ContractBooking = {
      id: BigInt(bookingId),
      customer: mockAddress,
      bookingType: bookingData.type,
      details: JSON.stringify({
        title: bookingData.details.title,
        description: bookingData.details.description,
        price: bookingData.details.price,
        currency: bookingData.details.currency,
        location: bookingData.details.details?.location || 'Mock Location',
        rating: bookingData.details.rating,
        ...bookingData.details.details
      }),
      amount: amountWei,
      token: this.getTokenAddress(bookingData.token || 'ETH', this.chainId || 1),
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      checkInDate: BigInt(bookingData.checkInDate),
      checkOutDate: BigInt(bookingData.checkOutDate),
      status: 0, // Pending status
      metadataURI: bookingData.metadataURI || ''
    };

    this.mockBookings.set(bookingId, mockBooking);

    const mockTxHash = `0x${'mock_booking_tx'.padEnd(64, '0')}${bookingId.toString(16).padStart(4, '0')}`;
    
    console.log(`✅ Mock booking created:`, {
      bookingId,
      txHash: mockTxHash,
      amount: bookingData.amount,
      type: bookingData.type
    });

    return {
      transactionHash: mockTxHash,
      bookingId
    };
  }

  // Get mock mode status
  isMockMode(): boolean {
    return this.mockMode;
  }

  // Force enable/disable mock mode (for testing)
  setMockMode(enabled: boolean) {
    this.mockMode = enabled;
    if (enabled) {
      console.log('🔧 Mock mode enabled - transactions will be simulated');
    } else {
      console.log('🔗 Mock mode disabled - using real contracts');
    }
  }

  // Get all mock bookings (for debugging)
  getMockBookings(): ContractBooking[] {
    return Array.from(this.mockBookings.values());
  }

  // Clear mock data
  clearMockData() {
    this.mockBookings.clear();
    this.nextBookingId = 1;
    console.log('🧹 Mock data cleared');
  }
}

// Export singleton instance
export const contractService = new ContractService();
