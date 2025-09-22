
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
  youtubeVideoId?: string; // YouTube video ID
}

export interface Purchase {
  id: string;
  amount: number;
  is_redeemed: boolean;
  message_source: string;
  original_sms: string;
  received_time: number;
  receiver_device: string;
  receiver_email: string;
  sender: string | null;
  sent_time: number;
  txn_id: string;
}

export interface SupportTicket {
    name: string;
    email: string;
    message: string;
    walletId?: string;
}

export interface Feature {
  id: string;
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

export interface Coupon {
    id: string; // The document ID (which is the coupon code)
    created: number;
    validity: number;
    code: string;
    coins: number;
    show_ads: boolean;
    type: 'single' | 'certain amount' | 'multiple';
    redeem_limit: number | null;
    redeem_count: number;
    note: string | null;
}
