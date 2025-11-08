import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AffiliateProduct {
  id: string;
  platform: string;
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

// Amazon Adapter
async function fetchAmazonProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const accessKey = Deno.env.get('AMAZON_ACCESS_KEY');
    const secretKey = Deno.env.get('AMAZON_SECRET_KEY');
    const partnerTag = Deno.env.get('AMAZON_PARTNER_TAG');

    if (!accessKey || !secretKey || !partnerTag) {
      console.log('Amazon credentials not configured');
      return [];
    }

    // Amazon Product Advertising API integration would go here
    console.log('Fetching from Amazon:', query);
    return [];
  } catch (error) {
    console.error('Amazon fetch error:', error);
    return [];
  }
}

// Admitad Adapter
async function fetchAdmitadProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const clientId = Deno.env.get('ADMITAD_CLIENT_ID');
    const clientSecret = Deno.env.get('ADMITAD_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.log('Admitad credentials not configured');
      return [];
    }

    // Get OAuth token
    const tokenResponse = await fetch('https://api.admitad.com/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'public_data',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Admitad token error:', await tokenResponse.text());
      return [];
    }

    const { access_token } = await tokenResponse.json();

    // Search products
    const searchResponse = await fetch(
      `https://api.admitad.com/products/search/?q=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('Admitad search error:', await searchResponse.text());
      return [];
    }

    const data = await searchResponse.json();
    
    return (data.results || []).map((product: any) => ({
      id: `admitad-${product.id}`,
      platform: 'admitad',
      title: product.name,
      description: product.description || '',
      price: parseFloat(product.price) || 0,
      currency: product.currency || 'USD',
      image: product.picture || 'https://via.placeholder.com/300',
      affiliateUrl: product.goto_link || product.url,
      category: product.category?.name,
      vendor: product.merchant?.name,
    }));
  } catch (error) {
    console.error('Admitad fetch error:', error);
    return [];
  }
}

// ClickBank Adapter
async function fetchClickBankProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const apiKey = Deno.env.get('CLICKBANK_API_KEY');
    const affiliateId = Deno.env.get('CLICKBANK_AFFILIATE_ID');

    if (!apiKey || !affiliateId) {
      console.log('ClickBank credentials not configured');
      return [];
    }

    // ClickBank API integration
    console.log('Fetching from ClickBank:', query);
    return [];
  } catch (error) {
    console.error('ClickBank fetch error:', error);
    return [];
  }
}

// ShareASale Adapter
async function fetchShareASaleProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const apiToken = Deno.env.get('SHAREASALE_API_TOKEN');
    const apiSecret = Deno.env.get('SHAREASALE_API_SECRET');
    const affiliateId = Deno.env.get('SHAREASALE_AFFILIATE_ID');

    if (!apiToken || !apiSecret || !affiliateId) {
      console.log('ShareASale credentials not configured');
      return [];
    }

    // ShareASale API integration
    console.log('Fetching from ShareASale:', query);
    return [];
  } catch (error) {
    console.error('ShareASale fetch error:', error);
    return [];
  }
}

// CJ Affiliate Adapter
async function fetchCJProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const apiKey = Deno.env.get('CJ_API_KEY');

    if (!apiKey) {
      console.log('CJ credentials not configured');
      return [];
    }

    // CJ Affiliate API integration
    console.log('Fetching from CJ:', query);
    return [];
  } catch (error) {
    console.error('CJ fetch error:', error);
    return [];
  }
}

// Impact Adapter
async function fetchImpactProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const apiKey = Deno.env.get('IMPACT_API_KEY');
    const accountSid = Deno.env.get('IMPACT_ACCOUNT_SID');

    if (!apiKey || !accountSid) {
      console.log('Impact credentials not configured');
      return [];
    }

    // Impact API integration
    console.log('Fetching from Impact:', query);
    return [];
  } catch (error) {
    console.error('Impact fetch error:', error);
    return [];
  }
}

// Rakuten Adapter
async function fetchRakutenProducts(query: string): Promise<AffiliateProduct[]> {
  try {
    const apiKey = Deno.env.get('RAKUTEN_API_KEY');

    if (!apiKey) {
      console.log('Rakuten credentials not configured');
      return [];
    }

    // Rakuten API integration
    console.log('Fetching from Rakuten:', query);
    return [];
  } catch (error) {
    console.error('Rakuten fetch error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, platforms } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching across platforms:', platforms || 'all');
    console.log('Query:', query);

    // Fetch from all enabled platforms in parallel
    const platformFetchers = [
      fetchAmazonProducts(query),
      fetchAdmitadProducts(query),
      fetchClickBankProducts(query),
      fetchShareASaleProducts(query),
      fetchCJProducts(query),
      fetchImpactProducts(query),
      fetchRakutenProducts(query),
    ];

    const results = await Promise.allSettled(platformFetchers);
    
    // Combine all successful results
    const allProducts = results
      .filter((result): result is PromiseFulfilledResult<AffiliateProduct[]> => 
        result.status === 'fulfilled'
      )
      .flatMap(result => result.value);

    console.log(`Found ${allProducts.length} products across all platforms`);

    return new Response(
      JSON.stringify({ products: allProducts }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-affiliate-products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
