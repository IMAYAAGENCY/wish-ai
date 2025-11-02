import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to create HMAC-SHA256 signature
async function hmacSHA256(key: Uint8Array | string, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message)
  );
  
  return new Uint8Array(signature);
}

// Helper function to create SHA256 hash
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// AWS Signature Version 4 signing
async function signAWSRequest(
  method: string,
  host: string,
  uri: string,
  querystring: string,
  payload: string,
  accessKey: string,
  secretKey: string,
  region: string,
  service: string
) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  // Create canonical request
  const payloadHash = await sha256(payload);
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;
  const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
  const canonicalRequest = `${method}\n${uri}\n${querystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  // Calculate signature
  const kDate = await hmacSHA256(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSigning = await hmacSHA256(kService, 'aws4_request');
  const signature = bytesToHex(await hmacSHA256(kSigning, stringToSign));
  
  // Create authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Host': host,
    'X-Amz-Date': amzDate,
    'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    'Authorization': authorizationHeader
  };
}

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

    // Amazon Product Advertising API 5.0 settings
    const region = 'us-east-1';
    const service = 'ProductAdvertisingAPI';
    const host = 'webservices.amazon.com';
    const uri = '/paapi5/searchitems';
    const endpoint = `https://${host}${uri}`;

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
      Marketplace: 'www.amazon.com',
      ItemCount: 10
    };

    const payloadString = JSON.stringify(payload);
    console.log('Searching Amazon for:', searchTerm);

    // Sign the request
    const headers = await signAWSRequest(
      'POST',
      host,
      uri,
      '',
      payloadString,
      AMAZON_ACCESS_KEY,
      AMAZON_SECRET_KEY,
      region,
      service
    );

    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: payloadString
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amazon API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Amazon products',
          details: errorText,
          status: response.status
        }), 
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Amazon API response received');
    
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

    console.log(`Found ${products.length} products from Amazon`);

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