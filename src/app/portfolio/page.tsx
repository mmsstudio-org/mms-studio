import PortfolioListClient from './_components/portfolio-list-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio | MMS Studio',
  description: 'Explore our latest application categories, custom web tools, mobile apps, and other software projects built by the MMS Studio team.',
  alternates: {
    canonical: '/portfolio',
  },
};

export default function PortfolioPage() {
  return <PortfolioListClient />;
}
