import { useState } from 'react';
import { toast } from 'sonner';
import { getMockProducts } from '@/data/mockProducts';

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
      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData = getMockProducts(searchTerm, category);
      
      if (mockData.length > 0) {
        // Transform the data to match the expected format
        const transformedProducts = mockData.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          imageUrl: p.image_url,
          affiliateLink: p.affiliate_link,
          category: p.category,
        }));
        
        setProducts(transformedProducts);
        toast.success(`Found ${transformedProducts.length} demo products! 🎉`);
      } else {
        setProducts([]);
        toast.info('No products found. Try searching for "headphones", "laptop", or "camera".');
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
