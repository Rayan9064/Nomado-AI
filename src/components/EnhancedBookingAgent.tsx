'use client';

import type { BookingConfirmation as BookingConfirmationType, BookingFlow, BookingOption, Message, SearchResult } from '@/types';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Import all our new components
import BookingConfirmation from './BookingConfirmation';
import BookingReview from './BookingReview';
import ChatMessage from './ChatMessage';
import PaymentModal from './PaymentModal';
import SearchInterface from './SearchInterface';
import SearchResults from './SearchResults';

export default function EnhancedBookingAgent() {
  const [bookingFlow, setBookingFlow] = useState<BookingFlow>({ step: 'search' });
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationType | null>(null);

  // Chat-like fallback for complex queries
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI booking assistant powered by OpenAI. I can help you find hotels, answer questions about amenities, provide travel recommendations, and guide you through the booking process. Try asking me something like 'Find me a luxury hotel in New York' or 'What are the best budget hotels in Mumbai?'",
      timestamp: new Date(),
    }
  ]);
  const [chatVisible, setChatVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Search functionality
  const handleSearch = async (query: string, filters?: any) => {
    setIsLoading(true);
    setBookingFlow({ step: 'search', searchQuery: query });

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const result: SearchResult = {
        id: Date.now().toString(),
        query,
        results: data.bookings || [],
        totalFound: data.bookings?.length || 0,
        searchTime: 1500,
        filters
      };

      setSearchResult(result);
      setBookingFlow({ step: 'select', searchQuery: query });
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to chat for complex queries
      setChatVisible(true);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "I couldn't process that search directly. Let me help you through our chat interface. What exactly are you looking for?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (option: BookingOption) => {
    setBookingFlow({ 
      step: 'review', 
      selectedOption: option,
      searchQuery: `Quick search: ${option.title}`
    });
  };

  const handleBookNow = (option: BookingOption) => {
    setBookingFlow({ 
      step: 'review', 
      selectedOption: option,
      searchQuery: bookingFlow.searchQuery
    });
  };

  const handleProceedToPayment = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = (transactionId: string) => {
    setShowPayment(false);
    
    if (bookingFlow.selectedOption) {
      const confirmationData: BookingConfirmationType = {
        id: `BK-${Date.now()}`,
        transactionId,
        status: 'confirmed',
        details: bookingFlow.selectedOption,
        paymentDetails: {
          success: true,
          transactionId,
          method: 'crypto'
        },
        createdAt: new Date()
      };

      setConfirmation(confirmationData);
      setBookingFlow({ step: 'confirm', confirmation: confirmationData });
    }
  };

  const handleBackToSearch = () => {
    setBookingFlow({ step: 'search' });
    setSearchResult(null);
  };

  const handleNewSearch = () => {
    setBookingFlow({ step: 'search' });
    setSearchResult(null);
    setConfirmation(null);
  };

  // Chat functionality for complex queries
  const handleChatMessage = async () => {
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
      // Convert messages to OpenAI format
      const openAIMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: openAIMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponseContent = '';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  aiResponseContent += content;
                  // Update the bot message content in real-time
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessage.id 
                      ? { ...msg, content: aiResponseContent }
                      : msg
                  ));
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I encountered an error. Please try rephrasing your request or use the search interface above.",
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
      handleChatMessage();
    }
  };

  // Render based on current step
  const renderContent = () => {
    switch (bookingFlow.step) {
      case 'search':
      case 'select':
        return (
          <>
            <SearchInterface
              onSearch={handleSearch}
              onQuickSearch={handleQuickSearch}
              isLoading={isLoading}
            />
            
            {searchResult && bookingFlow.step === 'select' && (
              <SearchResults
                searchResult={searchResult}
                onBookNow={handleBookNow}
                onRefineSearch={() => setBookingFlow({ step: 'search' })}
              />
            )}
          </>
        );

      case 'review':
        return bookingFlow.selectedOption ? (
          <BookingReview
            booking={bookingFlow.selectedOption}
            onBack={handleBackToSearch}
            onProceedToPayment={handleProceedToPayment}
            onModifyBooking={handleBackToSearch}
          />
        ) : null;

      case 'confirm':
        return confirmation ? (
          <BookingConfirmation
            confirmation={confirmation}
            onNewSearch={handleNewSearch}
            onViewBookings={() => {}}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Indicator */}
      {bookingFlow.step !== 'search' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToSearch}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Search</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                ['search', 'select'].includes(bookingFlow.step) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  ['search', 'select'].includes(bookingFlow.step) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'
                }`}>1</div>
                <span className="text-sm font-medium">Search</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                bookingFlow.step === 'review' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  bookingFlow.step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'
                }`}>2</div>
                <span className="text-sm font-medium">Review</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                bookingFlow.step === 'confirm' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  bookingFlow.step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-600'
                }`}>3</div>
                <span className="text-sm font-medium">Confirm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* AI Chat Assistant Toggle */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setChatVisible(!chatVisible)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Bot className="h-6 w-6" />
        </button>
      </div>

      {/* AI Chat Interface */}
      {chatVisible && (
        <div className="fixed bottom-20 right-6 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">AI Assistant</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Powered by OpenAI
              </span>
            </div>
            <button
              onClick={() => setChatVisible(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
                {message.bookingOptions && (
                  <div className="mt-2 space-y-2">
                    {message.bookingOptions.map((option) => (
                      <div
                        key={option.id}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => handleBookNow(option)}
                      >
                        <h4 className="font-medium text-sm">{option.title}</h4>
                        <p className="text-xs text-gray-600">{option.description}</p>
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          ₹{option.price.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Bot className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about travel..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleChatMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && bookingFlow.selectedOption && (
        <PaymentModal
          booking={bookingFlow.selectedOption}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
