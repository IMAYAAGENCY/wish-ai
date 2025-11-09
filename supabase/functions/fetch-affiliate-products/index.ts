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

interface UserCredentials {
  platform: string;
  credentials: Record<string, any>;
  is_active: boolean;
}

// Amazon Adapter
async function fetchAmazonProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { accessKey, secretKey, partnerTag } = credentials;

    if (!accessKey || !secretKey || !partnerTag) {
      console.log('Amazon credentials incomplete');
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
async function fetchAdmitadProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { clientId, clientSecret } = credentials;

    if (!clientId || !clientSecret) {
      console.log('Admitad credentials incomplete');
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
async function fetchClickBankProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { apiKey, accountNickname } = credentials;

    if (!apiKey || !accountNickname) {
      console.log('ClickBank credentials incomplete');
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
async function fetchShareASaleProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { apiToken, apiSecret, affiliateId } = credentials;

    if (!apiToken || !apiSecret || !affiliateId) {
      console.log('ShareASale credentials incomplete');
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
async function fetchCJProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { apiKey, websiteId } = credentials;

    if (!apiKey || !websiteId) {
      console.log('CJ credentials incomplete');
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
async function fetchImpactProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { accountSid, authToken } = credentials;

    if (!accountSid || !authToken) {
      console.log('Impact credentials incomplete');
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
async function fetchRakutenProducts(query: string, credentials: Record<string, any>): Promise<AffiliateProduct[]> {
  try {
    const { apiKey, siteId } = credentials;

    if (!apiKey || !siteId) {
      console.log('Rakuten credentials incomplete');
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

    // Initialize Supabase client with user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required. Please log in.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching credentials for user: ${user.id}`);

    // Fetch user's credentials from database
    const { data: userCredentials, error: credsError } = await supabase
      .from('affiliate_credentials')
      .select('platform, credentials, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (credsError) {
      console.error('Error fetching credentials:', credsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${userCredentials?.length || 0} active platform credential(s)`);

    // Create a map of platform credentials
    const credentialsMap = new Map<string, Record<string, any>>();
    userCredentials?.forEach((cred: UserCredentials) => {
      credentialsMap.set(cred.platform, cred.credentials);
    });

    if (credentialsMap.size === 0) {
      return new Response(
        JSON.stringify({ 
          products: [], 
          message: 'No affiliate platforms configured. Please add your API credentials in the Dashboard.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching across platforms:', Array.from(credentialsMap.keys()).join(', '));
    console.log('Query:', query);

    // Map of platform fetchers
    const platformFetchers: Record<string, (query: string, credentials: Record<string, any>) => Promise<AffiliateProduct[]>> = {
      amazon: fetchAmazonProducts,
      admitad: fetchAdmitadProducts,
      clickbank: fetchClickBankProducts,
      shareasale: fetchShareASaleProducts,
      cj: fetchCJProducts,
      impact: fetchImpactProducts,
      rakuten: fetchRakutenProducts,
    };

    // Fetch from all enabled platforms in parallel
    const platformPromises = Array.from(credentialsMap.entries()).map(([platform, credentials]) => {
      const fetcher = platformFetchers[platform];
      if (!fetcher) {
        console.log(`No fetcher found for platform: ${platform}`);
        return Promise.resolve([]);
      }
      return fetcher(query, credentials);
    });

    const results = await Promise.allSettled(platformPromises);
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
