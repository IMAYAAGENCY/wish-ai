import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, category, sources } = await req.json();
    
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

    // Fetch from Amazon if no specific source or Amazon is included
    if (!sources || sources.includes('amazon')) {
      fetchPromises.push(
        fetch(`${supabaseUrl}/functions/v1/fetch-amazon-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ searchTerm, category })
        }).catch(error => {
          console.error('Error fetching from Amazon:', error);
          return null;
        })
      );
    }

    // Fetch from Admitad if no specific source or Admitad is included
    if (!sources || sources.includes('admitad')) {
      fetchPromises.push(
        fetch(`${supabaseUrl}/functions/v1/fetch-admitad-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ searchTerm, category })
        }).catch(error => {
          console.error('Error fetching from Admitad:', error);
          return null;
        })
      );
    }

    const responses = await Promise.all(fetchPromises);
    const allProducts = [];

    for (const response of responses) {
      if (response && response.ok) {
        const data = await response.json();
        if (data.products) {
          allProducts.push(...data.products);
        }
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
