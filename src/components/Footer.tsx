'use client';

import { Bot, Github, Shield, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">Nomado AI</span>
            </div>
            <p className="text-gray-400 text-sm">
              The future of travel booking with AI and Web3 payments.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Flight Booking</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hotel Reservations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tour Packages</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Activities</a></li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h3 className="font-semibold mb-4">Technology</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">AI Technology</a></li>
              <li><a href="#" className="hover:text-white transition-colors">MCP Protocol</a></li>
              <li><a href="#" className="hover:text-white transition-colors">WalletConnect</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Web3 Payments</a></li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h3 className="font-semibold mb-4">Security</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Secure Payments</span>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Nomado AI. All rights reserved. Powered by MCP and WalletConnect.</p>
        </div>
      </div>
    </footer>
  );
}
