'use client';

import { CheckCircle, Globe, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

export default function FeatureShowcase() {
  const [currentDemo, setCurrentDemo] = useState('search');

  const features = [
    {
      id: 'search',
      title: 'Smart Search Interface',
      description: 'Natural language search with filters and trending destinations',
      icon: <Globe className="h-6 w-6" />,
      color: 'blue'
    },
    {
      id: 'ai',
      title: 'AI Assistant Chat',
      description: 'Conversational booking for complex travel planning',
      icon: <Sparkles className="h-6 w-6" />,
      color: 'purple'
    },
    {
      id: 'booking',
      title: 'Seamless Booking Flow',
      description: 'Search → Select → Review → Confirm with progress tracking',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'green'
    },
    {
      id: 'payment',
      title: 'Web3 Payment Integration',
      description: 'Crypto payments via Aya Wallet with Web2 bridge',
      icon: <Zap className="h-6 w-6" />,
      color: 'orange'
    }
  ];

  const demoSteps = {
    search: [
      'Use the search bar for natural language queries',
      'Apply filters for date, price, location, and amenities',
      'Browse trending destinations and quick actions',
      'View AI-powered search insights and recommendations'
    ],
    ai: [
      'Click the AI assistant button in the bottom right',
      'Chat naturally about complex travel requirements',
      'Get personalized recommendations and alternatives',
      'Book directly from chat suggestions'
    ],
    booking: [
      'Select from search results or AI recommendations',
      'Review booking details with guest information',
      'Choose payment method (crypto or traditional)',
      'Receive instant confirmation with receipts'
    ],
    payment: [
      'Connect Aya Wallet for crypto payments',
      'Automatic Web3 to Web2 conversion via P2P.me',
      'Real-time transaction tracking',
      'Secure blockchain-verified bookings'
    ]
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Booking Experience
        </h2>
        <p className="text-gray-600">
          Experience the full power of our AI-driven booking platform
        </p>
      </div>

      {/* Feature Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setCurrentDemo(feature.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentDemo === feature.id
                ? `bg-${feature.color}-100 text-${feature.color}-700 border-${feature.color}-200`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {feature.icon}
            <span>{feature.title}</span>
          </button>
        ))}
      </div>

      {/* Demo Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {features.find(f => f.id === currentDemo)?.title}
          </h3>
          <p className="text-gray-600">
            {features.find(f => f.id === currentDemo)?.description}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">How to use:</h4>
          <ul className="space-y-2">
            {demoSteps[currentDemo as keyof typeof demoSteps].map((step, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tech Stack Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Powered by:</h4>
        <div className="flex flex-wrap gap-2">
          {[
            'Next.js 15',
            'TypeScript',
            'Tailwind CSS',
            'Model Context Protocol',
            'Aya Wallet',
            'P2P.me Bridge'
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
