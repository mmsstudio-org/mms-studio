
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Coupon } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { addCoupon, updateCoupon, getCoupon } from '@/lib/firestore-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters.').transform(val => val.toUpperCase()),
  coins: z.coerce.number().min(0),
  validity: z.date({ required_error: "A validity date is required."}),
  type: z.enum(['single', 'certain', 'multiple']),
  redeem_limit: z.coerce.number().positive().optional().or(z.literal('')),
  show_ads: z.boolean(),
  note: z.string().optional(),
}).refine(data => {
    if (data.type === 'certain') {
        return !!data.redeem_limit && Number(data.redeem_limit) > 0;
    }
    return true;
}, {
    message: 'Redeem limit is required for "certain" type.',
    path: ['redeem_limit'],
});

type CouponEditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  coupon: Coupon | null;
  mode: 'add' | 'edit' | 'clone';
  onCouponUpdate: () => void;
};

export default function CouponEditModal({ isOpen, onOpenChange, coupon, mode, onCouponUpdate }: CouponEditModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        code: '',
        coins: 0,
        validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        type: 'single',
        redeem_limit: '',
        show_ads: false,
        note: '',
    },
  });
  
  const couponType = form.watch('type');
  const modalTitle = mode === 'add' ? 'Create New Coupon' : mode === 'edit' ? 'Edit Coupon' : 'Clone Coupon';
  const isCodeDisabled = mode === 'edit';

  useEffect(() => {
    if(isOpen) {
        if (coupon) {
          form.reset({
            code: mode === 'clone' ? '' : coupon.code,
            coins: coupon.coins,
            validity: new Date(coupon.validity),
            type: coupon.type,
            redeem_limit: coupon.redeem_limit || '',
            show_ads: coupon.show_ads,
            note: coupon.note || '',
          });
        } else {
            form.reset({
                code: '',
                coins: 0,
                validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                type: 'single',
                redeem_limit: '',
                show_ads: false,
                note: '',
            });
        }
    }
  }, [coupon, mode, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Check for existing coupon on add/clone
    if (mode === 'add' || mode === 'clone') {
        const existingCoupon = await getCoupon(values.code);
        if (existingCoupon) {
            toast({
                variant: 'destructive',
                title: 'Coupon Exists',
                description: `A coupon with the code "${values.code}" already exists.`,
            });
            setIsSubmitting(false);
            return;
        }
    }

    const couponData = {
        code: values.code,
        coins: values.coins,
        validity: values.validity.getTime(),
        type: values.type,
        redeem_limit: values.type === 'certain' ? Number(values.redeem_limit) : null,
        show_ads: values.show_ads,
        note: values.note || null,
    };

    try {
        if (mode === 'edit' && coupon) {
            await updateCoupon(coupon.id, couponData);
            toast({ title: 'Coupon Updated'});
        } else {
            const finalData = {
                ...couponData,
                created: Date.now(),
                redeem_count: 0,
            };
            await addCoupon(finalData);
            toast({ title: 'Coupon Created' });
        }
        onCouponUpdate();
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving coupon:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>
            Fill in the details for the coupon. Document ID will be the coupon code.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
             <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., SUMMER24" {...field} disabled={isCodeDisabled} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="coins"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Coins</FormLabel>
                    <FormControl>
                       <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="validity"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Validity Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
             />

            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Type</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               <SelectItem value="single">Single</SelectItem>
                               <SelectItem value="certain">Certain Amount</SelectItem>
                               <SelectItem value="multiple">Multiple</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 {couponType === 'certain' && (
                    <FormField
                        control={form.control}
                        name="redeem_limit"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Usage Limit</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 10" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>

            <FormField
                control={form.control}
                name="show_ads"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Show Ads</FormLabel>
                        <FormDescription>
                           If enabled, ads will not be shown to user.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
            />

             <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Add a note for this coupon..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Coupon
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
