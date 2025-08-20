// types.ts
export interface EventSummary {
  id: string;
  name: string;
  url: string; // matches filename in /public/data/
  logoUrl: string;
  latestLowestPrice: number;
  lastUpdated: string;
  venueId: string;
  venueName: string;
  venueCity: string;
  venueState: string;
  dates: {
    start: {
      dateTime: string;
    };
  };
}

export interface PricePoint {
  date: string;
  lowestPrice: number;
  upperPrice: number;
}

export interface EventDetails extends EventSummary {
  priceRange: PricePoint[];
}
