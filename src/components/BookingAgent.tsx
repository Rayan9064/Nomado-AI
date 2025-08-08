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

  const processBookingRequest = async (userMessage: string): Promise<{
    bookings: BookingOption[];
    agentMessage?: string;
    agentResponse?: any;
    type?: string;
    mcpProcessed?: boolean;
  }> => {
    try {
      console.log('🤖 Sending request to MCP AI Agent...');
      
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
      
      console.log('🎯 MCP Response:', data);
      
      return {
        bookings: data.bookings || [],
        agentMessage: data.agentMessage,
        agentResponse: data.agentResponse,
        type: data.type,
        mcpProcessed: data.mcpProcessed
      };
    } catch (error) {
      console.error('Error processing booking request:', error);
      return {
        bookings: [],
        agentMessage: 'Sorry, I encountered an error processing your request. Please try again.',
        type: 'error'
      };
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
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await processBookingRequest(currentInput);
      
      // Create bot response based on MCP result
      let botContent = '';
      
      if (result.mcpProcessed) {
        // MCP processed the request
        if (result.type === 'advice') {
          botContent = `${result.agentMessage}\n\n${result.agentResponse}`;
        } else if (result.type === 'itinerary') {
          botContent = `${result.agentMessage}\n\n${formatItineraryResponse(result.agentResponse)}`;
        } else if (result.bookings && result.bookings.length > 0) {
          botContent = result.agentMessage || `I found ${result.bookings.length} great options for your request. Here are the details:`;
        } else {
          botContent = result.agentMessage || "I understand your request, but let me search for more specific options. Could you provide more details?";
        }
      } else {
        // Fallback response
        botContent = result.bookings && result.bookings.length > 0 
          ? `I found ${result.bookings.length} options for your request. Here are the details:`
          : "I understand your request, but let me search for more specific options. Could you provide more details about your destination, dates, or budget?";
      }
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botContent,
        timestamp: new Date(),
        bookings: result.bookings || undefined,
        mcpProcessed: result.mcpProcessed
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatItineraryResponse = (itinerary: any): string => {
    if (!itinerary || !itinerary.dailyPlan) return 'Could not generate itinerary.';
    
    let formatted = `**${itinerary.destination} - ${itinerary.duration}**\n\n`;
    
    itinerary.dailyPlan.forEach((day: any) => {
      formatted += `**${day.title}**\n`;
      day.activities.forEach((activity: string) => {
        formatted += `• ${activity}\n`;
      });
      formatted += `*Estimated cost: $${day.estimatedCost}*\n\n`;
    });
    
    formatted += `**Total estimated cost: $${itinerary.totalEstimatedCost}**`;
    
    return formatted;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Chat Interface */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Nomado AI Assistant</h3>
              <p className="text-blue-100 text-sm">Powered by MCP AI Agents</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-80 sm:h-96 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-800">
          {messages.map((message) => (
            <div key={message.id}>
              <ChatMessage message={message} />
              {(message.bookings || message.bookingOptions) && (
                <div className="mt-4 grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                  {(message.bookings || message.bookingOptions || []).map((option) => (
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
            <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 py-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">AI is processing your request...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-900">
          <div className="flex space-x-2 sm:space-x-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about travel... Try: 'Find hotels in Goa under $100' or 'Plan a 5-day Tokyo itinerary'"
              className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 dark:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInputValue("Find me hotels in Goa under $100")}
              className="text-xs sm:text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              🏨 Hotels in Goa
            </button>
            <button
              onClick={() => setInputValue("Create a 5-day Tokyo itinerary")}
              className="text-xs sm:text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              📋 Tokyo Itinerary
            </button>
            <button
              onClick={() => setInputValue("What's the best time to visit Bali?")}
              className="text-xs sm:text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              💡 Travel Advice
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
