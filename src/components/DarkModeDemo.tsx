'use client';

import { Moon, Sun } from 'lucide-react';

export default function DarkModeDemo() {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Sun className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Light</span>
        </div>
        <div className="text-gray-400">|</div>
        <div className="flex items-center space-x-2">
          <Moon className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Dark</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Use the theme toggle in the header →
      </p>
    </div>
  );
}
