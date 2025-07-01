'use client';

import { useUIStore } from '@/store/uiStore';
import { CartSheet } from '@/components/products/marcking-cart/CartSheet';

export function MarketingCartProvider({ children }: { children: React.ReactNode }) {
    const { isCartOpen, setCartOpen } = useUIStore();

    return (
        <>
            {children}
            {/* Global Cart Sheet for marketing pages */}
            <CartSheet isOpen={isCartOpen} onOpenChangeAction={setCartOpen} />
        </>
    );
}
