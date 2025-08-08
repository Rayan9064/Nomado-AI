import MCPDemo from '@/components/MCPDemo';

export default function MCPDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            MCP Integration Testing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Test the Model Context Protocol integration with our AI travel agent. 
            Try custom queries or run comprehensive tests to see the system in action.
          </p>
        </div>
        <MCPDemo />
      </div>
    </div>
  );
}
