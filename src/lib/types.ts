import { LucideIcon } from "lucide-react";

export interface Product {
  id?: string; // Optional for new products
  appId: 'bcs' | 'bnc' | 'api';
  type: 'subscription' | 'coins';
  name: string;
  description: string;
  regularPrice: number;
  discountedPrice?: number;
  imageUrl: string;
}

export interface AppDetail {
  id: 'bcs' | 'bnc' | 'api';
  name: string;
  description: string;
  icon?: LucideIcon;
}

export interface Purchase {
  id: string;
  product: Product;
  bkashTxnId: string;
  status: 'pending' | 'approved' | 'rejected';
  couponCode?: string;
  purchaseDate: string;
}

export interface SupportTicket {
    name: string;
    email: string;
    message: string;
    walletId?: string;
}
