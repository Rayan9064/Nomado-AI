'use client';

import type { BookingOption, SearchResult } from '@/types';
import { ArrowUpDown, Clock, Filter, Grid, List, MapPin } from 'lucide-react';
import { useState } from 'react';
import BookingCard from './BookingCard';

interface SearchResultsProps {
  searchResult: SearchResult;
  onBookNow: (option: BookingOption) => void;
  onRefineSearch: (filters: any) => void;
}

export default function SearchResults({ searchResult, onBookNow, onRefineSearch }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'popularity'>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const sortOptions = searchResult.results.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'popularity':
        return (b.popularity || 0) - (a.popularity || 0);
      default:
        return 0;
    }
  });

  const filteredResults = sortOptions.filter(option => {
    if (priceFilter === 'all') return true;
    if (priceFilter === 'low') return option.price < 10000;
    if (priceFilter === 'medium') return option.price >= 10000 && option.price < 25000;
    if (priceFilter === 'high') return option.price >= 25000;
    return true;
  });

  const formatSearchTime = (time: number) => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchResult.query}"
              </h2>
              <p className="text-sm text-gray-600 flex items-center space-x-2">
                <span>{filteredResults.length} of {searchResult.totalFound} results</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>Found in {formatSearchTime(searchResult.searchTime)}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Sort By */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
              >
                <option value="popularity">Popularity</option>
                <option value="price">Price (Low to High)</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Price:</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
              >
                <option value="all">All Prices</option>
                <option value="low">Under ₹10k</option>
                <option value="medium">₹10k - ₹25k</option>
                <option value="high">Above ₹25k</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => onRefineSearch({})}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Refine Search
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">AI Insights</h3>
            <p className="text-sm text-gray-700">
              Based on your search, I found great options across different price ranges. 
              {filteredResults.some(r => r.type === 'flight') && ' Flight prices are currently 15% lower than average for this route.'}
              {filteredResults.some(r => r.type === 'hotel') && ' Hotels show high availability with competitive rates.'}
              {' '}Consider booking soon for the best deals!
            </p>
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }>
        {filteredResults.map((option) => (
          <div key={option.id} className={viewMode === 'list' ? 'max-w-none' : ''}>
            <BookingCard
              option={option}
              onBookNow={onBookNow}
              viewMode={viewMode}
            />
          </div>
        ))}
      </div>

      {/* Load More */}
      {searchResult.totalFound > filteredResults.length && (
        <div className="text-center">
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Load More Results ({searchResult.totalFound - filteredResults.length} remaining)
          </button>
        </div>
      )}

      {/* No Results */}
      {filteredResults.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search with different terms.
          </p>
          <button
            onClick={() => onRefineSearch({})}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Modify Search
          </button>
        </div>
      )}
    </div>
  );
}
