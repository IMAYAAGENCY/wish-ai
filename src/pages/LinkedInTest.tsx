import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LinkedInTest = () => {
  const [postText, setPostText] = useState("🚀 Exciting product update! Check out our latest features that help you discover amazing products with AI-powered search. #ProductUpdate #Innovation");
  const [authorUrn, setAuthorUrn] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const navigate = useNavigate();

  const handlePost = async () => {
    if (!postText.trim()) {
      toast.error("Please enter some text for your post");
      return;
    }

    setIsPosting(true);
    console.log("Posting to LinkedIn...");

    try {
      const { data, error } = await supabase.functions.invoke('post-to-linkedin', {
        body: { 
          text: postText,
          authorUrn: authorUrn || undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Successfully posted to LinkedIn!");
        console.log("Post ID:", data.postId);
      } else {
        throw new Error(data.error || "Failed to post to LinkedIn");
      }
    } catch (error) {
      console.error("Error posting to LinkedIn:", error);
      toast.error(error instanceof Error ? error.message : "Failed to post to LinkedIn");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Linkedin className="w-8 h-8 text-[#0A66C2]" />
              <div>
                <CardTitle className="text-2xl">LinkedIn Post Test</CardTitle>
                <CardDescription>Test posting product updates to your LinkedIn profile</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="authorUrn" className="text-sm">
                Author URN (Optional)
              </Label>
              <Input
                id="authorUrn"
                placeholder="urn:li:person:YOUR_PERSON_ID"
                value={authorUrn}
                onChange={(e) => setAuthorUrn(e.target.value)}
                className="glass"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default profile associated with the access token
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postText" className="text-sm">
                Post Content
              </Label>
              <Textarea
                id="postText"
                placeholder="What would you like to share?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="glass min-h-[200px]"
                maxLength={3000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {postText.length} / 3000 characters
              </p>
            </div>

            <Button
              onClick={handlePost}
              disabled={isPosting || !postText.trim()}
              className="w-full"
              size="lg"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Post to LinkedIn
                </>
              )}
            </Button>

            <div className="glass rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Setup Instructions:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create a LinkedIn App at developers.linkedin.com</li>
                <li>Request the "w_member_social" permission</li>
                <li>Generate an access token with proper scopes</li>
                <li>Add the token to your secrets (already configured)</li>
                <li>Optionally, get your Person URN from LinkedIn API</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedInTest;
