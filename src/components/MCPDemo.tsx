'use client';

import MCPProcessor from '@/utils/mcpProcessor';
import { CheckCircle, Code, Copy } from 'lucide-react';
import { useState } from 'react';

export default function MCPDemo() {
  const [input, setInput] = useState('Book a 3-day trip to Goa under ₹15k in September');
  const [mcpYaml, setMcpYaml] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMCP = () => {
    const intent = MCPProcessor.parseNaturalLanguage(input);
    const yaml = MCPProcessor.formatMCPYAML(intent);
    setMcpYaml(yaml);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mcpYaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Code className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">MCP YAML Generator</h2>
        </div>
        
        <div className="space-y-6">
          {/* Input Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Natural Language Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your booking request..."
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={generateMCP}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate MCP YAML
            </button>
          </div>

          {/* Output Section */}
          {mcpYaml && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generated MCP YAML
                </label>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {mcpYaml}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
