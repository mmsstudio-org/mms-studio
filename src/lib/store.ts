import type { AppDetail, Product } from './types';

// This file will be deprecated in favor of Firestore.
// For now, it provides mock data for UI development.

export const APPS: AppDetail[] = [
  {
    id: 'bcs',
    name: 'BCS',
    description: 'Explore exclusive subscription packages and coin packs for our BCS app.',
  },
  {
    id: 'bnc',
    name: 'BNC',
    description: 'Get the best deals on coin packs for the BNC application.',
  },
  {
    id: 'api',
    name: 'API',
    description: 'Purchase API credits and access tiers to power your applications.',
  },
];

export const PRODUCTS: Product[] = [
  // BCS Products
  {
    id: 'bcs_sub_monthly',
    appId: 'bcs',
    type: 'subscription',
    name: 'BCS Monthly Subscription',
    description: 'Unlock all premium features for one month. Auto-renews.',
    regularPrice: 1000,
    discountedPrice: 800,
    imageUrl: 'https://picsum.photos/600/400',
  },
  {
    id: 'bcs_sub_yearly',
    appId: 'bcs',
    type: 'subscription',
    name: 'BCS Yearly Subscription',
    description: 'Get 12 months for the price of 10. The best value for dedicated users.',
    regularPrice: 10000,
    imageUrl: 'https://picsum.photos/600/400',
  },
  {
    id: 'bcs_coins_100',
    appId: 'bcs',
    type: 'coins',
    name: '100 BCS Coins',
    description: 'A starter pack of 100 coins for in-app purchases.',
    regularPrice: 150,
    imageUrl: 'https://picsum.photos/600/400',
  },
  // BNC Products
  {
    id: 'bnc_sub_basic',
    appId: 'bnc',
    type: 'subscription',
    name: 'BNC Basic Plan',
    description: 'Access core features with our monthly basic plan.',
    regularPrice: 300,
    imageUrl: 'https://picsum.photos/600/400',
  },
  {
    id: 'bnc_coins_500',
    appId: 'bnc',
    type: 'coins',
    name: '500 BNC Coins',
    description: 'A large pack of 500 coins for our power users.',
    regularPrice: 500,
    discountedPrice: 450,
    imageUrl: 'https://picsum.photos/600/400',
  },
  {
    id: 'bnc_coins_1000',
    appId: 'bnc',
    type: 'coins',
    name: '1000 BNC Coins',
    description: 'The ultimate coin pack with 1000 coins for the ultimate experience.',
    regularPrice: 900,
    imageUrl: 'https://picsum.photos/600/400',
  },
  // API Products
  {
    id: 'api_tier_1',
    appId: 'api',
    type: 'coins', // API credits are treated as 'coins'
    name: 'API Tier 1 - 10k Credits',
    description: '10,000 API credits for small projects and hobbyists.',
    regularPrice: 2500,
    imageUrl: 'https://picsum.photos/600/400',
  },
  {
    id: 'api_tier_2',
    appId: 'api',
    type: 'coins',
    name: 'API Tier 2 - 100k Credits',
    description: '100,000 API credits for growing businesses and applications.',
    regularPrice: 20000,
    discountedPrice: 18000,
    imageUrl: 'https://picsum.photos/600/400',
  },
];

export const CONFIG = {
  bkash_qr_code_url: 'https://picsum.photos/200/200',
  bkash_number: '01782860266',
}
