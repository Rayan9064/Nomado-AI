'use client';

import type { BookingOption } from '@/types';
import {
    convertMockHotelToBookingOption,
    searchHotelsByLocation,
    searchHotelsNearLocation
} from '@/utils/mockHotels';
import { useCallback, useState } from 'react';

interface UseHotelSearchResult {
  hotels: BookingOption[];
  isLoading: boolean;
  error: string | null;
  searchNearMe: () => Promise<void>;
  searchByLocation: (location: string) => Promise<void>;
  testAPI: () => Promise<{ isValid: boolean; error?: string }>;
  currentLocation: { lat: number; lng: number } | null;
}

export function useHotelSearch(): UseHotelSearchResult {
  const [hotels, setHotels] = useState<BookingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const testAPI = useCallback(async () => {
    // Mock API test - always returns success for demo
    return { isValid: true };
  }, []);

  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get current location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  const searchNearMe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Search hotels near current location using mock data
      const mockHotels = searchHotelsNearLocation(location.lat, location.lng, 5, 20);
      const bookingOptions = mockHotels.map(convertMockHotelToBookingOption);
      
      setHotels(bookingOptions);
      
      if (bookingOptions.length === 0) {
        setError('No hotels found near your location. Try searching by city name.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // If location fails, provide some fallback hotels
      if (errorMessage.includes('Location') || errorMessage.includes('denied')) {
        setError('Location access denied. Please enable location services or search by city name.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentLocation]);

  const searchByLocation = useCallback(async (locationQuery: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Search hotels using mock data
      const mockHotels = searchHotelsByLocation(locationQuery, 20);
      const bookingOptions = mockHotels.map(convertMockHotelToBookingOption);
      
      setHotels(bookingOptions);
      
      if (bookingOptions.length === 0) {
        setError(`No hotels found for "${locationQuery}". Try searching for major cities like New York, London, Paris, Mumbai, or Goa.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to search hotels for "${locationQuery}": ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    hotels,
    isLoading,
    error,
    searchNearMe,
    searchByLocation,
    testAPI,
    currentLocation,
  };
}
