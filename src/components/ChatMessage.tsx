'use client';

import type { Message } from '@/types';
import { Bot, User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex max-w-[85%] sm:max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isBot ? 'mr-2 sm:mr-3' : 'ml-2 sm:ml-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isBot ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isBot ? <Bot className="w-4 h-4 sm:w-5 sm:h-5" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
          isBot 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' 
            : 'bg-blue-600 dark:bg-blue-700 text-white'
        }`}>
          {/* MCP Processing Indicator */}
          {isBot && message.mcpProcessed && (
            <div className="flex items-center space-x-1 mb-2 text-xs opacity-75">
              <Sparkles className="w-3 h-3" />
              <span>AI Agent Processed</span>
              {message.confidence && (
                <span className="text-xs">
                  • {Math.round(message.confidence * 100)}% confidence
                </span>
              )}
            </div>
          )}
          
          <div className="text-sm whitespace-pre-wrap break-words">
            {formatMessageContent(message.content)}
          </div>
          
          <p className={`text-xs mt-1 ${
            isBot ? 'text-gray-500 dark:text-gray-400' : 'text-blue-100'
          }`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to format message content with basic markdown support
function formatMessageContent(content: string): JSX.Element {
  // Split by line breaks and process each line
  const lines = content.split('\n');
  
  return (
    <div>
      {lines.map((line, index) => {
        // Handle bold text **text**
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <div key={index} className={index > 0 ? 'mt-1' : ''}>
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? 
                  <strong key={partIndex}>{part}</strong> : 
                  <span key={partIndex}>{part}</span>
              )}
            </div>
          );
        }
        
        // Handle bullet points
        if (line.startsWith('• ')) {
          return (
            <div key={index} className="ml-2 mt-1">
              {line}
            </div>
          );
        }
        
        // Handle italic text *text*
        if (line.includes('*') && !line.includes('**')) {
          const parts = line.split('*');
          return (
            <div key={index} className={index > 0 ? 'mt-1' : ''}>
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? 
                  <em key={partIndex}>{part}</em> : 
                  <span key={partIndex}>{part}</span>
              )}
            </div>
          );
        }
        
        // Regular line
        return (
          <div key={index} className={index > 0 ? 'mt-1' : ''}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
