'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ProductSheetProps {
  children: ReactNode;
  title: string;
  triggerButton?: ReactNode;
  onClose?: () => void;
  open?: boolean;
}

export function ProductSheet({
  children,
  title,
  triggerButton,
  onClose,
  open: controlledOpen,
}: ProductSheetProps) {
  const [isOpen, setIsOpen] = useState(controlledOpen || false);

  // Update internal state when controlled open prop changes
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
    }
  }, [controlledOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {triggerButton}
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
