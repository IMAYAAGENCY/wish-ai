import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  platform: string;
  success: boolean;
  message: string;
}

// Test Amazon credentials
async function testAmazon(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { accessKey, secretKey, partnerTag } = credentials;
    
    if (!accessKey || !secretKey || !partnerTag) {
      return {
        platform: 'amazon',
        success: false,
        message: 'Missing required credentials'
      };
    }

    // For Amazon, we'll just validate that credentials are provided
    // Full PA-API requires complex signing mechanism
    return {
      platform: 'amazon',
      success: true,
      message: 'Credentials format valid'
    };
  } catch (error: any) {
    return {
      platform: 'amazon',
      success: false,
      message: error.message
    };
  }
}

// Test Admitad credentials
async function testAdmitad(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { clientId, clientSecret } = credentials;
    
    if (!clientId || !clientSecret) {
      return {
        platform: 'admitad',
        success: false,
        message: 'Missing required credentials'
      };
    }

    // Test OAuth token generation
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
      const error = await tokenResponse.text();
      return {
        platform: 'admitad',
        success: false,
        message: `Authentication failed: ${error}`
      };
    }

    return {
      platform: 'admitad',
      success: true,
      message: 'Credentials validated successfully'
    };
  } catch (error: any) {
    return {
      platform: 'admitad',
      success: false,
      message: error.message
    };
  }
}

// Test ClickBank credentials
async function testClickBank(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { apiKey, accountNickname } = credentials;
    
    if (!apiKey || !accountNickname) {
      return {
        platform: 'clickbank',
        success: false,
        message: 'Missing required credentials'
      };
    }

    return {
      platform: 'clickbank',
      success: true,
      message: 'Credentials format valid'
    };
  } catch (error: any) {
    return {
      platform: 'clickbank',
      success: false,
      message: error.message
    };
  }
}

// Test ShareASale credentials
async function testShareASale(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { apiToken, apiSecret, affiliateId } = credentials;
    
    if (!apiToken || !apiSecret || !affiliateId) {
      return {
        platform: 'shareasale',
        success: false,
        message: 'Missing required credentials'
      };
    }

    return {
      platform: 'shareasale',
      success: true,
      message: 'Credentials format valid'
    };
  } catch (error: any) {
    return {
      platform: 'shareasale',
      success: false,
      message: error.message
    };
  }
}

// Test CJ credentials
async function testCJ(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { apiKey, websiteId } = credentials;
    
    if (!apiKey || !websiteId) {
      return {
        platform: 'cj',
        success: false,
        message: 'Missing required credentials'
      };
    }

    return {
      platform: 'cj',
      success: true,
      message: 'Credentials format valid'
    };
  } catch (error: any) {
    return {
      platform: 'cj',
      success: false,
      message: error.message
    };
  }
}

// Test Impact credentials
async function testImpact(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { accountSid, authToken } = credentials;
    
    if (!accountSid || !authToken) {
      return {
        platform: 'impact',
        success: false,
        message: 'Missing required credentials'
      };
    }

    return {
      platform: 'impact',
      success: true,
      message: 'Credentials format valid'
    };
  } catch (error: any) {
    return {
      platform: 'impact',
      success: false,
      message: error.message
    };
  }
}

// Test Rakuten credentials
async function testRakuten(credentials: Record<string, any>): Promise<TestResult> {
  try {
    const { apiKey, siteId } = credentials;
    
    if (!apiKey || !siteId) {
      return {
        platform: 'rakuten',
        success: false,
        message: 'Missing required credentials'
      };
    }

    return {
      platform: 'rakuten',
      success: true,
      message: 'Credentials format valid'
    };
  } catch (error: any) {
    return {
      platform: 'rakuten',
      success: false,
      message: error.message
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { platform } = await req.json();

    if (!platform) {
      throw new Error('Platform is required');
    }

    // Fetch user's credentials for the platform
    const { data: credData, error: credError } = await supabase
      .from('affiliate_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single();

    if (credError || !credData) {
      return new Response(
        JSON.stringify({
          platform,
          success: false,
          message: 'No credentials found for this platform'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const credentials = credData.credentials as Record<string, any>;

    // Test credentials based on platform
    let result: TestResult;
    switch (platform) {
      case 'amazon':
        result = await testAmazon(credentials);
        break;
      case 'admitad':
        result = await testAdmitad(credentials);
        break;
      case 'clickbank':
        result = await testClickBank(credentials);
        break;
      case 'shareasale':
        result = await testShareASale(credentials);
        break;
      case 'cj':
        result = await testCJ(credentials);
        break;
      case 'impact':
        result = await testImpact(credentials);
        break;
      case 'rakuten':
        result = await testRakuten(credentials);
        break;
      default:
        result = {
          platform,
          success: false,
          message: 'Unsupported platform'
        };
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error testing credentials:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
