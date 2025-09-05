# **App Name**: MMS Studio Landing

## Core Features:

- Landing Page: Displays an overview of MMS Studio, with links to the shop and help center.
- Shop Routes: Sets up routes for /shop, /shop/bcs, /shop/bnc, /shop/api.
- Product Display: Displays products with support for regularPrice and discountedPrice (strikethrough).
- Purchase Modal: Collects bKash Txn ID, writes purchases (pending) to Firestore.
- Help Center Modal: A modal to display contact information and the contact form and Web3 wallet ID which get saved to support_tickets.
- Admin Verification Flow: Simple admin UI for manual verification and coupon code issuance.
- AI Page Generation Tool: Using provided text and images, the tool generates a static marketing landing page and predicts which of the existing layouts on our page would fit best.

## Style Guidelines:

- Primary color: Electric Indigo (#6F00FF) to capture the futuristic style.
- Background color: Dark charcoal (#1A1A1A) to complement the neon gradients.
- Accent color: Cyan (#00FFFF) for highlights and interactive elements.
- Body and headline font: 'Inter' (sans-serif) for a professional and clean aesthetic. Note: currently only Google Fonts are supported.
- Use a set of minimalist, geometric icons in cyan to maintain a futuristic feel.
- Implement a grid-based layout with ample negative space to enhance readability and visual appeal.
- Subtle neon glow animations on hover effects to add depth and interactivity.