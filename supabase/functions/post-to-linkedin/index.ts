import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LINKEDIN_ACCESS_TOKEN = Deno.env.get('LINKEDIN_ACCESS_TOKEN');

    if (!LINKEDIN_ACCESS_TOKEN) {
      throw new Error('LINKEDIN_ACCESS_TOKEN not configured');
    }

    const { text, authorUrn } = await req.json();

    if (!text) {
      throw new Error('Post text is required');
    }

    console.log('Posting to LinkedIn...');

    // LinkedIn UGC Post API v2
    const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn || 'urn:li:person:YOUR_PERSON_ID',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const responseText = await linkedInResponse.text();
    console.log('LinkedIn API Response:', linkedInResponse.status, responseText);

    if (!linkedInResponse.ok) {
      throw new Error(`LinkedIn API error: ${linkedInResponse.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully posted to LinkedIn',
        postId: result.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error posting to LinkedIn:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
