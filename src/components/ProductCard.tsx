import { ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  platform?: string;
  vendor?: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const platformColors: Record<string, string> = {
    amazon: 'bg-orange-500',
    admitad: 'bg-blue-500',
    clickbank: 'bg-green-500',
    shareasale: 'bg-purple-500',
    cj: 'bg-red-500',
    impact: 'bg-indigo-500',
    rakuten: 'bg-pink-500',
  };

  const platformColor = product.platform 
    ? platformColors[product.platform.toLowerCase()] || 'bg-gray-500'
    : 'bg-gray-500';

  return (
    <Card className="glass overflow-hidden group transition-smooth hover:scale-105 hover:glow-primary">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-smooth group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
          }}
        />
        {product.platform && (
          <div className={`absolute top-3 left-3 ${platformColor} text-white text-xs px-3 py-1 rounded-full font-semibold uppercase shadow-lg`}>
            {product.platform}
          </div>
        )}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 p-2 rounded-full glass transition-smooth hover:scale-110"
        >
          <Heart
            className={`w-5 h-5 transition-smooth ${
              isFavorite ? "fill-accent text-accent" : "text-foreground"
            }`}
          />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
          <span className="px-3 py-1 text-xs rounded-full glass text-secondary">
            {product.category}
          </span>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{product.name}</h3>
        {product.vendor && (
          <p className="text-xs text-muted-foreground mb-1">by {product.vendor}</p>
        )}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            {product.price}
          </span>
          <Button
            size="sm"
            className="gradient-primary glow-primary transition-smooth hover:scale-105"
            onClick={() => window.open(product.affiliateLink, "_blank")}
          >
            View Deal
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
