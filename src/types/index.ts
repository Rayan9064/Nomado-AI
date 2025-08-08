export interface BookingOption {
  id: string;
  type: 'flight' | 'hotel' | 'tour' | 'activity';
  title: string;
  description: string;
  price: number;
  currency: string;
  details: Record<string, any>;
  popularity?: number;
  rating?: number;
  availability?: 'high' | 'medium' | 'low';
}

export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  bookingOptions?: BookingOption[];
  bookings?: BookingOption[];
  searchResults?: SearchResult[];
  mcpProcessed?: boolean;
  agentResponse?: any;
  confidence?: number;
}

export interface SearchResult {
  id: string;
  query: string;
  results: BookingOption[];
  totalFound: number;
  searchTime: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  priceRange?: { min?: number; max?: number };
  dateRange?: { start?: string; end?: string };
  location?: string;
  type?: string[];
  rating?: number;
}

export interface BookingFlow {
  step: 'search' | 'select' | 'review' | 'payment' | 'confirm';
  searchQuery?: string;
  selectedOption?: BookingOption;
  paymentMethod?: 'crypto' | 'bridge';
  confirmation?: BookingConfirmation;
}

export interface BookingConfirmation {
  id: string;
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  details: BookingOption;
  paymentDetails: PaymentResult;
  createdAt: Date;
}

export interface MCPBookingIntent {
  type: 'booking_request';
  service: 'flight' | 'hotel' | 'tour' | 'activity';
  parameters: {
    destination?: string;
    origin?: string;
    dates?: {
      start: string;
      end?: string;
    };
    budget?: {
      amount: number;
      currency: string;
    };
    passengers?: number;
    rooms?: number;
    preferences?: string[];
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  method: 'crypto' | 'bridge';
}
