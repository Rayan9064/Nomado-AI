'use client';

import { useHotelSearch } from '@/hooks/useHotelSearch';
import { AlertCircle, Calendar, CheckCircle, MapPin, Navigation, Search, Users } from 'lucide-react';
import React, { useState } from 'react';

interface HotelSearchInterfaceProps {
  onSearch: (searchData: SearchData) => void;
  onHotelsFound: (hotels: any[]) => void;
}

interface SearchData {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export function HotelSearchInterface({ onSearch, onHotelsFound }: HotelSearchInterfaceProps) {
  const [searchData, setSearchData] = useState<SearchData>({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const { hotels, isLoading, error, searchNearMe, searchByLocation, testAPI } = useHotelSearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.destination.trim()) {
      return;
    }

    // First trigger the traditional search callback
    onSearch(searchData);
    
    // Then search for real hotels using Google Maps
    await searchByLocation(searchData.destination);
  };

  const handleNearMeSearch = async () => {
    try {
      await searchNearMe();
    } catch (error) {
      console.error('Near me search failed:', error);
    }
  };

  const handleTestAPI = async () => {
    setApiStatus('testing');
    const result = await testAPI();
    setApiStatus(result.isValid ? 'valid' : 'invalid');
    
    if (!result.isValid) {
      console.error('Google Maps API test failed:', result.error);
    }
  };

  // Update parent component when hotels are found
  React.useEffect(() => {
    if (hotels.length > 0) {
      onHotelsFound(hotels);
    }
  }, [hotels, onHotelsFound]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Find Your Perfect Stay
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Search and book hotels worldwide with our AI-powered booking agent
        </p>
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            🎯 <strong>Demo Mode:</strong> Using curated hotel data for New York, London, Paris, Tokyo, Dubai, Mumbai, and Goa
          </p>
        </div>
      </div>

      {/* API Status Indicator */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={handleTestAPI}
          disabled={apiStatus === 'testing'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            apiStatus === 'valid'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : apiStatus === 'invalid'
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
          }`}
        >
          {apiStatus === 'testing' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {apiStatus === 'valid' && <CheckCircle className="w-4 h-4" />}
          {apiStatus === 'invalid' && <AlertCircle className="w-4 h-4" />}
          {apiStatus === 'idle' ? 'Test Mock Hotel API' :
           apiStatus === 'testing' ? 'Testing...' :
           apiStatus === 'valid' ? 'Mock API Ready' : 'API Error'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Destination
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-black dark:text-white"
              placeholder="Where do you want to stay?"
              value={searchData.destination}
              onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Check-in
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-black dark:text-white"
              value={searchData.checkIn}
              onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Check-out
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-black dark:text-white"
              value={searchData.checkOut}
              onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Guests
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-black dark:text-white"
              value={searchData.guests}
              onChange={(e) => setSearchData({ ...searchData, guests: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={isLoading || !searchData.destination.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isLoading ? 'Searching...' : 'Search Hotels'}
            </button>
            
            <button
              type="button"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              onClick={handleNearMeSearch}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              Near Me
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Search Error</span>
            </div>
            <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Results Summary */}
        {hotels.length > 0 && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Found {hotels.length} hotels</span>
            </div>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Real-time results from Google Maps. Scroll down to see the options.
            </p>
          </div>
        )}
      </form>

      {/* Quick Search Suggestions */}
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Available destinations in demo:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['New York', 'London', 'Paris', 'Tokyo', 'Dubai', 'Mumbai', 'Goa'].map((city) => (
            <button
              key={city}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
              onClick={() => setSearchData({ ...searchData, destination: city })}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
