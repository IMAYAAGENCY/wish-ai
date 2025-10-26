import { useState } from "react";
import { VoiceInput } from "@/components/VoiceInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ChatInterface } from "@/components/ChatInterface";
import { Sparkles, Search, TrendingUp, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProductSearch } from "@/hooks/useProductSearch";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { products, isLoading, searchProducts } = useProductSearch();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hi! I'm your AI shopping assistant. Tell me what you're looking for, and I'll find the perfect products for you! 🎁",
    },
  ]);

  const handleVoiceTranscript = (transcript: string) => {
    setSearchText(transcript);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      toast.error("Please enter or say what you're looking for");
      return;
    }
    setShowResults(true);
    await searchProducts(searchText);
  };

  const handleChatMessage = async (message: string) => {
    setMessages([
      ...messages,
      { role: "user", content: message },
      {
        role: "assistant",
        content: "Based on your request, I've found some great products for you! Check out the recommendations below.",
      },
    ]);
    setSearchText(message);
    setShowResults(true);
    await searchProducts(message);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
        
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass rounded-full">
              <Sparkles className="w-4 h-4 text-accent animate-glow-pulse" />
              <span className="text-sm">Powered by AI</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              WISH AI
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Your intelligent shopping companion. Speak or type what you need,
              <br />
              and let AI find the perfect products for you.
            </p>

            {/* Search Interface */}
            <div className="glass rounded-3xl p-8 max-w-2xl mx-auto glow-primary">
              <div className="flex items-center gap-4 mb-4">
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="What are you looking for?"
                  className="flex-1 h-14 text-lg glass border-border"
                />
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full gradient-primary glow-primary transition-smooth hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Find Products
                  </>
                )}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
              {[
                { icon: TrendingUp, label: "1M+ Products", color: "text-primary" },
                { icon: Zap, label: "AI Powered", color: "text-secondary" },
                { icon: Sparkles, label: "Instant Results", color: "text-accent" },
              ].map((stat, index) => (
                <div key={index} className="glass rounded-2xl p-4 transition-smooth hover:scale-105">
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-sm font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Products Section */}
          {showResults && (
            <div className="mb-20 animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Perfect Matches for You
              </h2>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <p className="text-xl text-muted-foreground">
                    No products found. Try searching for something else!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className="max-w-3xl mx-auto">
            <ChatInterface
              messages={messages}
              onSendMessage={handleChatMessage}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
