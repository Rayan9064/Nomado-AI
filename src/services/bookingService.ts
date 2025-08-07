import { BookingOption } from '@/types';

export class BookingService {
  private static mockFlights: BookingOption[] = [
    {
      id: 'flight-mumbai-goa-1',
      type: 'flight',
      title: 'Mumbai to Goa Flight',
      description: 'Round trip with IndiGo',
      price: 8500,
      currency: 'INR',
      details: {
        departure: 'Mumbai (BOM)',
        arrival: 'Goa (GOI)',
        date: '2024-09-15',
        returnDate: '2024-09-18',
        airline: 'IndiGo',
        duration: '1h 30m',
        class: 'Economy'
      }
    },
    {
      id: 'flight-mumbai-goa-2',
      type: 'flight',
      title: 'Mumbai to Goa Premium',
      description: 'Round trip with Vistara',
      price: 12000,
      currency: 'INR',
      details: {
        departure: 'Mumbai (BOM)',
        arrival: 'Goa (GOI)',
        date: '2024-09-15',
        returnDate: '2024-09-18',
        airline: 'Vistara',
        duration: '1h 25m',
        class: 'Premium Economy'
      }
    }
  ];

  private static mockHotels: BookingOption[] = [
    {
      id: 'hotel-goa-beach-1',
      type: 'hotel',
      title: 'Beachside Resort Goa',
      description: '3 nights at premium beachfront resort',
      price: 6000,
      currency: 'INR',
      details: {
        location: 'Calangute Beach, Goa',
        checkIn: '2024-09-15',
        checkOut: '2024-09-18',
        rating: 4.5,
        amenities: ['Pool', 'Beach Access', 'Spa', 'Restaurant', 'WiFi'],
        roomType: 'Deluxe Ocean View'
      }
    },
    {
      id: 'hotel-goa-luxury-1',
      type: 'hotel',
      title: 'Luxury Villa Resort',
      description: '3 nights in luxury accommodation',
      price: 15000,
      currency: 'INR',
      details: {
        location: 'Anjuna Beach, Goa',
        checkIn: '2024-09-15',
        checkOut: '2024-09-18',
        rating: 4.8,
        amenities: ['Private Pool', 'Beach Access', 'Spa', 'Fine Dining', 'Butler Service'],
        roomType: 'Villa with Private Pool'
      }
    }
  ];

  private static mockTours: BookingOption[] = [
    {
      id: 'tour-goa-heritage-1',
      type: 'tour',
      title: 'Goa Heritage Tour',
      description: 'Full day tour covering Old Goa churches and Portuguese architecture',
      price: 2500,
      currency: 'INR',
      details: {
        duration: '8 hours',
        includes: ['Transportation', 'Guide', 'Lunch', 'Entry Fees'],
        highlights: ['Basilica of Bom Jesus', 'Se Cathedral', 'Fontainhas'],
        groupSize: 'Max 15 people'
      }
    },
    {
      id: 'tour-goa-beach-1',
      type: 'tour',
      title: 'Goa Beach Hopping',
      description: 'Visit multiple beaches with water sports activities',
      price: 3000,
      currency: 'INR',
      details: {
        duration: '6 hours',
        includes: ['Transportation', 'Water Sports', 'Refreshments'],
        highlights: ['Baga Beach', 'Calangute Beach', 'Anjuna Beach'],
        activities: ['Parasailing', 'Jet Ski', 'Banana Boat']
      }
    }
  ];

  private static mockActivities: BookingOption[] = [
    {
      id: 'activity-scuba-diving-1',
      type: 'activity',
      title: 'Scuba Diving Experience',
      description: 'Discover underwater marine life with certified instructors',
      price: 4500,
      currency: 'INR',
      details: {
        duration: '4 hours',
        location: 'Grande Island, Goa',
        includes: ['Equipment', 'Instructor', 'Boat Transfer', 'Lunch'],
        certification: 'PADI certified instructors',
        minAge: 12
      }
    },
    {
      id: 'activity-spice-plantation-1',
      type: 'activity',
      title: 'Spice Plantation Tour',
      description: 'Explore organic spice farms with traditional Goan lunch',
      price: 1800,
      currency: 'INR',
      details: {
        duration: '5 hours',
        location: 'Ponda, Goa',
        includes: ['Guided Tour', 'Traditional Lunch', 'Transportation'],
        highlights: ['Cardamom', 'Cinnamon', 'Vanilla', 'Cashew Processing']
      }
    }
  ];

  static async searchFlights(destination: string, budget?: number): Promise<BookingOption[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let results = this.mockFlights.filter(flight => 
      flight.details.arrival.toLowerCase().includes(destination.toLowerCase())
    );

    if (budget) {
      results = results.filter(flight => flight.price <= budget);
    }

    return results;
  }

  static async searchHotels(destination: string, budget?: number): Promise<BookingOption[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let results = this.mockHotels.filter(hotel => 
      hotel.details.location.toLowerCase().includes(destination.toLowerCase())
    );

    if (budget) {
      results = results.filter(hotel => hotel.price <= budget);
    }

    return results;
  }

  static async searchTours(destination: string, budget?: number): Promise<BookingOption[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let results = this.mockTours;

    if (budget) {
      results = results.filter(tour => tour.price <= budget);
    }

    return results;
  }

  static async searchActivities(destination: string, budget?: number): Promise<BookingOption[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let results = this.mockActivities;

    if (budget) {
      results = results.filter(activity => activity.price <= budget);
    }

    return results;
  }

  static async searchAll(destination: string, budget?: number): Promise<BookingOption[]> {
    const [flights, hotels, tours, activities] = await Promise.all([
      this.searchFlights(destination, budget),
      this.searchHotels(destination, budget),
      this.searchTours(destination, budget),
      this.searchActivities(destination, budget)
    ]);

    return [...flights, ...hotels, ...tours, ...activities];
  }
}
