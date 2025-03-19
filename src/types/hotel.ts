export interface Transportation {
    type: string;
    duration: string;
  }
  
  export interface NearbyPlace {
    name: string;
    transportations: Transportation[];
  }
  
  export interface Image {
    thumbnail: string;
    original_image: string;
  }
  
  export interface RatePerNight {
    lowest: string;
    extracted_lowest: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  }
  
  export interface RatingBreakdown {
    name: string;
    description: string;
    total_mentioned: number;
    positive: number;
    negative: number;
    neutral: number;
  }
  
  export interface StarRating {
    stars: number;
    count: number;
  }
  
  export interface HotelData {
    type?: string;  // Making this optional to match both use cases
    name: string;
    address?: string;
    description?: string;
    link?: string;
    gps_coordinates?: {
      latitude: number;
      longitude: number;
    };
    check_in_time?: string;
    check_out_time?: string;
    rate_per_night?: RatePerNight;
    total_rate?: RatePerNight;
    nearby_places?: NearbyPlace[];
    hotel_class?: string;
    extracted_hotel_class?: number;
    images?: Image[];
    overall_rating?: number;
    reviews?: number;
    ratings?: StarRating[];
    location_rating?: number;
    reviews_breakdown?: RatingBreakdown[];
    amenities?: string[];
    excluded_amenities?: string[];
    essential_info?: string[];
    property_token?: string;
  }
  
  export interface HotelSearchResponse {
    search_metadata: {
      id: string;
      status: string;
      total_time_taken: number;
    };
    search_parameters: {
      engine: string;
      q: string;
      gl: string;
      hl: string;
      currency: string;
      check_in_date: string;
      check_out_date: string;
      adults: number;
      children: number;
    };
    search_information: {
      total_results: number;
    };
    properties: HotelData[];
  }