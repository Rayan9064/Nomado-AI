'use client';

import EnhancedBookingAgent from '@/components/EnhancedBookingAgent';
import Footer from '@/components/Footer';
import GradientText from '@/components/GradientText';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <GradientText>
                Unified AI Booking Agent
              </GradientText>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Book flights, hotels, tours, and activities using natural language.
              Pay seamlessly with crypto through Aya Wallet.
            </p>
          </div>

          <EnhancedBookingAgent />
        </div>
      </div>
      <Footer />
    </main>
  );
}
