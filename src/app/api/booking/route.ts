import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock booking options based on query
    const mockBookings = generateMockBookings(query);
    
    return NextResponse.json({
      success: true,
      bookings: mockBookings,
      mcpIntent: generateMCPIntent(query)
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process booking request' },
      { status: 500 }
    );
  }
}

function generateMockBookings(query: string) {
  const bookings = [];
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('goa') || lowerQuery.includes('trip')) {
    bookings.push({
      id: 'flight-goa-1',
      type: 'flight',
      title: 'Mumbai to Goa - IndiGo',
      description: 'Non-stop flight, 1h 30m duration',
      price: 8500,
      currency: 'INR',
      details: {
        departure: 'Mumbai (BOM)',
        arrival: 'Goa (GOI)',
        date: '2025-09-15',
        returnDate: '2025-09-18',
        airline: 'IndiGo',
        duration: '1h 30m',
        stops: 0
      }
    });
    
    bookings.push({
      id: 'hotel-goa-1',
      type: 'hotel',
      title: 'Taj Holiday Village Resort & Spa',
      description: 'Luxury beachfront resort with spa and pool',
      price: 12000,
      currency: 'INR',
      details: {
        location: 'Candolim Beach, Goa',
        checkIn: '2025-09-15',
        checkOut: '2025-09-18',
        rating: 4.6,
        amenities: ['Beach Access', 'Spa', 'Pool', 'Restaurant', 'WiFi']
      }
    });
  }
  
  if (lowerQuery.includes('hotel') || lowerQuery.includes('accommodation')) {
    bookings.push({
      id: 'hotel-generic-1',
      type: 'hotel',
      title: 'Premium City Hotel',
      description: 'Modern hotel in prime location',
      price: 6500,
      currency: 'INR',
      details: {
        location: 'City Center',
        rating: 4.3,
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Business Center']
      }
    });
  }
  
  if (lowerQuery.includes('tour') || lowerQuery.includes('package')) {
    bookings.push({
      id: 'tour-1',
      type: 'tour',
      title: 'Heritage Tour Package',
      description: 'Guided tour of historical sites',
      price: 4500,
      currency: 'INR',
      details: {
        duration: '3 days',
        includes: ['Guide', 'Transportation', 'Entry Fees'],
        highlights: ['Historic Forts', 'Local Markets', 'Cultural Sites']
      }
    });
  }
  
  return bookings;
}

function generateMCPIntent(query: string) {
  return {
    mcp_version: "1.0",
    request_type: "booking_request",
    service: determineService(query),
    parameters: parseParameters(query),
    timestamp: new Date().toISOString()
  };
}

function determineService(query: string) {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('hotel')) return 'hotel';
  if (lowerQuery.includes('flight')) return 'flight';
  if (lowerQuery.includes('tour')) return 'tour';
  if (lowerQuery.includes('activity')) return 'activity';
  return 'general';
}

function parseParameters(query: string) {
  const params: any = {};
  
  // Extract destination
  const destinationMatch = query.match(/to\s+([A-Za-z\s]+?)(?:\s|$|,|\.|under|in|for)/i);
  if (destinationMatch) {
    params.destination = destinationMatch[1].trim();
  }
  
  // Extract budget
  const budgetMatch = query.match(/under\s*₹?(\d+)k?/i);
  if (budgetMatch) {
    params.budget = {
      amount: parseInt(budgetMatch[1]) * (budgetMatch[0].includes('k') ? 1000 : 1),
      currency: 'INR'
    };
  }
  
  // Extract duration
  const durationMatch = query.match(/(\d+)[-\s]?day/i);
  if (durationMatch) {
    params.duration = parseInt(durationMatch[1]);
  }
  
  return params;
}
