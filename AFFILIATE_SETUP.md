# Affiliate Network Integration Setup Guide

Your WISH AI app is now set up to integrate with **Amazon Associates** and **Admitad** affiliate networks! Here's what you need to know:

## 🎯 What's Been Set Up

1. **Database**: A `products` table to cache affiliate products
2. **Edge Functions**: 
   - `fetch-amazon-products` - Fetches products from Amazon Product Advertising API
   - `fetch-admitad-products` - Fetches products from Admitad API
   - `search-products` - Unified search endpoint that queries both networks
3. **Frontend Hook**: `useProductSearch` hook for easy product searching
4. **API Keys**: Secure storage for your affiliate credentials (already configured)

## 📋 Next Steps: Get Your API Credentials

### Amazon Associates (Product Advertising API)

1. **Sign up for Amazon Associates**: 
   - Go to https://affiliate-program.amazon.com/
   - Create an account and get approved

2. **Get Product Advertising API credentials**:
   - Visit https://webservices.amazon.com/paapi5/documentation/
   - Apply for Product Advertising API 5.0 access
   - You'll receive:
     - Access Key ID
     - Secret Access Key
     - Associate Tag (Partner Tag)

3. **Update your credentials**:
   - The secrets are already set up in your backend
   - You just need to update them with your real credentials
   - Contact support or update them through your Lovable Cloud backend

### Admitad Aggregator

1. **Sign up for Admitad**:
   - Go to https://www.admitad.com/
   - Create a publisher account

2. **Get API credentials**:
   - Go to your Admitad dashboard
   - Navigate to Tools > API
   - Create OAuth credentials
   - You'll receive:
     - Client ID
     - Client Secret

3. **Update your credentials**:
   - The secrets are already set up
   - Update them with your real Admitad credentials

## 🚀 How It Works

1. **User searches** for products via the search bar or voice input
2. **Frontend** calls the `search-products` edge function
3. **Backend** checks the database first for cached products
4. If no products found, it **fetches from both affiliate networks** in parallel
5. Products are **stored in the database** for faster future searches
6. **Results are displayed** to the user with affiliate links

## 💡 Current Status

- ✅ Database structure created
- ✅ Edge functions deployed
- ✅ Frontend integrated
- ✅ Secret storage configured
- ⏳ Waiting for real API credentials

Once you add your real API credentials, the app will start fetching live products from Amazon and Admitad!

## 🔧 Testing

To test the integration:

1. Add your API credentials
2. Try searching for products like "headphones", "laptop", or "camera"
3. Check the console logs in your edge functions for debugging
4. Products should appear with real images, prices, and affiliate links

## 📝 Notes

- The Amazon API implementation includes AWS Signature V4 authentication structure
- Products are cached in the database to reduce API calls
- Both networks are queried in parallel for faster results
- Error handling is built in to gracefully handle API failures

## 🎨 Customization

You can customize:
- Product categories in the search
- Number of products returned (currently 20)
- Caching strategy
- UI display of products

<lov-actions>
  <lov-open-backend>View Your Backend</lov-open-backend>
</lov-actions>
