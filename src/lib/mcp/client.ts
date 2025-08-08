// MCP Client for handling AI agent interactions in Nomado AI

import { mockMCPServer, type MCPRequest, type MCPResponse, type TravelQuery, type TravelRecommendation } from './server';

export interface AITravelAgent {
  processQuery(query: string): Promise<AgentResponse>;
  searchTravel(travelQuery: TravelQuery): Promise<TravelRecommendation[]>;
  createItinerary(destination: string, duration: number, preferences?: string[]): Promise<any>;
  getTravelAdvice(question: string, context?: any): Promise<string>;
}

export interface AgentResponse {
  type: 'search_results' | 'advice' | 'itinerary' | 'error';
  content: any;
  recommendations?: TravelRecommendation[];
  message?: string;
  confidence?: number;
}

export class NomadoMCPClient implements AITravelAgent {
  private server = mockMCPServer;

  async processQuery(query: string): Promise<AgentResponse> {
    try {
      console.log('🤖 AI Agent processing query:', query);
      
      // Simple intent classification
      const intent = this.classifyIntent(query);
      
      switch (intent.type) {
        case 'hotel_search':
          return await this.handleHotelSearch(query, intent.params);
        
        case 'flight_search':
          return await this.handleFlightSearch(query, intent.params);
        
        case 'tour_search':
          return await this.handleTourSearch(query, intent.params);
        
        case 'activity_search':
          return await this.handleActivitySearch(query, intent.params);
        
        case 'itinerary_request':
          return await this.handleItineraryRequest(query, intent.params);
        
        case 'travel_advice':
          return await this.handleTravelAdvice(query, intent.params);
        
        default:
          return await this.handleGeneralQuery(query);
      }
    } catch (error) {
      console.error('AI Agent error:', error);
      return {
        type: 'error',
        content: 'I encountered an error processing your request. Please try again.',
        message: 'Processing error'
      };
    }
  }

  async searchTravel(travelQuery: TravelQuery): Promise<TravelRecommendation[]> {
    const toolName = `search_${travelQuery.type}s`;
    
    const request: MCPRequest = {
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: travelQuery
      }
    };

    const response = await this.server.callTool(request);
    
    if (response.isError) {
      throw new Error('Search failed');
    }

