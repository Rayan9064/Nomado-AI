// Model Context Protocol (MCP) Integration for Nomado AI
// This module handles AI agent interactions and travel recommendations

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPRequest {
  method: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export interface TravelQuery {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  budget?: number;
  preferences?: string[];
  type: 'hotel' | 'flight' | 'tour' | 'activity';
}

export interface TravelRecommendation {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  rating: number;
  location: string;
  images: string[];
  amenities?: string[];
  availability: boolean;
  type: 'hotel' | 'flight' | 'tour' | 'activity';
  details: Record<string, any>;
}

// Available MCP Tools for Travel AI
export const MCP_TOOLS: MCPTool[] = [
  {
    name: "search_hotels",
    description: "Search for hotels based on location, dates, and preferences",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Location to search" },
        checkIn: { type: "string", description: "Check-in date (YYYY-MM-DD)" },
        checkOut: { type: "string", description: "Check-out date (YYYY-MM-DD)" },
        guests: { type: "number", description: "Number of guests" },
        budget: { type: "number", description: "Maximum budget per night" },
        preferences: { type: "array", items: { type: "string" }, description: "Hotel preferences" }
      },
      required: ["destination"]
    }
  },
  {
    name: "search_flights",
    description: "Search for flights between destinations",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Departure city/airport" },
        destination: { type: "string", description: "Arrival city/airport" },
        departureDate: { type: "string", description: "Departure date (YYYY-MM-DD)" },
        returnDate: { type: "string", description: "Return date (optional)" },
        passengers: { type: "number", description: "Number of passengers" },
        budget: { type: "number", description: "Maximum budget" },
        class: { type: "string", enum: ["economy", "premium", "business", "first"] }
      },
      required: ["origin", "destination", "departureDate"]
    }
  },
  {
    name: "search_tours",
    description: "Find tours and experiences in a destination",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Location for tours" },
        date: { type: "string", description: "Preferred date (YYYY-MM-DD)" },
        duration: { type: "string", description: "Tour duration preference" },
        category: { type: "string", description: "Tour category (adventure, cultural, food, etc.)" },
        budget: { type: "number", description: "Maximum budget" },
        groupSize: { type: "number", description: "Number of participants" }
      },
      required: ["destination"]
    }
  },
  {
    name: "search_activities",
    description: "Search for activities and attractions",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Location for activities" },
        date: { type: "string", description: "Activity date (YYYY-MM-DD)" },
        category: { type: "string", description: "Activity type" },
        budget: { type: "number", description: "Maximum budget" },
        indoor: { type: "boolean", description: "Indoor activities only" }
      },
      required: ["destination"]
    }
  },
  {
    name: "create_itinerary",
    description: "Create a complete travel itinerary",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Main destination" },
        duration: { type: "number", description: "Trip duration in days" },
        budget: { type: "number", description: "Total budget" },
        interests: { type: "array", items: { type: "string" }, description: "Traveler interests" },
        travelStyle: { type: "string", description: "Travel style (luxury, budget, adventure, etc.)" }
      },
      required: ["destination", "duration"]
    }
  },
  {
    name: "get_travel_advice",
    description: "Get AI-powered travel advice and recommendations",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Travel question or request" },
        destination: { type: "string", description: "Destination context" },
        travelDates: { type: "string", description: "Travel dates" }
      },
      required: ["query"]
    }
  }
];

// Mock MCP Server Implementation
export class MockMCPServer {
  private mockDelay = 1000; // Simulate API delay

  async listTools(): Promise<MCPTool[]> {
    await this.delay();
    return MCP_TOOLS;
  }

  async callTool(request: MCPRequest): Promise<MCPResponse> {
    await this.delay();
    
    switch (request.params.name) {
      case "search_hotels":
        return this.mockSearchHotels(request.params.arguments);
      
      case "search_flights":
        return this.mockSearchFlights(request.params.arguments);
      
      case "search_tours":
        return this.mockSearchTours(request.params.arguments);
      
      case "search_activities":
        return this.mockSearchActivities(request.params.arguments);
      
      case "create_itinerary":
        return this.mockCreateItinerary(request.params.arguments);
      
      case "get_travel_advice":
        return this.mockGetTravelAdvice(request.params.arguments);
      
      default:
        return {
          content: [{ type: "text", text: "Unknown tool" }],
          isError: true
        };
    }
  }

