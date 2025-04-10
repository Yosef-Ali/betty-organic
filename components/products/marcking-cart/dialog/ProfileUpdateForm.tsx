import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShoppingBag } from 'lucide-react';
import { CustomerInfo } from './types';

interface ProfileUpdateFormProps {
    existingData: CustomerInfo;
    onSubmit: (profileData: { address: string }) => Promise<void>;
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
    const [address, setAddress] = React.useState(existingData.address || '');
    const [error, setError] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!address.trim()) {
            setError('Please provide a delivery address');
            return;
        }

        await onSubmit({
            address: address.trim()
        });
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="text-center mb-2">
                <div className="flex justify-center mb-2">
                    <ShoppingBag size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Almost done!</h3>
                <p className="text-sm text-gray-500">
                    Just need your delivery address to complete the order
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <Label htmlFor="address" className="text-sm">Delivery Address</Label>
                    <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Where should we deliver your order?"
                        rows={2}
                        className="mt-1"
                    />
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>

                <div className="flex justify-center pt-2">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? 'Processing...' : 'Complete Order'}
                    </Button>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Back to Cart
                    </button>
                </div>
            </form>
        </div>
    );
};