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
      category: z.string().trim().max(50, 'Category must be less than 50 characters').optional()
    });

    const rawBody = await req.json();
    const validationResult = searchSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.errors.map(e => e.message).join(', ')
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { searchTerm, category } = validationResult.data;
    
    const ADMITAD_CLIENT_ID = Deno.env.get('ADMITAD_CLIENT_ID');
    const ADMITAD_CLIENT_SECRET = Deno.env.get('ADMITAD_CLIENT_SECRET');
    
    if (!ADMITAD_CLIENT_ID || !ADMITAD_CLIENT_SECRET) {
      console.error('Admitad credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Admitad credentials not configured',
          message: 'Please add your Admitad API credentials'
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting Admitad OAuth authentication...');

    // First, get OAuth token using correct Admitad endpoint
    const tokenResponse = await fetch('https://api.admitad.com/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${ADMITAD_CLIENT_ID}:${ADMITAD_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ADMITAD_CLIENT_ID,
        scope: 'advcampaigns_for_website'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Admitad token error:', tokenResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with Admitad',
          details: errorText,
          status: tokenResponse.status
        }), 
        { 
          status: tokenResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Admitad authentication successful');

    console.log('Searching Admitad for:', searchTerm || 'electronics');

    // Search for products using correct Admitad Products API v2
    const searchUrl = new URL('https://api.admitad.com/advcampaigns/products/');
    searchUrl.searchParams.append('keyword', searchTerm || 'electronics');
    if (category) {
      searchUrl.searchParams.append('category', category);
    }
    searchUrl.searchParams.append('limit', '20');
    searchUrl.searchParams.append('offset', '0');

    const productsResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Admitad products error:', productsResponse.status, errorText);
      
      // If products endpoint fails, try aggregator endpoint as fallback
      console.log('Trying aggregator endpoint as fallback...');
      const aggregatorUrl = new URL('https://api.admitad.com/products/search/');
      aggregatorUrl.searchParams.append('q', searchTerm || 'electronics');
      aggregatorUrl.searchParams.append('limit', '20');
      
      const aggregatorResponse = await fetch(aggregatorUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!aggregatorResponse.ok) {
        const aggErrorText = await aggregatorResponse.text();
        console.error('Admitad aggregator error:', aggregatorResponse.status, aggErrorText);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch Admitad products from both endpoints',
            details: { primary: errorText, fallback: aggErrorText },
            status: aggregatorResponse.status
          }), 
          { 
            status: aggregatorResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const aggregatorData = await aggregatorResponse.json();
      const aggregatorProducts = transformAggregatorProducts(aggregatorData, category);
      
      return await storeAndReturnProducts(aggregatorProducts);
    }

    const data = await productsResponse.json();
    console.log('Admitad API response received');
    
    // Transform products
    const products = transformProducts(data, category);
    
    return await storeAndReturnProducts(products);

  } catch (error) {
    console.error('Error in fetch-admitad-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch Admitad products. Please check your API credentials.',
        stack: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to transform products from main API
function transformProducts(data: any, category?: string) {
  return data.results?.map((item: any) => ({
    name: item.name || 'Unknown Product',
    description: item.description || item.short_description || '',
    price: item.price ? `$${item.price}` : (item.price_min ? `$${item.price_min}` : 'N/A'),
    image_url: item.picture || item.picture_url || item.img_url || '',
    affiliate_link: item.goto_link || item.url || '',
    category: category || item.category_name || 'General',
    source: 'admitad',
    external_id: String(item.id)
  })) || [];
}

// Helper function to transform products from aggregator API
function transformAggregatorProducts(data: any, category?: string) {
  return data.products?.map((item: any) => ({
    name: item.name || 'Unknown Product',
    description: item.description || '',
    price: item.price ? `$${item.price}` : 'N/A',
    image_url: item.image || item.img || '',
    affiliate_link: item.link || '',
    category: category || 'General',
    source: 'admitad',
    external_id: String(item.id)
  })) || [];
}

// Helper function to store products and return response
async function storeAndReturnProducts(products: any[]) {
  // Initialize Supabase client to store products
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Found ${products.length} products from Admitad`);

  // Upsert products to database
  if (products.length > 0) {
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'source,external_id' });

    if (upsertError) {
      console.error('Error upserting products:', upsertError);
    } else {
      console.log('Products successfully stored in database');
    }
  }

  return new Response(
    JSON.stringify({ products }), 
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}