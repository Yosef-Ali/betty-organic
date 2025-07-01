'use client';

import { ShoppingCart, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketingCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { formatOrderCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function CartIcon() {
    const { items, getTotalAmount } = useMarketingCartStore();
    const { setCartOpen } = useUIStore();
    const { user } = useAuth();

    const itemCount = items?.length || 0;
    const totalAmount = getTotalAmount();

    // Don't show the cart icon if there are no items
    if (itemCount === 0) {
        return null;
    }

    const handleCartClick = () => {
        setCartOpen(true);
    };

    const isGuestUser = !user;

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="icon"
                onClick={handleCartClick}
                className="relative bg-black text-white border-black hover:bg-gray-800 hover:text-white dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200 dark:hover:text-black"
                title={`Cart: ${itemCount} items - ${formatOrderCurrency(totalAmount)}${isGuestUser ? ' • Sign in for faster checkout' : ''}`}
            >
                <ShoppingCart className="h-4 w-4" />
                <Badge
                    variant="secondary"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs font-bold bg-green-500 text-black border-0 flex items-center justify-center dark:bg-green-400 dark:text-black"
                >
                    {itemCount}
                </Badge>

                {/* Guest user indicator */}
                {isGuestUser && (
                    <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <UserPlus className="w-2 h-2 text-white" />
                    </div>
                )}
            </Button>
        </div>
    );
}
