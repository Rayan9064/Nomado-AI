import { MCPBookingIntent } from '@/types';

export class MCPProcessor {
  static parseNaturalLanguage(input: string): MCPBookingIntent {
    const intent: MCPBookingIntent = {
      type: 'booking_request',
      service: 'flight', // default
      parameters: {}
    };

    // Extract destination
    const destinationMatch = input.match(/to\s+([A-Za-z\s]+?)(?:\s|$|,|\.|under|in|for)/i);
    if (destinationMatch) {
      intent.parameters.destination = destinationMatch[1].trim();
    }

    // Extract budget
    const budgetMatch = input.match(/under\s*₹?(\d+)k?/i);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1]) * (budgetMatch[0].includes('k') ? 1000 : 1);
      intent.parameters.budget = {
        amount,
        currency: 'INR'
      };
    }

    // Extract dates/duration
    const durationMatch = input.match(/(\d+)[-\s]?day/i);
    if (durationMatch) {
      const days = parseInt(durationMatch[1]);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Default to next week
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);
      
      intent.parameters.dates = {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
    }

    // Extract month
    const monthMatch = input.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (monthMatch) {
      const month = monthMatch[1].toLowerCase();
      const monthIndex = new Date(Date.parse(month + " 1, 2024")).getMonth();
      const startDate = new Date(2024, monthIndex, 1);
      intent.parameters.dates = {
        start: startDate.toISOString().split('T')[0]
      };
    }

    // Determine service type
    if (input.toLowerCase().includes('hotel')) {
      intent.service = 'hotel';
    } else if (input.toLowerCase().includes('tour')) {
      intent.service = 'tour';
    } else if (input.toLowerCase().includes('activity')) {
      intent.service = 'activity';
    } else if (input.toLowerCase().includes('flight') || input.toLowerCase().includes('fly')) {
      intent.service = 'flight';
    } else if (input.toLowerCase().includes('trip')) {
      // Trip typically includes multiple services
      intent.service = 'tour';
    }

    return intent;
  }

  static formatMCPYAML(intent: MCPBookingIntent): string {
    return `
mcp_version: "1.0"
request_type: ${intent.type}
service: ${intent.service}
parameters:
  destination: "${intent.parameters.destination || 'Not specified'}"
  ${intent.parameters.origin ? `origin: "${intent.parameters.origin}"` : ''}
  ${intent.parameters.dates ? `dates:
    start: "${intent.parameters.dates.start}"
    ${intent.parameters.dates.end ? `end: "${intent.parameters.dates.end}"` : ''}` : ''}
  ${intent.parameters.budget ? `budget:
    amount: ${intent.parameters.budget.amount}
    currency: "${intent.parameters.budget.currency}"` : ''}
  ${intent.parameters.passengers ? `passengers: ${intent.parameters.passengers}` : ''}
  ${intent.parameters.rooms ? `rooms: ${intent.parameters.rooms}` : ''}
  ${intent.parameters.preferences ? `preferences: [${intent.parameters.preferences.map(p => `"${p}"`).join(', ')}]` : ''}
timestamp: "${new Date().toISOString()}"
    `.trim();
  }

  static generateBookingReference(): string {
    const prefix = 'MCP';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }
}

export default MCPProcessor;
