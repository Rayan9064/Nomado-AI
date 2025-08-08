'use client';

import { useState } from 'react';
import { aiTravelAgent } from '@/lib/mcp/client';
import { mockMCPServer } from '@/lib/mcp/server';
import { Bot, Sparkles, Clock, CheckCircle, XCircle, Play, MessageSquare } from 'lucide-react';

interface TestResult {
  id: string;
  test: string;
  status: 'running' | 'success' | 'error';
  result?: any;
  duration?: number;
  error?: string;
}

export default function MCPDemo() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customQuery, setCustomQuery] = useState('Find me hotels in Goa under $100');
  const [customResult, setCustomResult] = useState<any>(null);
  const [isCustomRunning, setIsCustomRunning] = useState(false);

  const runCustomQuery = async () => {
    setIsCustomRunning(true);
    setCustomResult(null);
    
    try {
      const result = await aiTravelAgent.processQuery(customQuery);
      setCustomResult(result);
    } catch (error) {
      setCustomResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsCustomRunning(false);
    }
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const testId = Date.now().toString();
    const startTime = Date.now();
    
    setTests(prev => [...prev, {
      id: testId,
      test: testName,
      status: 'running'
    }]);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'success', result, duration }
          : test
      ));
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', error: error instanceof Error ? error.message : 'Unknown error', duration }
          : test
      ));
      
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      // Test 1: MCP Server Tool Listing
      await runTest('List Available MCP Tools', async () => {
        return await mockMCPServer.listTools();
      });

      // Test 2: Hotel Search
      await runTest('Search Hotels in Goa', async () => {
        return await aiTravelAgent.processQuery("Find me hotels in Goa under $100");
      });

      // Test 3: Flight Search
      await runTest('Search Flights Mumbai to Delhi', async () => {
        return await aiTravelAgent.processQuery("Find flights from Mumbai to Delhi");
      });

      // Test 4: Tour Search
      await runTest('Search Cultural Tours in Rajasthan', async () => {
        return await aiTravelAgent.processQuery("Find cultural tours in Rajasthan");
      });

      // Test 5: Itinerary Creation
      await runTest('Create Tokyo Itinerary', async () => {
        return await aiTravelAgent.processQuery("Create a 5-day itinerary for Tokyo");
      });

      // Test 6: Travel Advice
      await runTest('Get Travel Advice for Bali', async () => {
        return await aiTravelAgent.processQuery("What's the best time to visit Bali?");
      });

      console.log('✅ All MCP tests completed successfully!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatResult = (result: any) => {
    if (!result) return 'No result';
    
    if (result.recommendations) {
      return `Found ${result.recommendations.length} recommendations`;
    }
    
    if (result.content) {
      return typeof result.content === 'string' 
        ? result.content.substring(0, 100) + '...'
        : 'Complex response received';
    }
    
    if (Array.isArray(result)) {
      return `${result.length} tools available`;
    }
    
    return 'Response received';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">MCP Integration Demo</h2>
              <p className="text-sm sm:text-base text-purple-100">Test Model Context Protocol AI Agent functionality</p>
            </div>
          </div>
        </div>

        {/* Custom Query Section */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Try Custom Query</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Ask the AI agent anything about travel..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={runCustomQuery}
              disabled={isCustomRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              {isCustomRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>
          
          {customResult && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {customResult.error ? (
                <p className="text-red-600 dark:text-red-400">{customResult.error}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Agent Response</span>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {customResult.content && (
                      <p className="mb-2">{customResult.content}</p>
                    )}
                    {customResult.recommendations && (
                      <p className="text-blue-600 dark:text-blue-400">
                        Found {customResult.recommendations.length} recommendations
                      </p>
                    )}
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">View Full Response</summary>
                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(customResult, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Demo Controls */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comprehensive AI Agent Tests</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Run comprehensive tests to verify MCP integration and AI agent responses
              </p>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="p-4 sm:p-6">
          {tests.length === 0 && !isRunning ? (
            <div className="text-center py-8 sm:py-12">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Ready to Test MCP Integration
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">
                Click "Run All Tests" to see the AI agent in action
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getStatusIcon(test.status)}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {test.test}
                        </h4>
                        {test.status === 'success' && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {formatResult(test.result)}
                          </p>
                        )}
                        {test.status === 'error' && (
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 truncate">
                            Error: {test.error}
                          </p>
                        )}
                      </div>
                    </div>
                    {test.duration && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {test.duration}ms
                      </span>
                    )}
                  </div>
                  
                  {test.status === 'success' && test.result && (
                    <details className="mt-3">
                      <summary className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300">
                        View Response Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 sm:p-3 rounded overflow-x-auto">
                        {JSON.stringify(test.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Footer */}
        {tests.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {tests.filter(t => t.status === 'success').length} passed, {tests.filter(t => t.status === 'error').length} failed, {tests.filter(t => t.status === 'running').length} running
              </span>
              <span className="text-gray-500 dark:text-gray-500">
                MCP Server: Active • AI Agent: Ready
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
