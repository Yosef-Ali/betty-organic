'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { createAccountFromGuestOrder } from '@/app/actions/guestConversionActions';
import { toast } from 'sonner';
import { LogIn, Mail, User, Phone, MapPin, Loader } from 'lucide-react';

interface CreateAccountDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    guestOrderData: {
        name: string;
        phone: string;
        address: string;
        orderId?: string;
    };
    onAccountCreated?: (user: { id: string; email: string; name: string }) => void;
}

export function CreateAccountDialog({
    isOpen,
    onOpenChange,
    guestOrderData,
    onAccountCreated,
}: CreateAccountDialogProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const result = await createAccountFromGuestOrder({
                name: guestOrderData.name,
                phone: guestOrderData.phone,
                email,
                address: guestOrderData.address,
                orderId: guestOrderData.orderId,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.success && result.user) {
                toast.success('Account created successfully! You can now track your orders.');
                onAccountCreated?.(result.user);
                onOpenChange(false);

                // Redirect to login or dashboard
                window.location.href = '/auth/login?message=account_created';
            }
        } catch (error) {
            console.error('Account creation error:', error);
            toast.error('Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-green-600" />
                        Create Your Account
                    </DialogTitle>
                    <DialogDescription>
                        Create an account to track your order and enjoy faster checkout in the future.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Pre-filled info display */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="text-sm text-muted-foreground">Your order details:</div>
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="w-3 h-3" />
                                {guestOrderData.name}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {guestOrderData.phone}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {guestOrderData.address}
                            </div>
                            {guestOrderData.orderId && (
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 flex items-center justify-center bg-green-600 text-white rounded-full text-xs">#</span>
                                    Order: {guestOrderData.orderId}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email input */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password input */}
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Password * (minimum 6 characters)
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Confirm password input */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            Confirm Password *
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Benefits reminder */}
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                            Account Benefits:
                        </div>
                        <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                            <li>• Track your current and future orders</li>
                            <li>• Faster checkout with saved details</li>
                            <li>• Order history and receipts</li>
                            <li>• Exclusive member offers</li>
                        </ul>
                    </div>

                    <DialogFooter className="flex flex-col gap-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !email || !password || !confirmPassword}
                            className="w-full gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Create Account
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="w-full"
                        >
                            Maybe Later
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
