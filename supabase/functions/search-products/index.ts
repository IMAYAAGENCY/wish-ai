import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Input validation schema
    const searchSchema = z.object({
      searchTerm: z.string().trim().max(100, 'Search term must be less than 100 characters').optional(),
      category: z.string().trim().max(50, 'Category must be less than 50 characters').optional(),
      sources: z.array(z.string().max(50)).optional()
    });

    const rawBody = await req.json();
    const validationResult = searchSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.errors.map(e => e.message).join(', '),
          products: []
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { searchTerm, category, sources } = validationResult.data;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Searching products for:', searchTerm, 'category:', category, 'sources:', sources);

    // First, try to get products from database
    let query = supabase
      .from('products')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (sources && sources.length > 0) {
      query = query.in('source', sources);
    }

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data: existingProducts, error: dbError } = await query.limit(20);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // If we have products in the database, return them
    if (existingProducts && existingProducts.length > 0) {
      console.log('Found', existingProducts.length, 'products in database');
      return new Response(
        JSON.stringify({ products: existingProducts }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Otherwise, fetch from affiliate networks
    console.log('No products in database, fetching from affiliate networks...');
    const fetchPromises = [];

    // Use service role key to call protected edge functions
    const authHeader = `Bearer ${supabaseKey}`;
    
    // Fetch from Amazon if no specific source or Amazon is included
    if (!sources || sources.includes('amazon')) {
      fetchPromises.push(
        supabase.functions.invoke('fetch-amazon-products', {
          body: { searchTerm, category },
          headers: { Authorization: authHeader }
        }).then(response => {
          if (response.error) {
            console.error('Error calling fetch-amazon-products:', response.error);
            return null;
          }
          return response;
        }).catch(() => null)
      );
    }

    // Fetch from Admitad if no specific source or Admitad is included
    if (!sources || sources.includes('admitad')) {
      fetchPromises.push(
        supabase.functions.invoke('fetch-admitad-products', {
          body: { searchTerm, category },
          headers: { Authorization: authHeader }
        }).then(response => {
          if (response.error) {
            console.error('Error calling fetch-admitad-products:', response.error);
            return null;
          }
          return response;
        }).catch(() => null)
      );
    }

    const responses = await Promise.all(fetchPromises);
    const allProducts = [];

    for (const response of responses) {
      if (response && response.data && response.data.products) {
        allProducts.push(...response.data.products);
      }
    }

    return new Response(
      JSON.stringify({ products: allProducts }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in search-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        products: []
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
