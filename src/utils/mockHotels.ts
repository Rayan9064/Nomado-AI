// Mock hotel data for development and demonstration
export interface MockHotel {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  photos: string[];
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  hotelType: 'luxury' | 'business' | 'budget' | 'boutique' | 'resort';
}

// Comprehensive mock hotel database
export const mockHotels: Record<string, MockHotel[]> = {
  'new york': [
    {
      id: 'ny-1',
      name: 'The Plaza Hotel',
      rating: 4.5,
      reviewCount: 2847,
      address: '768 5th Ave, New York, NY 10019',
      pricePerNight: 25000,
      currency: 'INR',
      amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Gym', 'Concierge'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 40.7647, lng: -73.9753 },
      description: 'Iconic luxury hotel in the heart of Manhattan',
      hotelType: 'luxury'
    },
    {
      id: 'ny-2',
      name: 'Pod Hotels Times Square',
      rating: 4.2,
      reviewCount: 1563,
      address: '400 W 42nd St, New York, NY 10036',
      pricePerNight: 8500,
      currency: 'INR',
      amenities: ['Free WiFi', 'Restaurant', 'Bar', '24/7 Front Desk'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 40.7580, lng: -73.9855 },
      description: 'Modern pod-style hotel in Times Square',
      hotelType: 'budget'
    },
    {
      id: 'ny-3',
      name: 'The High Line Hotel',
      rating: 4.3,
      reviewCount: 943,
      address: '180 10th Ave, New York, NY 10011',
      pricePerNight: 15000,
      currency: 'INR',
      amenities: ['Free WiFi', 'Restaurant', 'Garden', 'Pet Friendly'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 40.7423, lng: -74.0063 },
      description: 'Charming boutique hotel near the High Line',
      hotelType: 'boutique'
    }
  ],
  'london': [
    {
      id: 'ld-1',
      name: 'The Savoy',
      rating: 4.6,
      reviewCount: 3241,
      address: 'Strand, London WC2R 0EZ, UK',
      pricePerNight: 35000,
      currency: 'INR',
      amenities: ['Free WiFi', 'Spa', 'Fine Dining', 'Butler Service', 'Thames View'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 51.5102, lng: -0.1202 },
      description: 'Legendary luxury hotel on the Thames',
      hotelType: 'luxury'
    },
    {
      id: 'ld-2',
      name: 'Premier Inn London City',
      rating: 4.1,
      reviewCount: 2156,
      address: '1 Aldgate, London EC3N 1RE, UK',
      pricePerNight: 7500,
      currency: 'INR',
      amenities: ['Free WiFi', 'Restaurant', 'Air Conditioning'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 51.5144, lng: -0.0754 },
      description: 'Comfortable business hotel in the City',
      hotelType: 'business'
    }
  ],
  'paris': [
    {
      id: 'pr-1',
      name: 'Hotel Ritz Paris',
      rating: 4.7,
      reviewCount: 1876,
      address: '15 Place Vendôme, 75001 Paris, France',
      pricePerNight: 45000,
      currency: 'INR',
      amenities: ['Spa', 'Fine Dining', 'Shopping', 'Concierge', 'Valet'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 48.8682, lng: 2.3298 },
      description: 'Legendary Parisian palace hotel',
      hotelType: 'luxury'
    },
    {
      id: 'pr-2',
      name: 'Hotel des Grands Boulevards',
      rating: 4.4,
      reviewCount: 892,
      address: '17 Boulevard Poissonnière, 75002 Paris, France',
      pricePerNight: 18000,
      currency: 'INR',
      amenities: ['Free WiFi', 'Restaurant', 'Bar', 'Garden Courtyard'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 48.8718, lng: 2.3431 },
      description: 'Stylish boutique hotel in central Paris',
      hotelType: 'boutique'
    }
  ],
  'tokyo': [
    {
      id: 'tk-1',
      name: 'Park Hyatt Tokyo',
      rating: 4.5,
      reviewCount: 2341,
      address: '3-7-1-2 Nishi Shinjuku, Tokyo 163-1055, Japan',
      pricePerNight: 28000,
      currency: 'INR',
      amenities: ['Spa', 'City Views', 'Fine Dining', 'Pool', 'Concierge'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 35.6858, lng: 139.6917 },
      description: 'Luxury hotel with stunning city views',
      hotelType: 'luxury'
    }
  ],
  'dubai': [
    {
      id: 'db-1',
      name: 'Burj Al Arab Jumeirah',
      rating: 4.8,
      reviewCount: 4521,
      address: 'Jumeirah St, Dubai, UAE',
      pricePerNight: 55000,
      currency: 'INR',
      amenities: ['Private Beach', 'Helicopter Transfer', 'Butler Service', 'Spa', 'Fine Dining'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 25.1412, lng: 55.1856 },
      description: 'Iconic sail-shaped luxury resort',
      hotelType: 'resort'
    }
  ],
  'mumbai': [
    {
      id: 'mb-1',
      name: 'The Taj Mahal Palace',
      rating: 4.6,
      reviewCount: 3892,
      address: 'Apollo Bunder, Mumbai 400001, India',
      pricePerNight: 22000,
      currency: 'INR',
      amenities: ['Heritage Property', 'Spa', 'Pool', 'Multiple Restaurants', 'Sea View'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 18.9217, lng: 72.8331 },
      description: 'Iconic heritage hotel overlooking the Arabian Sea',
      hotelType: 'luxury'
    },
    {
      id: 'mb-2',
      name: 'Hotel Regent Mumbai',
      rating: 4.2,
      reviewCount: 1247,
      address: '57, Colaba Causeway, Mumbai 400001, India',
      pricePerNight: 6500,
      currency: 'INR',
      amenities: ['Free WiFi', 'Restaurant', 'Airport Transfer', 'Laundry'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 18.9067, lng: 72.8147 },
      description: 'Comfortable hotel in the heart of Colaba',
      hotelType: 'business'
    }
  ],
  'goa': [
    {
      id: 'goa-1',
      name: 'The Leela Goa',
      rating: 4.5,
      reviewCount: 2156,
      address: 'Cavelossim Beach, South Goa 403731, India',
      pricePerNight: 18000,
      currency: 'INR',
      amenities: ['Beach Access', 'Spa', 'Pool', 'Water Sports', 'Multiple Restaurants'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 15.2632, lng: 73.9442 },
      description: 'Luxury beach resort in South Goa',
      hotelType: 'resort'
    },
    {
      id: 'goa-2',
      name: 'Zostel Goa',
      rating: 4.0,
      reviewCount: 1876,
      address: 'Near Calangute Beach, North Goa 403516, India',
      pricePerNight: 1200,
      currency: 'INR',
      amenities: ['Free WiFi', 'Common Kitchen', 'Games Room', 'Beach Access'],
      photos: ['/images/hotel-placeholder.svg'],
      location: { lat: 15.5527, lng: 73.7684 },
      description: 'Budget-friendly hostel near Calangute Beach',
      hotelType: 'budget'
    }
  ]
};

