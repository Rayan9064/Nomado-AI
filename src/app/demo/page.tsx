import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MCPDemo from '@/components/MCPDemo';

export default function DemoPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            MCP Protocol Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how natural language booking requests are converted into structured MCP YAML format.
          </p>
        </div>
        <MCPDemo />
      </div>
      <Footer />
    </main>
  );
}
