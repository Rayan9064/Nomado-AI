'use client';

import type { BookingOption } from '@/types';
import { Calendar, CreditCard, Hotel, MapPin, Plane, Star } from 'lucide-react';

interface BookingCardProps {
  option: BookingOption;
  onBookNow: (option: BookingOption) => void;
  viewMode?: 'grid' | 'list';
}

export default function BookingCard({ option, onBookNow, viewMode = 'grid' }: BookingCardProps) {
  const getIcon = () => {
    switch (option.type) {
      case 'flight':
        return <Plane className="h-5 w-5 text-blue-600" />;
      case 'hotel':
        return <Hotel className="h-5 w-5 text-green-600" />;
      case 'tour':
        return <MapPin className="h-5 w-5 text-purple-600" />;
      case 'activity':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatPrice = () => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: option.currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 0,
    }).format(option.price);
  };

  const renderDetails = () => {
    switch (option.type) {
      case 'flight':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{option.details.departure}</span>
              <span>→</span>
              <span>{option.details.arrival}</span>
            </div>
            <div className="flex justify-between">
              <span>{option.details.date}</span>
              <span>{option.details.duration}</span>
            </div>
            <div className="text-blue-600 font-medium">{option.details.airline}</div>
          </div>
        );
      case 'hotel':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{option.details.location}</span>
            </div>
            {option.details.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>{option.details.rating}/5</span>
              </div>
            )}
            {option.details.checkIn && (
              <div className="flex justify-between">
                <span>Check-in: {option.details.checkIn}</span>
                <span>Check-out: {option.details.checkOut}</span>
              </div>
            )}
            {option.details.amenities && (
              <div className="flex flex-wrap gap-1 mt-2">
                {option.details.amenities.slice(0, 3).map((amenity: string, index: number) => (
                  <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {amenity}
                  </span>
                ))}
                {option.details.amenities.length > 3 && (
                  <span className="text-gray-500 text-xs">+{option.details.amenities.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            {option.description}
          </div>
        );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="font-semibold text-gray-900">{option.title}</h3>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{formatPrice()}</div>
          <div className="text-sm text-gray-500">per person</div>
        </div>
      </div>

      {renderDetails()}

      <button
        onClick={() => onBookNow(option)}
        className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
      >
        <CreditCard className="h-4 w-4" />
        <span>Book Now with Aya Wallet</span>
      </button>
    </div>
  );
}
