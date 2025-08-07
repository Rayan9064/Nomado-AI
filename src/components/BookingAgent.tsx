'use client';

import type { BookingOption, Message } from '@/types';
import { Bot, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Import components with explicit paths
import BookingCard from '@/components/BookingCard';
import ChatMessage from '@/components/ChatMessage';
import PaymentModal from '@/components/PaymentModal';

export default function BookingAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI booking assistant. I can help you find and book flights, hotels, tours, and activities using natural language. Just tell me what you're looking for! For example: 'Book a 3-day trip to Goa under ₹15k in September'",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingOption | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processBookingRequest = async (userMessage: string): Promise<BookingOption[]> => {
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to process booking request');
      }

      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('Error processing booking request:', error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const bookingOptions = await processBookingRequest(inputValue);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: bookingOptions.length > 0 
          ? `I found ${bookingOptions.length} great options for your request. Here are the details:`
          : "I understand your request, but let me search for more specific options. Could you provide more details about your destination, dates, or budget?",
        timestamp: new Date(),
        bookingOptions: bookingOptions.length > 0 ? bookingOptions : undefined,
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBookNow = (option: BookingOption) => {
    setSelectedBooking(option);
    setShowPayment(true);
  };

  const handlePaymentComplete = (transactionId: string) => {
    setShowPayment(false);
    
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `🎉 Booking confirmed! Your ${selectedBooking?.type} has been successfully booked. Transaction ID: ${transactionId}. You'll receive a confirmation email shortly.`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, confirmationMessage]);
    setSelectedBooking(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <ChatMessage message={message} />
              {message.bookingOptions && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {message.bookingOptions.map((option) => (
                    <BookingCard
                      key={option.id}
                      option={option}
                      onBookNow={handleBookNow}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Bot className="h-6 w-6 animate-pulse" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your booking request here... (e.g., 'Book a 3-day trip to Goa under ₹15k in September')"
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedBooking && (
        <PaymentModal
          booking={selectedBooking}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
