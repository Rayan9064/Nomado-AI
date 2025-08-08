'use client';

import type { BookingConfirmation } from '@/types';
import { CheckCircle, Download, Mail, Phone, Printer, Share2, Star } from 'lucide-react';
import { useState } from 'react';

interface BookingConfirmationProps {
  confirmation: BookingConfirmation;
  onNewSearch: () => void;
  onViewBookings: () => void;
}

export default function BookingConfirmation({ confirmation, onNewSearch, onViewBookings }: BookingConfirmationProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const formatPrice = () => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: confirmation.details.currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 0,
    }).format(confirmation.details.price);
  };

  const downloadReceipt = () => {
    // Mock download functionality
    const receiptData = {
      bookingId: confirmation.id,
      transactionId: confirmation.transactionId,
      details: confirmation.details,
      paymentDetails: confirmation.paymentDetails,
      createdAt: confirmation.createdAt
    };
    
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-receipt-${confirmation.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Booking Confirmation',
        text: `I've booked ${confirmation.details.title} - Booking ID: ${confirmation.id}`,
        url: window.location.href
      });
    } else {
      setShowShareModal(true);
    }
  };

  const renderBookingDetails = () => {
    const { details } = confirmation;
    
    switch (details.type) {
      case 'flight':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Flight Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span>{details.details.departure} → {details.details.arrival}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{details.details.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Airline:</span>
                  <span>{details.details.airline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>{details.details.duration}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Important Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Check-in opens 2 hours before departure</p>
                <p>• Carry valid government ID</p>
                <p>• Baggage allowance: 15kg checked, 7kg cabin</p>
                <p>• Web check-in available 48 hours prior</p>
              </div>
            </div>
          </div>
        );
      
      case 'hotel':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Hotel Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span>{details.details.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span>{details.details.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span>{details.details.checkOut}</span>
                </div>
                {details.details.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{details.details.rating}/5</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Amenities & Policies</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {details.details.amenities && details.details.amenities.slice(0, 4).map((amenity: string, index: number) => (
                  <p key={index}>• {amenity}</p>
                ))}
                <p>• Free cancellation up to 24 hours</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Service Details</h4>
            <p className="text-sm text-gray-600">{details.description}</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-lg text-gray-600 mb-4">
          Your {confirmation.details.type} has been successfully booked
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-green-800">
            <strong>Booking ID:</strong> {confirmation.id}
          </p>
          <p className="text-sm text-green-800">
            <strong>Transaction ID:</strong> {confirmation.transactionId}
          </p>
        </div>
      </div>

      {/* Booking Details Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{confirmation.details.title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadReceipt}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Download</span>
            </button>
            <button
              onClick={shareBooking}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="text-sm">Print</span>
            </button>
          </div>
        </div>

        {renderBookingDetails()}
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">{formatPrice()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="capitalize">{confirmation.paymentDetails.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-xs">{confirmation.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">✓ Confirmed</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Security & Support</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Blockchain verified transaction</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>Confirmation sent to email</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-purple-500" />
                <span>24/7 support available</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">What&apos;s Next?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>✓ Confirmation email sent to your registered email address</p>
          <p>✓ Add booking details to your calendar</p>
          <p>✓ Check-in instructions will be sent 24 hours before your {confirmation.details.type}</p>
          <p>✓ Contact support if you need to make any changes</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onNewSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Book Another Trip
        </button>
        <button
          onClick={onViewBookings}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          View All Bookings
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Booking</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Booking ID: ${confirmation.id}`);
                  setShowShareModal(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
              >
                Copy Booking ID
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareModal(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
              >
                Copy Link
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
