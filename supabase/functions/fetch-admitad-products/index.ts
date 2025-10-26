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
    const { searchTerm, category } = await req.json();
    
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

    // First, get OAuth token
    const tokenResponse = await fetch('https://api.admitad.com/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${ADMITAD_CLIENT_ID}:${ADMITAD_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ADMITAD_CLIENT_ID,
        scope: 'public_data'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Admitad token error:', tokenResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with Admitad',
          details: errorText
        }), 
        { 
          status: tokenResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Searching Admitad for:', searchTerm);

    // Search for products using Admitad API
    const searchUrl = new URL('https://api.admitad.com/products/');
    searchUrl.searchParams.append('keyword', searchTerm || 'electronics');
    if (category) {
      searchUrl.searchParams.append('category', category);
    }
    searchUrl.searchParams.append('limit', '20');

    const productsResponse = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Admitad products error:', productsResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Admitad products',
          details: errorText
        }), 
        { 
          status: productsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await productsResponse.json();
    
    // Initialize Supabase client to store products
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform and store products
    const products = data.results?.map((item: any) => ({
      name: item.name || 'Unknown Product',
      description: item.description || '',
      price: item.price ? `$${item.price}` : 'N/A',
      image_url: item.picture || item.img_url || '',
      affiliate_link: item.goto_link || item.url || '',
      category: category || item.category_name || 'General',
      source: 'admitad',
      external_id: String(item.id)
    })) || [];

    // Upsert products to database
    if (products.length > 0) {
      const { error: upsertError } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'source,external_id' });

      if (upsertError) {
        console.error('Error upserting products:', upsertError);
      }
    }

    return new Response(
      JSON.stringify({ products }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-admitad-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch Admitad products. Please check your API credentials.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});