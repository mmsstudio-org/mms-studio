import { LucideIcon } from "lucide-react";

export interface Product {
  id?: string; // Optional for new products
  appId: string;
  type: 'subscription' | 'coins';
  name: string;
  description?: string;
  regularPrice: number;
  discountedPrice?: number;
  imageUrl?: string;
  coinAmount?: number;
  subscriptionDays?: number;
}

export interface AppDetail {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  icon?: string; // URL to an icon or a lucide-icon name
}

export interface Purchase {
  id?: string;
  productId: string;
  productName: string;
  productPrice: number;
  bkashTxnId: string;
  status: 'pending' | 'approved' | 'rejected';
  purchaseDate: any; // Firestore Timestamp
}

export interface SupportTicket {
    name: string;
    email: string;
    message: string;
    walletId?: string;
}

export interface Feature {
  id?: string;
  icon: string; // Lucide icon name as string
  title: string;
  description: string;
}

export interface SiteInfo {
  webName?: string;
  webDescription?: string;
  bkashNumber?: string;
  bkashQrCodeUrl?: string;
}
