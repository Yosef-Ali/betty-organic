import { FC, useState } from 'react';
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
  confirmAction: 'save' | 'cancel' | null;
  handleConfirmAction: (
    action: 'save' | 'cancel',
    customerData?: { name: string; email: string },
  ) => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  confirmAction,
  handleConfirmAction,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '' });

  const validateForm = () => {
    const newErrors = { name: '', email: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  return (
    <AlertDialog
      open={isConfirmDialogOpen}
      onOpenChange={open => {
        if (!open) {
          setName('');
          setEmail('');
          setErrors({ name: '', email: '' });
        }
        setIsConfirmDialogOpen(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirmAction === 'save'
              ? 'Confirm Save Order'
              : 'Confirm Cancel Order'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmAction === 'save' ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="name"
                      required
                      className={errors.name ? 'border-red-500' : ''}
                      value={name}
                      onChange={e => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="email"
                      type="email"
                      required
                      className={errors.email ? 'border-red-500' : ''}
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              'Are you sure you want to cancel this order? All changes will be lost.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (confirmAction === 'save') {
                if (validateForm()) {
                  handleConfirmAction('save', { name, email });
                  setName('');
                  setEmail('');
                  setErrors({ name: '', email: '' });
                }
              } else {
                handleConfirmAction('cancel');
              }
            }}
          >
            {confirmAction === 'save' ? 'Save Order' : 'Yes, Cancel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
