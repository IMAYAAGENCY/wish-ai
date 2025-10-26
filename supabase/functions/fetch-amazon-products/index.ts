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
    
    const AMAZON_ACCESS_KEY = Deno.env.get('AMAZON_ACCESS_KEY');
    const AMAZON_SECRET_KEY = Deno.env.get('AMAZON_SECRET_KEY');
    const AMAZON_PARTNER_TAG = Deno.env.get('AMAZON_PARTNER_TAG');
    
    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) {
      console.error('Amazon credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Amazon credentials not configured',
          message: 'Please add your Amazon Associates API credentials'
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Amazon Product Advertising API 5.0 implementation
    // Using PAAPI 5.0 which requires AWS Signature Version 4
    const timestamp = new Date().toISOString();
    const region = 'us-east-1'; // Change based on your marketplace
    const service = 'ProductAdvertisingAPI';
    const host = `webservices.amazon.com`;
    const endpoint = `https://${host}/paapi5/searchitems`;

    // Create the request payload
    const payload = {
      Keywords: searchTerm || 'electronics',
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price'
      ],
      PartnerTag: AMAZON_PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com'
    };

    console.log('Searching Amazon for:', searchTerm);

    // Note: Full AWS Signature V4 implementation would be required here
    // This is a placeholder - you'll need to implement proper signing
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'X-Amz-Date': timestamp,
        'Content-Encoding': 'amz-1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amazon API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Amazon products',
          details: errorText
        }), 
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    // Initialize Supabase client to store products
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Transform and store products
    const products = data.SearchResult?.Items?.map((item: any) => ({
      name: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      description: item.ItemInfo?.Features?.DisplayValues?.[0] || '',
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A',
      image_url: item.Images?.Primary?.Large?.URL || '',
      affiliate_link: item.DetailPageURL || '',
      category: category || 'Electronics',
      source: 'amazon',
      external_id: item.ASIN
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
    console.error('Error in fetch-amazon-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch Amazon products. Please check your API credentials.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});