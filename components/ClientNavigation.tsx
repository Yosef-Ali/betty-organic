'use client';

import { CartIcon } from './CartIcon';

export function ClientNavigation() {
    return (
        <div className="flex items-center gap-4">
            {/* Cart Icon - shows when items are in cart */}
            <CartIcon />
        </div>
    );
}
