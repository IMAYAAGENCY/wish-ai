import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  platform?: string;
  vendor?: string;
}

export const useProductSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchProducts = async (searchTerm: string, category?: string) => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Searching products from all platforms:', searchTerm);
      
      const { data, error } = await supabase.functions.invoke('fetch-affiliate-products', {
        body: { 
          query: searchTerm,
          category: category !== "all" ? category : undefined
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const fetchedProducts = data?.products || [];
      console.log('Products fetched:', fetchedProducts.length);
      
      // Transform to match existing Product interface
      const transformedProducts = fetchedProducts.map((p: any) => ({
        id: p.id,
        name: p.title,
        description: p.description || '',
        price: `${p.currency === 'USD' ? '$' : p.currency}${p.price.toFixed(2)}`,
        imageUrl: p.image,
        affiliateLink: p.affiliateUrl,
        category: p.category || 'General',
        platform: p.platform,
        vendor: p.vendor,
      }));
      
      setProducts(transformedProducts);
      
      if (transformedProducts.length === 0) {
        toast.info("No products found. Configure API credentials in Dashboard to fetch real products.");
      } else {
        const platformCount = new Set(transformedProducts.map((p: Product) => p.platform)).size;
        toast.success(`Found ${transformedProducts.length} products from ${platformCount} platform(s)!`);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    isLoading,
    searchProducts
  };
};
