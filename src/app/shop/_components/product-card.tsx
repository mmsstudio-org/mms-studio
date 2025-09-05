import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { ShoppingCart, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type ProductCardProps = {
  product: Product;
  onPurchaseClick: () => void;
  onEditClick: () => void;
};

export default function ProductCard({ product, onPurchaseClick, onEditClick }: ProductCardProps) {
  const { user } = useAuth();
  
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:border-accent neon-glow h-full">
      <div className="relative w-full aspect-video">
        <Image
          src={product.imageUrl || 'https://picsum.photos/600/400'}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          data-ai-hint="digital product"
        />
      </div>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription className="flex-grow min-h-[40px]">{product.description}</CardDescription>
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
      <CardFooter className="mt-auto">
        {user ? (
           <Button className="w-full" onClick={onEditClick}>
             <Pencil className="mr-2 h-4 w-4" />
             Edit
           </Button>
        ) : (
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={onPurchaseClick}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
