'use client';

import type { BookingOption, SearchFilters } from '@/types';
import { ArrowRight, Calendar, DollarSign, Filter, MapPin, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface SearchInterfaceProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onQuickSearch: (option: BookingOption) => void;
  isLoading?: boolean;
}

export default function SearchInterface({ onSearch, onQuickSearch, isLoading = false }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const quickSearchOptions = [
    {
      id: 'quick-1',
      type: 'flight' as const,
      title: '✈️ Weekend Getaway',
      description: 'Quick flights for 2-3 days',
      price: 8000,
      currency: 'INR',
      details: { category: 'quick', duration: 'weekend' }
    },
    {
      id: 'quick-2', 
      type: 'hotel' as const,
      title: '🏨 Luxury Hotels',
      description: 'Premium stays in major cities',
      price: 15000,
      currency: 'INR',
      details: { category: 'quick', type: 'luxury' }
    },
    {
      id: 'quick-3',
      type: 'tour' as const,
      title: '🗺️ Adventure Tours',
      description: 'Exciting outdoor experiences',
      price: 12000,
      currency: 'INR',
      details: { category: 'quick', type: 'adventure' }
    }
  ];

  const trendingDestinations = [
    'New York', 'London', 'Paris', 'Tokyo', 'Dubai', 'Mumbai', 'Goa', 'Singapore'
  ];

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query, Object.keys(filters).length > 0 ? filters : undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Main Search Bar */}
      <div className="relative mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Where would you like to go? (e.g., 'Book a 3-day trip to Goa under ₹15k')"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 transition-colors"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Budget (₹)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-600 text-sm"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: { 
                      ...prev.priceRange, 
                      min: e.target.value ? parseInt(e.target.value) : undefined 
                    }
                  }))}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-600 text-sm"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: { 
                      ...prev.priceRange, 
                      max: e.target.value ? parseInt(e.target.value) : undefined 
                    }
                  }))}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Destination
              </label>
              <input
                type="text"
                placeholder="City or Country"
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Travel Dates
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { 
                      ...prev.dateRange, 
                      start: e.target.value || undefined 
                    }
                  }))}
                />
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { 
                      ...prev.dateRange, 
                      end: e.target.value || undefined 
                    }
                  }))}
                />
              </div>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Sparkles className="inline h-4 w-4 mr-1" />
                Service Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  type: e.target.value ? [e.target.value] : undefined 
                }))}
              >
                <option value="">All Services</option>
                <option value="flight">Flights</option>
                <option value="hotel">Hotels</option>
                <option value="tour">Tours</option>
                <option value="activity">Activities</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickSearchOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onQuickSearch(option)}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-700 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {option.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{option.description}</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                    From ₹{option.price.toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Destinations */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Trending Destinations</h3>
        <div className="flex flex-wrap gap-2">
          {trendingDestinations.map((destination) => (
            <button
              key={destination}
              onClick={() => setQuery(`Trip to ${destination}`)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
            >
              {destination}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
