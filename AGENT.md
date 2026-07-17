# MMS Studio Agent Guide & System Rules

This document provides complete, context-aware guidelines, schema references, and design system constraints for any AI Coding Agent working on the **MMS Studio** codebase.

---

## 1. Project Overview & Tech Stack
**MMS Studio** is a digital assets e-commerce platform built using:
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn UI
- **Database & Auth**: Firebase Firestore & Firebase Auth (managed client-side)
- **Deployment Platform**: Firebase App Hosting or Vercel

---

## 2. Directory Layout & Key Files

Here is the structure of the project's source code:

- [`src/app/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/): Main App Router routes.
  - [`(public)/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/): Publicly accessible customer-facing pages.
    - [`page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/page.tsx): Main homepage.
    - [`shop/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/shop/page.tsx): Shop index browsing active application categories.
    - [`shop/[slug]/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/shop/%5Bslug%5D/page.tsx): Product lists for a specific category.
    - [`login/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/login/page.tsx): Secure admin login portal.
  - [`dashboard/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/dashboard/): Admin panel pages.
    - [`categories/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/dashboard/categories/page.tsx): App category creation, editing, and management interface.
    - [`coupons/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/dashboard/coupons/page.tsx): Coupon creation, cloning, deletion, and bulk actions.
    - [`purchases/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/dashboard/purchases/page.tsx): Payment tracking, validation records, and batch deletions.
    - [`site-info/page.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/dashboard/site-info/page.tsx): Configuration of branding metadata and global configurations.
  - [`api/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/api/): API endpoints.
    - [`redeem/route.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/api/redeem/route.ts): Handles validating and updating usage counts for digital asset coupon codes.
- [`src/components/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/components/): Core component library.
  - [`ui/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/components/ui/): Shared Shadcn primitives.
- [`src/lib/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/): Architecture helpers & database services.
  - [`firebase.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/firebase.ts): Initializer of Firebase Client Apps, Auth, Analytics, and Firestore instances.
  - [`firestore-service.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/firestore-service.ts): **MANDATORY** repository file containing Firestore CRUD queries and operations. DO NOT query Firestore inline; append methods here instead.
  - [`types.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts): Main TypeScript data definitions.
- [`src/hooks/`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/hooks/): React Hooks.
  - [`use-auth.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/hooks/use-auth.tsx): Global state hook handling Firebase email/password authentication.
  - [`use-toast.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/hooks/use-toast.ts): Application-wide toast notifications.

---

## 3. Database Schema & Collections Reference

MMS Studio uses Firebase Firestore for data storage. All database operations are located in [`firestore-service.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/firestore-service.ts).

### Collections & Interfaces Map

