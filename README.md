# [MMS Studio](https://mmsstudio.vercel.app) - Digital Asset E-Commerce Platform

MMS Studio is a modern, full-stack e-commerce application designed for selling digital products, such as software subscriptions and in-app currencies. It features a complete administrative dashboard for managing products and sales, and a seamless, automated payment verification system for customers.

## Key Features

### Customer-Facing
- **Modern Homepage**: A dynamic landing page showcasing services, key features, and a link to a professional portfolio.
- **Digital Product Shop**: Browse products organized by application categories. Each product is displayed on a sleek, modern card with pricing and details.
- **Automated bKash Payments**: A streamlined purchase process where customers pay via bKash and use their bKash Transaction ID (TxnID) for verification.
- **Instant Coupon Generation**: Upon successful payment verification, the system automatically generates a coupon code (using the TxnID) for the user to redeem their purchase.
- **Responsive Design**: A fully responsive interface that works seamlessly on desktop and mobile devices.
- **Help Center**: A built-in contact form for customer support inquiries.

### Administrative Dashboard
- **Secure Admin Login**: An email and password-based authentication system protects the admin dashboard.
- **Site Information Management**: Easily update the website's name, description, features, and critical API credentials from the dashboard.
- **Category & Product Management**: Admins can create, edit, and delete application categories and the products within them (both subscriptions and coin packs).
- **Purchase Management**: A centralized view to monitor all pending, approved, and rejected customer purchases.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components for a modern, consistent look.
- **Backend & Database**: Firebase (Firestore) for data storage.
- **Authentication**: Firebase Authentication for the admin dashboard.
- **Deployment**: Configured for deployment on modern hosting platforms.

## Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mmsstudio-org/mms-studio.git
    cd mms-studio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Firebase configuration details. You can get these from your Firebase project settings.

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
    ```

### Running the Development Server

To start the local development server, run:
```bash
npm run dev
```
Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## Project Structure

- `src/app/`: Contains all the pages and routes for the application, following the Next.js App Router convention.
  - `(admin)/dashboard/`: Protected routes for the admin dashboard.
  - `(public)/`: Publicly accessible routes like the homepage, shop, etc.
  - `api/`: API routes for server-side proxy requests.
- `src/components/`: Shared React components, including UI elements from ShadCN.
- `src/lib/`: Core application logic, including Firebase services (`firestore-service.ts`) and type definitions.
- `src/hooks/`: Custom React hooks for authentication and other functionalities.
