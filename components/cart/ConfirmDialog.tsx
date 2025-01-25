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

interface ConfirmDialogProps {
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: (open: boolean) => void;
  confirmAction: 'save' | 'cancel';
  handleConfirmAction: (customerData: { name: string; email: string }) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  confirmAction,
  handleConfirmAction,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmAction === 'save') {
      if (!name || !email) {
        alert('Please fill in all required fields');
        return;
      }
      handleConfirmAction({ name, email });
    } else {
      handleConfirmAction({ name: '', email: '' });
    }

    setName('');
    setEmail('');
    setIsConfirmDialogOpen(false);
  };

  return (
    <AlertDialog
      open={isConfirmDialogOpen}
      onOpenChange={setIsConfirmDialogOpen}
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
                : 'Are you sure you want to cancel this order? All changes will be lost.'}
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
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">
              {confirmAction === 'save' ? 'Confirm Order' : 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
