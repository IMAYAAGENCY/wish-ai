// Common types for all affiliate platforms

export type AffiliatePlatform = 
  | 'amazon'
  | 'admitad'
  | 'clickbank'
  | 'shareasale'
  | 'cj'
  | 'impact'
  | 'rakuten'
  | 'appsumo'
  | 'gumroad'
  | 'udemy'
  | 'envato';

export interface AffiliateProduct {
  id: string;
  platform: AffiliatePlatform;
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  affiliateUrl: string;
  commission?: number;
  rating?: number;
  category?: string;
  vendor?: string;
}

export interface AffiliateAdapter {
  platform: AffiliatePlatform;
  search(query: string, options?: SearchOptions): Promise<AffiliateProduct[]>;
  isEnabled(): boolean;
}

export interface SearchOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price' | 'rating';
}

export interface PlatformCredentials {
  platform: AffiliatePlatform;
  enabled: boolean;
  credentials: Record<string, string>;
}
