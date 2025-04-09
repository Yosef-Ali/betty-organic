import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { CustomerInfo } from './types';

interface ProfileUpdateFormProps {
    existingData: CustomerInfo;
    onSubmit: (profileData: { name: string; phone: string; address: string }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    userEmail: string | null;
}

export const ProfileUpdateForm = ({
    existingData,
    onSubmit,
    onCancel,
    isSubmitting,
    userEmail
}: ProfileUpdateFormProps) => {
    const [name, setName] = React.useState(existingData.name || '');
    const [phone, setPhone] = React.useState(existingData.phone || '');
    const [address, setAddress] = React.useState(existingData.address || '');
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\+?[0-9\s-]{6,}$/.test(phone.trim())) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!address.trim()) {
            newErrors.address = 'Delivery address is required';
        }

        setErrors(newErrors);

        // Submit if no errors
        if (Object.keys(newErrors).length === 0) {
            await onSubmit({
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim()
            });
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="space-y-2">
                <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle size={18} />
                    <h3 className="text-lg font-medium">Profile Update Required</h3>
                </div>
                <p className="text-sm text-gray-500">
                    Please complete your profile information to proceed with your order.
                </p>
                {userEmail && (
                    <p className="text-xs text-gray-500">
                        Account: {userEmail}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                        className={errors.address ? 'border-red-500' : ''}
                        rows={3}
                    />
                    {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                    </Button>
                </div>
            </form>
        </div>
    );
};