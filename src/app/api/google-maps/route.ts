import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAgP3xBEZVJ-_6AtFcFVZZLQ_3R0lc7iqw';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'test':
        return await testGoogleMapsAPI();
      
      case 'geocode':
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
        }
        return await geocodePlace(address);
      
      case 'nearby-hotels':
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const radius = searchParams.get('radius') || '5000';
        const maxResults = searchParams.get('maxResults') || '20';
        
        if (!lat || !lng) {
          return NextResponse.json({ error: 'Latitude and longitude parameters required' }, { status: 400 });
        }
        
        return await searchNearbyHotels(
          { lat: parseFloat(lat), lng: parseFloat(lng) },
          parseInt(radius),
          parseInt(maxResults)
        );
      
      case 'text-search':
        const query = searchParams.get('query');
        const maxResultsText = searchParams.get('maxResults') || '20';
        
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }
        
        return await searchHotelsByText(query, parseInt(maxResultsText));
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Google Maps API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function testGoogleMapsAPI() {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return NextResponse.json({
        isValid: true,
        message: 'Google Maps API is working correctly',
        testResult: data.results[0]?.formatted_address || 'Test successful'
      });
    } else {
      return NextResponse.json({
        isValid: false,
        error: `API Error: ${data.status} - ${data.error_message || 'Unknown error'}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      isValid: false,
      error: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

async function geocodePlace(address: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'OK' && data.results.length > 0) {
    const result = data.results[0];
    return NextResponse.json({
      success: true,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      formatted_address: result.formatted_address
    });
  } else {
    throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'No results found'}`);
  }
}

async function searchNearbyHotels(location: { lat: number; lng: number }, radius: number, maxResults: number) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=lodging&key=${GOOGLE_MAPS_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'OK') {
    const hotels = data.results.slice(0, maxResults).map(formatHotelResult);
    return NextResponse.json({
      success: true,
      hotels,
      totalFound: data.results.length
    });
  } else {
    throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }
}

async function searchHotelsByText(query: string, maxResults: number) {
  const hotelQuery = `hotels in ${query}`;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(hotelQuery)}&key=${GOOGLE_MAPS_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'OK') {
    const hotels = data.results.slice(0, maxResults).map(formatHotelResult);
    return NextResponse.json({
      success: true,
      hotels,
      totalFound: data.results.length
    });
  } else {
    throw new Error(`Text search error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }
}

function formatHotelResult(place: any) {
  // Get the photo URL if available
  let photoUrl: string | null = null;
  if (place.photos && place.photos.length > 0) {
    const photoReference = place.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  return {
    id: place.place_id,
    type: 'hotel' as const,
    title: place.name,
    description: `${place.vicinity || place.formatted_address || ''}${place.types ? ` • ${place.types.filter((t: string) => t !== 'lodging' && t !== 'establishment').join(', ')}` : ''}`,
    price: Math.floor(Math.random() * 15000) + 3000, // Random price for demo
    currency: 'INR',
    image: photoUrl || '/images/hotel-placeholder.svg',
    rating: place.rating || 0,
    details: {
      address: place.vicinity || place.formatted_address || '',
      placeId: place.place_id,
      location: place.geometry?.location,
      priceLevel: place.price_level,
      userRatingsTotal: place.user_ratings_total,
      businessStatus: place.business_status
    }
  };
}
