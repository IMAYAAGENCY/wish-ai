import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
}

export const useProductSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchProducts = async (searchTerm: string, category?: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-products', {
        body: { 
          searchTerm, 
          category,
          sources: ['amazon', 'admitad']
        }
      });

      if (error) {
        // Log errors only in development to prevent SEO audit issues
        if (import.meta.env.DEV) {
          console.error('Error searching products:', error);
        }
        toast.error('Failed to search products. Please try again.');
        return;
      }

      if (data?.products && data.products.length > 0) {
        // Transform the data to match the expected format
        const transformedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          imageUrl: p.image_url,
          affiliateLink: p.affiliate_link,
          category: p.category,
        }));
        
        setProducts(transformedProducts);
        toast.success(`Found ${transformedProducts.length} products!`);
      } else {
        setProducts([]);
        toast.info('No products found. Try a different search term.');
      }
    } catch (error) {
      // Log errors only in development to prevent SEO audit issues
      if (import.meta.env.DEV) {
        console.error('Error:', error);
      }
      toast.error('An error occurred while searching. Please try again.');
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
