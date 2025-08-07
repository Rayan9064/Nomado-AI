export const APP_CONFIG = {
  name: 'Unified AI Booking Agent',
  description: 'AI-powered booking agent for flights, hotels, tours, and activities with Web3 payments',
  version: '1.0.0',
  developer: 'AI Booking Team'
};

export const BOOKING_TYPES = {
  FLIGHT: 'flight',
  HOTEL: 'hotel',
  TOUR: 'tour',
  ACTIVITY: 'activity'
} as const;

export const CURRENCIES = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR'
} as const;

export const PAYMENT_METHODS = {
  CRYPTO: 'crypto',
  BRIDGE: 'bridge'
} as const;

export const API_ENDPOINTS = {
  BOOKING: '/api/booking',
  PAYMENT: '/api/payment'
};

export const SAMPLE_QUERIES = [
  "Book a 3-day trip to Goa under ₹15k in September",
  "Find me a hotel in Mumbai for next weekend",
  "I need a flight from Delhi to Bangalore tomorrow",
  "Plan a tour package for Kerala for 5 days",
  "Book activities in Manali for adventure sports",
  "Find budget accommodation near airport"
];

export const SUPPORTED_LOCATIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Goa', 'Kerala', 'Rajasthan', 'Kashmir', 'Manali', 'Shimla',
  'Jaipur', 'Agra', 'Varanasi', 'Rishikesh', 'Darjeeling'
];

export const MCP_CONFIG = {
  version: '1.0',
  protocol: 'Model Context Protocol',
  supportedServices: ['flight', 'hotel', 'tour', 'activity']
};

export const WALLET_CONFIG = {
  name: 'Aya Wallet',
  type: 'Web3',
  supportedNetworks: ['Ethereum', 'Polygon', 'BSC'],
  bridgeProvider: 'P2P.me'
};
