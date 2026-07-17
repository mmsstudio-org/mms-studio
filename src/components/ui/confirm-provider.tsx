'use client';

import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

export type ConfirmOptions = {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

type ConfirmContextType = (options: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: 'Please confirm',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  });

  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = (optionsOrMessage: string | ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      if (typeof optionsOrMessage === 'string') {
        setOptions({
          title: 'Please confirm',
          description: optionsOrMessage,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'default',
        });
      } else {
        setOptions({
          title: optionsOrMessage.title ?? 'Please confirm',
          description: optionsOrMessage.description,
          confirmText: optionsOrMessage.confirmText ?? 'Confirm',
          cancelText: optionsOrMessage.cancelText ?? 'Cancel',
          variant: optionsOrMessage.variant ?? 'default',
        });
      }
      setOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = undefined;
    }
    setOpen(false);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = undefined;
    }
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      if (resolveRef.current) {
        resolveRef.current(false);
        resolveRef.current = undefined;
      }
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="border-indigo-500/20 bg-background/95 backdrop-blur-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl tracking-wide">
              {options.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm font-body mt-2">
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel 
              onClick={handleCancel}
              className="border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white font-body"
            >
              {options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              // Dynamically apply correct button variants to match design preferences
              className={
                options.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body'
                  : 'bg-primary hover:bg-primary/90 text-white font-body border border-indigo-500/30'
              }
            >
              {options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