1. **Products (`web-products`)**
   Defined by the [`Product`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts#L4) interface:
   ```typescript
   export interface Product {
     id?: string;
     appId: string; // References web-apps.id
     type: 'subscription' | 'coins';
     name: string;
     description?: string;
     regularPrice: number;
     discountedPrice?: number;
     imageUrl?: string;
     coinAmount?: number;
     subscriptionDays?: number;
   }
   ```

2. **Apps/Categories (`web-apps`)**
   Defined by the [`AppDetail`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts#L17) interface:
   ```typescript
   export interface AppDetail {
     id: string; // Firestore document ID
     name: string;
     description?: string;
     icon?: string; // URL or lucide-icon name
     youtubeVideoId?: string; // YouTube demo embedded identifier
     pkg?: string; // App package bundle name
   }
   ```

3. **Global Site Settings (`web-site-info`)**
   Single document with ID `'info'`. Defined by the [`SiteInfo`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts#L54) interface:
   ```typescript
   export interface SiteInfo {
     webName?: string;
     webDescription?: string;
     bkashNumber?: string;
     bkashQrCodeUrl?: string;
     paymentNotice?: string;
     githubUrl?: string;
     linkedinUrl?: string;
     xUrl?: string;
     instagramUrl?: string;
     whatsappUrl?: string;
     telegramUrl?: string;
     email?: string;
     youtubeUrl?: string;
     facebookUrl?: string;
     location?: string;
     contactNumber?: string;
     googleMapsUrl?: string;
     appAdsTxt?: string;
   }
   ```

4. **Features (`web-features`)**
   Homepage features cards. Defined by the [`Feature`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts#L47) interface:
   ```typescript
   export interface Feature {
     id: string;
     icon: string; // Lucide icon name
     title: string;
     description: string;
   }
   ```

5. **Purchases (`payment_sms`)**
   Saves purchases made via bKash. Defined by the [`Purchase`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts#L26) interface:
   ```typescript
   export interface Purchase {
     id: string; // Firestore document ID
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
   ```

6. **Coupons (`web-coupons`)**
   Document ID matches the coupon code. Defined by the [`Coupon`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts#L75) interface:
   ```typescript
   export interface Coupon {
     id: string; // Document ID / Coupon Code
     created: number; // Unix timestamp
     validity: number; // Unix timestamp
     code: string;
     coins: number;
     show_ads: boolean;
     type: 'single' | 'certain amount' | 'multiple';
     redeem_limit: number | null;
     redeem_count: number;
     note: string | null;
     pkg?: string; // Restricts coupon usage to a package name
   }
   ```

---

## 4. UI/UX Design System Constraints

When creating or modifying components, adhere to these guidelines to maintain a premium visual style.

- **Primary Brand Color**: Electric Indigo (`#6F00FF` / HSL `266 90% 56%`) - Futuristic neon aesthetics.
- **Accent Interactive Color**: Cyan (`#00FFFF` / HSL `180 90% 40%`) - Focus/active states and icons.
- **Background**: Dark Charcoal theme (`#1A1A1A` / HSL `240 10% 3.9%`). Uses a custom `.futuristic-bg` class with a dual primary-accent radial gradient.
- **Typography**:
  - Headings: `font-['Orbitron']` loaded dynamically.
  - Body: `font-['Inter']`.
- **Special Layout Styles**:
  - **Buttons**: Use `.futuristic-glowing-button-container` with animated rotating borders (`--angle` CSS properties) and high blur filters.
  - **Cards**: Use `.glass-card` (`backdrop-filter: blur(10px)` with high borders) to establish deep transparency levels.
  - **Floating Animations**: Use the `.animate-float` class for smooth vertical floating on key headers.

---

## 5. Main Functional Workflows

### Checkout & Payment Flow
1. Customer clicks purchase button on a product card ([`product-card.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/shop/_components/product-card.tsx)).
2. Opens ([`purchase-modal.tsx`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/shop/_components/purchase-modal.tsx)), displaying checkout info and local bKash payment options.
3. Customer inputs Transaction ID (`txn_id`) and billing numbers to register a new `Purchase` submission.
4. Record is written as a pending receipt (in `payment_sms`).
5. Admin reviews the payment in `dashboard/purchases` and issues corresponding coupons.

### Coupon Validation & Redeeming
- Handled at [`src/app/api/redeem/route.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/app/api/redeem/route.ts).
- Requests validate the coupon ID, validity timestamp, and matches `pkg` bounds if constrained.
- Handles BDT time zones (+6 hours calculation offset) before outputting the confirmation JSON payload.

---

## 6. Developer Guidelines for AI Agents

1. **Firestore Usage**:
   Never write raw Firebase queries inside page files. Instead, add or update abstractions within [`firestore-service.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/firestore-service.ts).
2. **Type Consistency**:
   Keep any extensions synchronized with [`types.ts`](file:///Volumes/AntiqueAPFS/a_projects/web/mms-studio/src/lib/types.ts). Always run `npm run typecheck` to catch compilation faults.
3. **Responsive Design**:
   When writing components, leverage tailwind's screen flags (`sm:`, `md:`, `lg:`) and use Shadcn responsive hooks (like `use-mobile` if absolute responsive adjustments are required).
4. **SEO Compliance**:
   For dynamic routes or key landing headers, make sure metadata titles/descriptions are either fetched from `getSiteInfo()` inside a client-side hook, or declared statically in `layout.tsx`.
5. **No Placeholders**:
   Generate mock images or load SVG assets dynamically if requested to add visuals. Avoid static lorem-ipsum values.

---

## 7. Command Reference

- Run Local Server: `npm run dev` (Starts locally on Port `9002`)
- Run Production Build: `npm run build`
- Run TypeScript Checker: `npm run typecheck`
- Run Eslint Verification: `npm run lint`
