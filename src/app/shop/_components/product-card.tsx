import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { ShoppingCart, Pencil, Package, CircleDollarSign, CalendarDays, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type ProductCardProps = {
  product: Product;
  onPurchaseClick: () => void;
  onEditClick: () => void;
};

function formatSubscriptionDuration(days?: number) {
    if (!days) return null;
    if (days >= 365) {
        const years = Math.floor(days / 365);
        return `per ${years > 1 ? `${years} years` : 'year'}`;
    }
    if (days >= 30) {
        const months = Math.floor(days / 30);
        return `per ${months > 1 ? `${months} months` : 'month'}`;
    }
    return `for ${days} days`;
}

export default function ProductCard({ product, onPurchaseClick, onEditClick }: ProductCardProps) {
  const { user } = useAuth();
  
  const dataAiHint = product.type === 'subscription' ? 'subscription package' : 'coin package';
  const isCombo = product.type === 'subscription' && product.coinAmount && product.coinAmount > 0;

  const savedAmount = product.discountedPrice ? product.regularPrice - product.discountedPrice : 0;
  const savedPercentage = product.discountedPrice ? Math.round((savedAmount / product.regularPrice) * 100) : 0;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 h-full">
      <div
        className={cn(
          'relative w-full aspect-video flex items-center justify-center',
          !product.imageUrl && 'bg-gradient-to-br from-primary/10 via-background to-accent/10'
        )}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={dataAiHint}
          />
        ) : product.type === 'subscription' ? (
          <Package className="h-24 w-24 text-foreground/50" />
        ) : (
          <CircleDollarSign className="h-24 w-24 text-foreground/50" />
        )}
         {isCombo && <Badge variant="destructive" className="absolute top-2 right-2">Combo</Badge>}
      </div>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription className="flex-grow min-h-[40px] whitespace-pre-wrap">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-baseline gap-2">
            {product.discountedPrice && product.discountedPrice > 0 ? (
                <>
                    <span className="text-3xl font-bold text-accent">৳{product.discountedPrice}</span>
                    <span className="text-lg text-muted-foreground line-through">৳{product.regularPrice}</span>
                </>
            ) : (
                <span className="text-3xl font-bold">৳{product.regularPrice}</span>
            )}
        </div>
        {savedPercentage > 0 && (
            <Badge variant="secondary" className="mt-1">
                Save ৳{savedAmount.toFixed(0)} ({savedPercentage}%)
            </Badge>
        )}
        {product.type === 'subscription' && product.subscriptionDays && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {formatSubscriptionDuration(product.subscriptionDays)}
            </p>
        )}
        {product.coinAmount && product.coinAmount > 0 && (
            <p className={cn("text-sm font-bold text-amber-500 flex items-center gap-1", product.type === 'subscription' ? 'mt-1' : 'mt-2')}>
                <Sparkles className="h-4 w-4" />
                {product.coinAmount.toLocaleString()} Coins {product.type === 'subscription' && '(Bonus)'}
            </p>
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
