'use client';

import { HotelSearchInterface } from '@/components/HotelSearchInterface';
import SearchResults from '@/components/SearchResults';
import type { BookingOption } from '@/types';
import { useState } from 'react';

export default function HotelSearchDemo() {
  const [hotels, setHotels] = useState<BookingOption[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearch = (searchData: any) => {
    setSearchQuery(`Hotels in ${searchData.destination} for ${searchData.guests} guest(s) from ${searchData.checkIn} to ${searchData.checkOut}`);
  };

  const handleHotelsFound = (hotelResults: BookingOption[]) => {
    setHotels(hotelResults);
  };

  const handleBookNow = (option: BookingOption) => {
    alert(`Booking hotel: ${option.title}\nPrice: ₹${option.price}\nThis would normally proceed to the booking flow.`);
  };

  const handleRefineSearch = () => {
    setHotels([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hotel Search Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Experience realistic hotel search with curated demo data
          </p>
        </div>

        {/* Search Interface */}
        <HotelSearchInterface
          onSearch={handleSearch}
          onHotelsFound={handleHotelsFound}
        />

        {/* Search Results */}
        {hotels.length > 0 && (
          <div className="mt-8">
            <SearchResults
              searchResult={{
                id: 'hotel-search',
                query: searchQuery,
                results: hotels,
                totalFound: hotels.length,
                searchTime: 1500,
                filters: {}
              }}
              onBookNow={handleBookNow}
              onRefineSearch={handleRefineSearch}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              How to Test the Hotel Search Demo
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Test the Mock API</h3>
                <p>Click the &quot;Test Mock Hotel API&quot; button to verify the system is working correctly.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. Search by City</h3>
                <p>Enter one of our demo cities: <strong>New York, London, Paris, Tokyo, Dubai, Mumbai, or Goa</strong></p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">3. Search Near Me</h3>
                <p>Click the &quot;Near Me&quot; button to find hotels based on your location (simulated with demo data).</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">4. View Results</h3>
                <p>Browse curated hotel results with realistic data including ratings, prices, and amenities.</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ Demo Features Working
              </h3>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Realistic hotel data with ratings and reviews</li>
                <li>• Multiple hotel types (luxury, business, budget, boutique, resort)</li>
                <li>• Proper pricing in Indian Rupees</li>
                <li>• Amenities and location information</li>
                <li>• Responsive search with loading states</li>
                <li>• Error handling and user feedback</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🔄 Ready for Real API Integration
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This demo shows the complete hotel search workflow. When ready for production, 
                simply replace the mock data service with your preferred hotel booking API 
                (Google Hotels, Booking.com, Expedia, etc.).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
