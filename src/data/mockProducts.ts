export const mockProducts = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    description: "Premium noise-cancelling headphones with 30-hour battery life and superior sound quality",
    price: "$89.99",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "2",
    name: "Smart Watch Series 8",
    description: "Advanced fitness tracking, heart rate monitoring, and smartphone notifications on your wrist",
    price: "$299.99",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "3",
    name: "4K Ultra HD Camera",
    description: "Professional photography camera with 24MP sensor and optical image stabilization",
    price: "$549.99",
    image_url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "4",
    name: "Gaming Laptop Pro",
    description: "High-performance gaming laptop with RTX graphics and 144Hz display",
    price: "$1,299.99",
    image_url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "5",
    name: "Portable Bluetooth Speaker",
    description: "Waterproof speaker with 360° sound and 12-hour playtime",
    price: "$59.99",
    image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "6",
    name: "Mechanical Gaming Keyboard",
    description: "RGB backlit mechanical keyboard with tactile switches for gaming",
    price: "$129.99",
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "7",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking and long battery life",
    price: "$34.99",
    image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "8",
    name: "Smart Home Hub",
    description: "Control all your smart devices with voice commands and automation",
    price: "$79.99",
    image_url: "https://images.unsplash.com/photo-1558089687-e1760b8c8f5a?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Electronics",
  },
  {
    id: "9",
    name: "Running Shoes Pro",
    description: "Lightweight running shoes with advanced cushioning technology",
    price: "$119.99",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Sports",
  },
  {
    id: "10",
    name: "Yoga Mat Premium",
    description: "Extra-thick yoga mat with non-slip surface for comfortable workouts",
    price: "$39.99",
    image_url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    affiliate_link: "#",
    category: "Sports",
  },
];

export const getMockProducts = (searchTerm?: string, category?: string) => {
  let filtered = [...mockProducts];
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }
  
  if (category) {
    filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  
  return filtered;
};
