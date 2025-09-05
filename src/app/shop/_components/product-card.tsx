import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { ShoppingCart } from 'lucide-react';

type ProductCardProps = {
  product: Product;
  onPurchaseClick: () => void;
};

export default function ProductCard({ product, onPurchaseClick }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:border-accent neon-glow">
      <div className="relative w-full h-48">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          data-ai-hint="digital product"
        />
      </div>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription className="h-10">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-baseline gap-2">
            {product.discountedPrice ? (
                <>
                    <span className="text-3xl font-bold text-accent">৳{product.discountedPrice}</span>
                    <span className="text-lg text-muted-foreground line-through">৳{product.regularPrice}</span>
                </>
            ) : (
                <span className="text-3xl font-bold">৳{product.regularPrice}</span>
            )}
        </div>
        {product.type === 'subscription' && (
            <p className="text-sm text-muted-foreground mt-1">per month</p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={onPurchaseClick}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase
        </Button>
      </CardFooter>
    </Card>
  );
}
