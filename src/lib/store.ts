import type { AppDetail, Product } from './types';
import { Smartphone, MessageSquare, Code } from 'lucide-react';

// This file will be deprecated in favor of Firestore.
// For now, it provides mock data for UI development.

export const APPS: AppDetail[] = [
  {
    id: 'bcs',
    name: 'বিসিএস প্রশ্ন ব্যাংক ও সমাধান',
    description: 'Explore exclusive subscription packages and coin packs for our BCS app.',
    icon: Smartphone,
  },
  {
    id: 'bnc',
    name: 'বাংলা স্ট্যাটাস ও ক্যাপশন',
    description: 'Get the best deals on coin packs for the BNC application.',
    icon: MessageSquare,
  },
  {
    id: 'api',
    name: 'API',
    description: 'Purchase API credits and access tiers to power your applications.',
    icon: Code,
  },
];

// This will be replaced by firestore calls
export const PRODUCTS: Product[] = [];

export const CONFIG = {
  bkash_qr_code_url: 'https://picsum.photos/200/200',
  bkash_number: '01782860266',
}