    const result = JSON.parse(response.content[0].text);
    return result.results || [];
  }

  async createItinerary(destination: string, duration: number, preferences: string[] = []): Promise<any> {
    const request: MCPRequest = {
      method: 'tools/call',
      params: {
        name: 'create_itinerary',
        arguments: {
          destination,
          duration,
          interests: preferences
        }
      }
    };

    const response = await this.server.callTool(request);
    const result = JSON.parse(response.content[0].text);
    return result.itinerary;
  }

  async getTravelAdvice(question: string, context: any = {}): Promise<string> {
    const request: MCPRequest = {
      method: 'tools/call',
      params: {
        name: 'get_travel_advice',
        arguments: {
          query: question,
          ...context
        }
      }
    };

    const response = await this.server.callTool(request);
    const result = JSON.parse(response.content[0].text);
    return result.advice;
  }

  private classifyIntent(query: string): { type: string; params: any } {
    const lowerQuery = query.toLowerCase();
    
    // Hotel search patterns
    if (lowerQuery.includes('hotel') || lowerQuery.includes('stay') || lowerQuery.includes('accommodation')) {
      return {
        type: 'hotel_search',
        params: this.extractLocationAndDates(query)
      };
    }
    
    // Flight search patterns
    if (lowerQuery.includes('flight') || lowerQuery.includes('fly') || lowerQuery.includes('airplane')) {
      return {
        type: 'flight_search',
        params: this.extractFlightParams(query)
      };
    }
    
    // Tour search patterns
    if (lowerQuery.includes('tour') || lowerQuery.includes('guide') || lowerQuery.includes('sightseeing')) {
      return {
        type: 'tour_search',
        params: this.extractLocationAndDates(query)
      };
    }
    
    // Activity search patterns
    if (lowerQuery.includes('activity') || lowerQuery.includes('adventure') || lowerQuery.includes('experience')) {
      return {
        type: 'activity_search',
        params: this.extractLocationAndDates(query)
      };
    }
    
    // Itinerary patterns
    if (lowerQuery.includes('itinerary') || lowerQuery.includes('plan') || lowerQuery.includes('trip')) {
      return {
        type: 'itinerary_request',
        params: this.extractItineraryParams(query)
      };
    }
    
    // Travel advice patterns
    if (lowerQuery.includes('advice') || lowerQuery.includes('recommend') || lowerQuery.includes('suggest')) {
      return {
        type: 'travel_advice',
        params: { query }
      };
    }
    
    // Default to general query
    return {
      type: 'general',
      params: { query }
    };
  }

  private extractLocationAndDates(query: string): any {
    // Simple regex patterns for common locations and dates
    const locationMatch = query.match(/in\s+([A-Za-z\s]+?)(?:\s+for|\s+from|\s*$)/i);
    const budgetMatch = query.match(/under\s*\$?(\d+)/i);
    const durationMatch = query.match(/(\d+)\s*(night|day)s?/i);
    
    return {
      destination: locationMatch ? locationMatch[1].trim() : 'Popular Destination',
      budget: budgetMatch ? parseInt(budgetMatch[1]) : undefined,
      duration: durationMatch ? parseInt(durationMatch[1]) : undefined
    };
  }

  private extractFlightParams(query: string): any {
    // Extract origin and destination for flights
    const fromToMatch = query.match(/from\s+([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s|$)/i);
    
    if (fromToMatch) {
      return {
        origin: fromToMatch[1].trim(),
        destination: fromToMatch[2].trim()
      };
    }
    
    return {
      origin: 'Current Location',
      destination: 'Popular Destination'
    };
  }

  private extractItineraryParams(query: string): any {
    const locationMatch = query.match(/(?:for|to|in)\s+([A-Za-z\s]+?)(?:\s+for|\s*$)/i);
    const durationMatch = query.match(/(\d+)\s*(day|night)s?/i);
    
    return {
      destination: locationMatch ? locationMatch[1].trim() : 'Popular Destination',
      duration: durationMatch ? parseInt(durationMatch[1]) : 3
    };
  }

  private async handleHotelSearch(query: string, params: any): Promise<AgentResponse> {
    const searchParams = {
      type: 'hotel' as const,
      destination: params.destination,
      budget: params.budget,
      ...params
    };

    const results = await this.searchTravel(searchParams);
    
    return {
      type: 'search_results',
      content: `Found ${results.length} hotels in ${params.destination}`,
      recommendations: results,
      message: `I found some great hotel options in ${params.destination}. Here are my top recommendations:`,
      confidence: 0.9
    };
  }

  private async handleFlightSearch(query: string, params: any): Promise<AgentResponse> {
    const searchParams = {
      type: 'flight' as const,
      ...params
    };

    const results = await this.searchTravel(searchParams);
    
    return {
      type: 'search_results',
      content: `Found ${results.length} flights from ${params.origin} to ${params.destination}`,
      recommendations: results,
      message: `Here are the best flight options I found:`,
      confidence: 0.85
    };
  }

  private async handleTourSearch(query: string, params: any): Promise<AgentResponse> {
    const searchParams = {
      type: 'tour' as const,
      destination: params.destination,
      ...params
    };

    const results = await this.searchTravel(searchParams);
    
    return {
      type: 'search_results',
      content: `Found ${results.length} tours in ${params.destination}`,
      recommendations: results,
      message: `I discovered some amazing tours for you:`,
      confidence: 0.88
    };
  }

  private async handleActivitySearch(query: string, params: any): Promise<AgentResponse> {
    const searchParams = {
      type: 'activity' as const,
      destination: params.destination,
      ...params
    };

    const results = await this.searchTravel(searchParams);
    
    return {
      type: 'search_results',
      content: `Found ${results.length} activities in ${params.destination}`,
      recommendations: results,
      message: `Check out these exciting activities:`,
      confidence: 0.87
    };
  }

  private async handleItineraryRequest(query: string, params: any): Promise<AgentResponse> {
    const itinerary = await this.createItinerary(params.destination, params.duration);
    
    return {
      type: 'itinerary',
      content: itinerary,
      message: `I've created a ${params.duration}-day itinerary for ${params.destination}:`,
      confidence: 0.92
    };
  }

  private async handleTravelAdvice(query: string, params: any): Promise<AgentResponse> {
    const advice = await this.getTravelAdvice(params.query);
    
    return {
      type: 'advice',
      content: advice,
      message: 'Here\'s my travel advice:',
      confidence: 0.8
    };
  }

  private async handleGeneralQuery(query: string): Promise<AgentResponse> {
    // For general queries, try to provide helpful travel information
    const advice = await this.getTravelAdvice(query);
    
    return {
      type: 'advice',
      content: advice,
      message: 'I can help you with travel planning. Try asking about hotels, flights, tours, or activities!',
      confidence: 0.6
    };
  }
}

// Export singleton instance
export const aiTravelAgent = new NomadoMCPClient();
