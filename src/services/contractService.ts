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

  async initialize(provider: ethers.Provider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
    
    const contractAddress = this.getContractAddress(chainId);
    if (!contractAddress) {
      throw new Error(`Smart contract not deployed on network ${chainId}`);
    }

    this.contract = new ethers.Contract(
      contractAddress,
      TRAVEL_BOOKING_ABI,
      provider
    );
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
}

// Export singleton instance
export const contractService = new ContractService();