// Function to search hotels by location
export function searchHotelsByLocation(query: string, maxResults: number = 10): MockHotel[] {
  const searchTerm = query.toLowerCase().trim();
  let results: MockHotel[] = [];
  
  // Direct city match
  if (mockHotels[searchTerm]) {
    results = mockHotels[searchTerm];
  } else {
    // Fuzzy search across all cities
    Object.entries(mockHotels).forEach(([city, hotels]) => {
      if (city.includes(searchTerm) || searchTerm.includes(city)) {
        results.push(...hotels);
      }
    });
    
    // If no city match, search hotel names and descriptions
    if (results.length === 0) {
      Object.values(mockHotels).flat().forEach(hotel => {
        if (hotel.name.toLowerCase().includes(searchTerm) ||
            hotel.description.toLowerCase().includes(searchTerm) ||
            hotel.address.toLowerCase().includes(searchTerm)) {
          results.push(hotel);
        }
      });
    }
  }
  
  return results.slice(0, maxResults);
}

// Function to search hotels near coordinates (mock)
export function searchHotelsNearLocation(lat: number, lng: number, radiusKm: number = 10, maxResults: number = 10): MockHotel[] {
  // For demo purposes, return hotels from a major city based on rough coordinates
  if (lat >= 40.7 && lat <= 40.8 && lng >= -74.0 && lng <= -73.9) {
    return mockHotels['new york'].slice(0, maxResults);
  } else if (lat >= 51.5 && lat <= 51.6 && lng >= -0.2 && lng <= 0.0) {
    return mockHotels['london'].slice(0, maxResults);
  } else if (lat >= 48.8 && lat <= 48.9 && lng >= 2.3 && lng <= 2.4) {
    return mockHotels['paris'].slice(0, maxResults);
  } else if (lat >= 18.9 && lat <= 19.0 && lng >= 72.8 && lng <= 72.9) {
    return mockHotels['mumbai'].slice(0, maxResults);
  } else {
    // Return a mix of hotels for other locations
    const allHotels = Object.values(mockHotels).flat();
    return allHotels.slice(0, maxResults);
  }
}

// Function to get random hotels for "featured" or general display
export function getFeaturedHotels(count: number = 6): MockHotel[] {
  const allHotels = Object.values(mockHotels).flat();
  const shuffled = allHotels.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Convert mock hotel to BookingOption format
export function convertMockHotelToBookingOption(hotel: MockHotel) {
  return {
    id: hotel.id,
    type: 'hotel' as const,
    title: hotel.name,
    description: hotel.description,
    price: hotel.pricePerNight,
    currency: hotel.currency,
    image: hotel.photos[0],
    rating: hotel.rating,
    location: hotel.address,
    details: {
      amenities: hotel.amenities,
      reviewCount: hotel.reviewCount,
      hotelType: hotel.hotelType,
      coordinates: hotel.location
    }
  };
}
