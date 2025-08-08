'use client';

import { useEffect, useState } from 'react';
import { useWeb3, getChainInfo } from './Web3Provider';
import { Calendar, CheckCircle, Clock, CreditCard, ExternalLink, MapPin, X, XCircle } from 'lucide-react';

interface BookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserBooking {
  id: number;
  customer: string;
  type: string;
  details: any;
  amount: string;
  amountUSD: string;
  token: string;
  status: string;
  statusCode: number;
  createdAt: Date;
  checkInDate: Date;
  checkOutDate: Date;
  metadataURI: string;
}

export default function BookingHistoryModal({ isOpen, onClose }: BookingHistoryModalProps) {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const { isConnected, address, chainId, getUserBookings, cancelBooking, checkInToBooking } = useWeb3();

  useEffect(() => {
    if (isOpen && isConnected) {
      loadBookings();
    }
  }, [isOpen, isConnected]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const userBookings = await getUserBookings();
      setBookings(userBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      setIsLoading(true);
      await cancelBooking(bookingId);
      // Reload bookings to show updated status
      await loadBookings();
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    try {
      setIsLoading(true);
      await checkInToBooking(bookingId);
      // Reload bookings to show updated status
      await loadBookings();
      alert('Check-in successful!');
    } catch (error) {
      console.error('Failed to check in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'CheckedIn':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'CheckedIn':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelBooking = (booking: UserBooking) => {
    return booking.status === 'Pending' || booking.status === 'Confirmed';
  };

  const canCheckIn = (booking: UserBooking) => {
    const now = new Date();
    return booking.status === 'Confirmed' && 
           now >= booking.checkInDate && 
           now <= booking.checkOutDate;
  };

  const chainInfo = chainId ? getChainInfo(chainId) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">My Bookings</h2>
            <p className="text-sm text-gray-500">
              On {chainInfo?.name || 'Ethereum'} • {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!isConnected ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Please connect your wallet to view bookings.</p>
            </div>
          ) : isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-y-auto p-6">
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{booking.details.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{booking.details.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium">{booking.amount} {chainInfo?.symbol || 'ETH'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Booking ID</p>
                            <p className="font-medium">#{booking.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Check-in</p>
                            <p className="font-medium">{booking.checkInDate.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Check-out</p>
                            <p className="font-medium">{booking.checkOutDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {booking.details.location && (
                          <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.details.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusIcon(booking.status)}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex space-x-2">
                        {canCheckIn(booking) && (
                          <button
                            onClick={() => handleCheckIn(booking.id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                          >
                            Check In
                          </button>
                        )}
                        
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Created: {booking.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
