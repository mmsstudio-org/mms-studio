import { APPS, PRODUCTS } from '@/lib/store';
import { notFound } from 'next/navigation';
import ProductList from '../_components/product-list';

type ShopSlugPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  return APPS.map((app) => ({
    slug: app.id,
  }));
}

export default function ShopSlugPage({ params }: ShopSlugPageProps) {
  const { slug } = params;
  const app = APPS.find((app) => app.id === slug);

  if (!app) {
    notFound();
  }

  const appProducts = PRODUCTS.filter((product) => product.appId === slug);

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          {app.name} Store
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          {app.description}
        </p>
      </div>
      {appProducts.length > 0 ? (
        <ProductList products={appProducts} />
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No products available for this app yet.</p>
        </div>
      )}
    </div>
  );
}
