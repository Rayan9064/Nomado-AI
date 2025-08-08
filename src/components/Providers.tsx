'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import Web3Provider from './Web3Provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Web3Provider>
        {children}
      </Web3Provider>
    </ThemeProvider>
  );
}
