'use client';

import type { BookingOption } from '@/types';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, MapPin, Shield, Star, Users } from 'lucide-react';
import { useState } from 'react';

interface BookingReviewProps {
  booking: BookingOption;
  onBack: () => void;
  onProceedToPayment: () => void;
  onModifyBooking: () => void;
}

export default function BookingReview({ booking, onBack, onProceedToPayment, onModifyBooking }: BookingReviewProps) {
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  const formatPrice = () => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: booking.currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 0,
    }).format(booking.price);
  };

  const calculateTotal = () => {
    const basePrice = booking.price;
    const taxes = basePrice * 0.18; // 18% GST
    const serviceFee = 99;
    return basePrice + taxes + serviceFee;
  };

  const isFormValid = () => {
    return guestDetails.firstName && 
           guestDetails.lastName && 
           guestDetails.email && 
           guestDetails.phone && 
           agreedToTerms;
  };

  const renderBookingDetails = () => {
    switch (booking.type) {
      case 'flight':
        return (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-medium">{booking.details.departure} → {booking.details.arrival}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{booking.details.date}</span>
            </div>
            {booking.details.returnDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Return:</span>
                <span className="font-medium">{booking.details.returnDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{booking.details.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Airline:</span>
              <span className="font-medium">{booking.details.airline}</span>
            </div>
          </div>
        );
      
      case 'hotel':
        return (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{booking.details.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">{booking.details.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">{booking.details.checkOut}</span>
            </div>
            {booking.details.rating && (
              <div className="flex justify-between">
                <span className="text-gray-600">Rating:</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{booking.details.rating}/5</span>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium capitalize">{booking.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{booking.description}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Search</span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-green-600">Step 2 of 3 - Review Booking</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
            
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  {booking.type === 'flight' && <Calendar className="h-6 w-6 text-blue-600" />}
                  {booking.type === 'hotel' && <MapPin className="h-6 w-6 text-blue-600" />}
                  {booking.type === 'tour' && <Users className="h-6 w-6 text-blue-600" />}
                  {booking.type === 'activity' && <Clock className="h-6 w-6 text-blue-600" />}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{booking.title}</h3>
                <p className="text-gray-600">{booking.description}</p>
              </div>
              <button
                onClick={onModifyBooking}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Modify
              </button>
            </div>

            {renderBookingDetails()}
          </div>

          {/* Guest Information */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Guest Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={guestDetails.firstName}
                  onChange={(e) => setGuestDetails(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={guestDetails.lastName}
                  onChange={(e) => setGuestDetails(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={guestDetails.email}
                  onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={guestDetails.phone}
                  onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests (Optional)
              </label>
              <textarea
                value={guestDetails.specialRequests}
                onChange={(e) => setGuestDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any special requests or notes..."
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I agree to the <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a> and 
                  <a href="#" className="text-blue-600 hover:text-blue-700"> Privacy Policy</a> *
                </span>
              </label>
              
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Subscribe to our newsletter for travel deals and updates
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar - Price Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price</span>
                <span className="font-medium">{formatPrice()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes & Fees</span>
                <span className="font-medium">₹{Math.round(booking.price * 0.18).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium">₹99</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{Math.round(calculateTotal()).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Secure Booking</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your payment is protected by blockchain technology
              </p>
            </div>

            <button
              onClick={onProceedToPayment}
              disabled={!isFormValid()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Proceed to Payment
            </button>

            {!isFormValid() && (
              <div className="mt-3 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Please fill in all required fields to continue
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
