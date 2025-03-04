import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSalesCartStore } from '@/store/salesCartStore';

interface ConfirmDialogProps {
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: (open: boolean) => void;
  confirmAction: 'save' | 'cancel';
  handleConfirmAction: (action: 'save' | 'cancel', data?: { name: string; email: string }) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  confirmAction,
  handleConfirmAction,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { clearCart } = useSalesCartStore();

  const resetForm = () => {
    setName('');
    setEmail('');
    setIsConfirmDialogOpen(false);
  };

  const handleCancel = () => {
    if (confirmAction === 'cancel') {
      clearCart(); // This will clear both the state and localStorage
      handleConfirmAction('cancel');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sales-cart'); // Force remove from localStorage
      }
    }
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmAction === 'save') {
      if (!name || !email) {
        alert('Please fill in all required fields');
        return;
      }
      await handleConfirmAction('save', { name, email });
      resetForm();
    } else {
      handleCancel();
    }
  };

  return (
    <AlertDialog
      open={isConfirmDialogOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'save'
                ? 'Provide Your Details to Save'
                : 'Confirm Order Cancellation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'save'
                ? 'Please enter your name and email to proceed with the order'
                : 'Are you sure you want to cancel this order? All items will be removed from your cart.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction === 'save' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">
              {confirmAction === 'save' ? 'Confirm Order' : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
