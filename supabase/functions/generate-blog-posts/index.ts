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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching trending keywords from user searches...');
    
    // Get top 5 trending keywords from the last 7 days
    const { data: searches, error: searchError } = await supabase
      .from('user_searches')
      .select('query')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (searchError) {
      console.error('Error fetching searches:', searchError);
      throw searchError;
    }

    // Count keyword frequency
    const keywordCount = new Map<string, number>();
    searches?.forEach(({ query }) => {
      const words = query.toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 3) {
          keywordCount.set(word, (keywordCount.get(word) || 0) + 1);
        }
      });
    });

    // Get top 3 keywords
    const topKeywords = Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);

    console.log('Top keywords:', topKeywords);

    if (topKeywords.length === 0) {
      console.log('No keywords found, using default topics');
      topKeywords.push('shopping deals', 'product reviews', 'buying guide');
    }

    // Generate 3 blog posts
    const posts = [];
    for (const keyword of topKeywords) {
      console.log(`Generating blog post for keyword: ${keyword}`);

      const prompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}" for an e-commerce shopping platform.

Requirements:
- Title: Compelling H1 title with the keyword (max 60 characters)
- Meta Description: 150-160 characters with the keyword
- Excerpt: 2-3 sentence summary (200 characters max)
- Content: 800-1000 words in markdown format with:
  * H2 and H3 subheadings with related keywords
  * Bullet points and numbered lists
  * Actionable shopping tips
  * Product recommendations
  * Natural keyword usage (not keyword stuffing)
- Additional Keywords: 5-7 related keywords as comma-separated list

Format your response as JSON:
{
  "title": "...",
  "meta_description": "...",
  "excerpt": "...",
  "content": "...",
  "keywords": ["keyword1", "keyword2", ...]
}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert SEO content writer specializing in e-commerce and product reviews. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        continue;
      }

      const aiData = await aiResponse.json();
      const generatedContent = aiData.choices[0].message.content;
      
      // Parse the JSON response
      let blogData;
      try {
        // Extract JSON if wrapped in markdown code blocks
        const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                         generatedContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedContent;
        blogData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        continue;
      }

      // Generate slug from title
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if post with this slug already exists
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingPost) {
        console.log(`Post with slug "${slug}" already exists, skipping`);
        continue;
      }

      posts.push({
        title: blogData.title,
        slug,
        content: blogData.content,
        excerpt: blogData.excerpt,
        seo_title: blogData.title,
        seo_description: blogData.meta_description,
        seo_keywords: blogData.keywords || [keyword],
        status: 'published',
      });
    }

    // Insert posts into database
    if (posts.length > 0) {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(posts)
        .select();

      if (error) {
        console.error('Error inserting posts:', error);
        throw error;
      }

      console.log(`Successfully created ${posts.length} blog posts`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          posts_created: posts.length,
          posts: data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, posts_created: 0, message: 'No new posts created' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-blog-posts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