  private async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }

  private mockSearchHotels(args: any): MCPResponse {
    const destination = args.destination || "Unknown Location";
    const budget = args.budget || 200;
    
    const mockHotels = [
      {
        id: "hotel_1",
        title: `Luxury Resort in ${destination}`,
        description: "5-star beachfront resort with spa and pool",
        price: Math.min(budget * 0.8, 250),
        currency: "USD",
        rating: 4.8,
        location: destination,
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
        amenities: ["Pool", "Spa", "WiFi", "Restaurant", "Gym"],
        availability: true,
        type: "hotel" as const
      },
      {
        id: "hotel_2", 
        title: `Boutique Hotel ${destination}`,
        description: "Charming boutique hotel in city center",
        price: Math.min(budget * 0.6, 150),
        currency: "USD",
        rating: 4.5,
        location: destination,
        images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"],
        amenities: ["WiFi", "Restaurant", "Concierge"],
        availability: true,
        type: "hotel" as const
      }
    ];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          query: `Hotels in ${destination}`,
          results: mockHotels,
          totalResults: mockHotels.length,
          searchTime: "0.8s"
        })
      }]
    };
  }

  private mockSearchFlights(args: any): MCPResponse {
    const origin = args.origin || "Unknown";
    const destination = args.destination || "Unknown";
    
    const mockFlights = [
      {
        id: "flight_1",
        title: `${origin} → ${destination}`,
        description: "Direct flight with major airline",
        price: 450,
        currency: "USD",
        rating: 4.3,
        location: `${origin} to ${destination}`,
        images: ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05"],
        type: "flight" as const,
        details: {
          airline: "Global Airways",
          duration: "3h 45m",
          departure: "08:30",
          arrival: "12:15",
          aircraft: "Boeing 737"
        }
      }
    ];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          query: `Flights from ${origin} to ${destination}`,
          results: mockFlights,
          totalResults: mockFlights.length
        })
      }]
    };
  }

  private mockSearchTours(args: any): MCPResponse {
    const destination = args.destination || "Unknown Location";
    
    const mockTours = [
      {
        id: "tour_1",
        title: `Cultural Tour of ${destination}`,
        description: "Full day cultural exploration with local guide",
        price: 89,
        currency: "USD",
        rating: 4.7,
        location: destination,
        images: ["https://images.unsplash.com/photo-1539650116574-75c0c6d0e04f"],
        type: "tour" as const,
        details: {
          duration: "8 hours",
          groupSize: "Max 12 people",
          includes: ["Guide", "Lunch", "Transportation"],
          difficulty: "Easy"
        }
      }
    ];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          query: `Tours in ${destination}`,
          results: mockTours,
          totalResults: mockTours.length
        })
      }]
    };
  }

  private mockSearchActivities(args: any): MCPResponse {
    const destination = args.destination || "Unknown Location";
    
    const mockActivities = [
      {
        id: "activity_1",
        title: `Adventure Sports in ${destination}`,
        description: "Thrilling outdoor adventure activities",
        price: 65,
        currency: "USD",
        rating: 4.6,
        location: destination,
        images: ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8"],
        type: "activity" as const,
        details: {
          duration: "4 hours",
          difficulty: "Moderate",
          equipment: "Provided",
          ageLimit: "16+"
        }
      }
    ];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          query: `Activities in ${destination}`,
          results: mockActivities,
          totalResults: mockActivities.length
        })
      }]
    };
  }

  private mockCreateItinerary(args: any): MCPResponse {
    const destination = args.destination || "Unknown Location";
    const duration = args.duration || 3;
    
    const itinerary = {
      destination,
      duration: `${duration} days`,
      overview: `Complete ${duration}-day itinerary for ${destination}`,
      dailyPlan: Array.from({ length: duration }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1}: Explore ${destination}`,
        activities: [
          "Morning: Local breakfast and city tour",
          "Afternoon: Visit main attractions",
          "Evening: Local dining experience"
        ],
        estimatedCost: 120
      })),
      totalEstimatedCost: duration * 120
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          itinerary,
          recommendations: "Book accommodations early for better rates"
        })
      }]
    };
  }

  private mockGetTravelAdvice(args: any): MCPResponse {
    const query = args.query || "";
    const destination = args.destination || "your destination";
    
    const advice = [
      `For ${destination}, I recommend visiting during the shoulder season for better prices and fewer crowds.`,
      "Pack light and bring versatile clothing that can be layered.",
      "Always have travel insurance and keep digital copies of important documents.",
      "Learn a few basic phrases in the local language - locals appreciate the effort!",
      "Research local customs and tipping practices before you go."
    ];

    const response = query.toLowerCase().includes("budget") 
      ? "For budget travel, consider staying in hostels, eating at local markets, and using public transportation."
      : advice[Math.floor(Math.random() * advice.length)];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          advice: response,
          confidence: 0.9,
          source: "AI Travel Assistant"
        })
      }]
    };
  }
}

// Export singleton instance
export const mockMCPServer = new MockMCPServer();
