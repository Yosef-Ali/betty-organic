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
  handleConfirmAction: (data: { name: string; email: string }) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  handleConfirmAction,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setIsConfirmDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Please fill in all required fields');
      return;
    }
    await handleConfirmAction({ name, email });
    resetForm();
  };

  return (
    <AlertDialog
      open={isConfirmDialogOpen}
      onOpenChange={(open) => {
        if (!open) resetForm();
      }}
    >
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Your Order</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your details to proceed with the order
            </AlertDialogDescription>
          </AlertDialogHeader>

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

          <AlertDialogFooter>
            <AlertDialogAction type="submit">
              Complete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
