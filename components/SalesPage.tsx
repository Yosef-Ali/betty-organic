'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useSalesCartStore, SalesCartItem } from '@/store/salesCartStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGrid } from './ProductGrid';
import { SalesHeader } from './SalesHeader';
import { SalesCartSheet } from './cart/SalesCartSheet';
import { getProducts } from '@/app/actions/productActions';
import { toast, useToast } from '@/hooks/use-toast';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { User } from '@/types/user';
import { SalesPageSkeleton } from './sales/SalesPageSkeleton';
// Import ProductCategory enum correctly
import type { Database } from '@/types/supabase';
type ProductCategory = Database['public']['Enums']['product_category'];
import { RecentSalesOrders } from './sales/RecentSalesOrders';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  active: boolean;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAPIResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  active: boolean | null;
  total_sales: number;
  createdat: string;
  updated_at: string;
}

export interface ProductWithStatus extends Product {
  status: 'Available' | 'Out of Stock';
}

interface SalesPageProps {
  user: {
    id: string;
    user_metadata: {
      full_name?: string;
    };
    email?: string;
    profile: {
      id: string;
      role: string;
    };
    isAdmin: boolean;
  };
}

const SalesPage: FC<SalesPageProps> = ({ user }) => {
  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [recentlySelectedProducts, setRecentlySelectedProducts] = useState<ProductWithStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products"); // Add state for active tab
  
  // Debug tab changes
  const handleTabChange = useCallback((value: string) => {
    console.log('🔄 [SalesPage] Tab changed to:', value);
    setActiveTab(value);
  }, []);
  const { items, addItem } = useSalesCartStore();
  const { toast } = useToast();

  const handleCartOpenChange = useCallback((open: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access the cart',
        variant: 'destructive',
      });
      return;
    }
    setIsCartOpen(open);
  }, [user, toast]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProducts = await getProducts();
      const productsWithStatus = allProducts.map(
        (p): ProductWithStatus => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price ?? 0,
          stock: p.stock ?? 0,
          imageUrl: p.imageUrl || '/placeholder-product.svg',
          category: p.category || 'Uncategorized',
          active: p.active ?? true,
          totalSales: p.totalsales ?? 0,
          createdAt: p.createdat || new Date().toISOString(),
          updatedAt: p.updatedat || new Date().toISOString(),
          status: (p.stock ?? 0) > 0 ? 'Available' : 'Out of Stock',
        }),
      );

      setProducts(
        productsWithStatus
          .filter(p => p.active !== false)
          .filter(p => p.status === 'Available'),
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductClick = useCallback((product: ProductWithStatus) => {
    const cartItem: SalesCartItem = {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl || '/placeholder-product.svg',
      pricePerKg: product.price,
      grams: product.stock > 0 ? 1000 : 100,
      unit: 'kg',
    };

    addItem(cartItem);

    setRecentlySelectedProducts(prev => {
      const alreadySelected = prev.some(p => p.id === product.id);
      if (alreadySelected) return prev;
      return [...prev, product];
    });

    setIsCartOpen(true);
  }, [addItem]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: ProductCategory) => {
    setSelectedCategory(category);
    toast({
      title: 'Category Updated',
      description: `Showing ${category.replace(/_/g, ' ')} products`,
    });
  }, [toast]); const handleCreateOrder = useCallback(
    async (orderData: any): Promise<boolean> => {
      try {
        console.log('[SALES-PAGE] Received order data:', JSON.stringify(orderData, null, 2));

        if (!user) {
          toast({
            title: 'Authentication required',
            description: 'Please log in to create an order',
            variant: 'destructive',
          });
          return false;
        }

        // Extract items from the order data, with multiple fallbacks
        let orderItems = [];

        // First check for items array (from CartFooter)
        if (Array.isArray(orderData.items) && orderData.items.length > 0) {
          console.log('[SALES-PAGE] Using items array from order data');
          orderItems = orderData.items.map((item: { product_id?: string; id?: string; product_name?: string; name?: string; quantity?: number; price?: number }) => ({
            product_id: item.product_id || item.id || '',
            product_name: item.product_name || item.name || '',
            quantity: item.quantity || 1000, // Default to 1kg if not specified
            price: item.price || 0
          }));
        }
        // Then try order_items array (alternative format)
        else if (Array.isArray(orderData.order_items) && orderData.order_items.length > 0) {
          console.log('[SALES-PAGE] Using order_items array from order data');
          orderItems = orderData.order_items.map((item: { product_id: string; product_name: string; quantity: number; price: number }) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price
          }));
        }
        // Finally, if no valid items, return error
        else {
          console.error('[SALES-PAGE] No valid items found in order data');
          toast({
            title: 'Invalid order',
            description: 'No items found in order',
            variant: 'destructive',
          });
          return false;
        }

        // Extract customer ID with fallbacks
        const customerId = orderData.customer_profile_id ||
          (orderData.customer && orderData.customer.id) ||
          user.id;

        // Extract total amount with fallbacks
        const calculatedItemsTotal = orderItems.reduce((sum: number, item: { price?: number }) => sum + (item.price || 0), 0);

        // Extract delivery cost and discount
        const deliveryCost = Number(orderData.delivery_cost || orderData.deliveryCost || 0);
        const couponCode = orderData.coupon_code || null;
        const discountAmount = orderData.discount_amount || 0;

        // Calculate the final total amount including delivery and discount
        const finalTotalAmount = calculatedItemsTotal + deliveryCost - discountAmount;

        console.log('[SALES-PAGE] Calculated totals:', {
          itemsTotal: calculatedItemsTotal,
          deliveryCost,
          discountAmount,
          finalTotal: finalTotalAmount,
          providedTotal: orderData.total_amount || orderData.totalAmount
        });

        // Extract status with fallback
        const status = orderData.status || 'completed';

        console.log('[SALES-PAGE] Formatted order data:', {
          orderItems,
          customerId,
          totalAmount: finalTotalAmount,
          deliveryCost,
          couponCode,
          discountAmount,
          originalTotal: calculatedItemsTotal, // Use calculatedItemsTotal instead of the removed totalAmount
          status
        });

        // Call the server-side action to create the order
        // Add request throttling/batching to reduce database operations
        const cachedOrders = localStorage.getItem('pendingOrders');
        const pendingOrders = cachedOrders ? JSON.parse(cachedOrders) : [];

        // If in offline mode or we're batching orders, store locally first
        if (pendingOrders.length > 0 || (window.navigator && !navigator.onLine)) {
          // Store order locally
          pendingOrders.push({
            items: orderItems,
            customerId,
            totalAmount: finalTotalAmount,
            status,
            deliveryCost, // Add deliveryCost to pending orders
            couponCode,   // Add couponCode to pending orders
            discountAmount, // Add discountAmount to pending orders
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));

          // Return simulated success response when offline
          if (window.navigator && !navigator.onLine) {
            console.log('[SALES-PAGE] Offline mode - order saved locally');
            toast({
              title: 'Order saved locally',
              description: `Order will be synced when you're back online`,
            });
            return true; // Return boolean as required by the function signature
          }
        }

        // Log the parameters being sent to createOrder for debugging
        console.log('[SALES-PAGE] Creating order with params:', {
          orderItems, customerId, finalTotalAmount, status,
          deliveryCost, couponCode, discountAmount
        });

        const response = await createOrder(
          orderItems,
          customerId,
          finalTotalAmount,
          status,
          deliveryCost, // Pass deliveryCost
          couponCode,   // Pass couponCode
          discountAmount // Pass discountAmount
        );

        console.log('[SALES-PAGE] Order creation response:', response);

        if (response.success) {
          toast({
            title: 'Order created successfully',
            description: `Order #${response.order?.display_id || response.order?.id || 'unknown'} has been created`,
          });

          // Clear the cart but don't close the sheet automatically
          // Let the CartFooter receipt modal handle the user flow
          useSalesCartStore.getState().clearCart();
          // setIsCartOpen(false); // REMOVED: Let user close manually after viewing receipt
          return true;
        } else {
          // Handle the case where response indicates failure
          console.error('[SALES-PAGE] Order creation failed:', response.error);
          toast({
            title: 'Failed to create order',
            description: response.error || 'Unknown error occurred',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        console.error('Unexpected error during order creation:', err);
        toast({
          title: 'Error creating order',
          description:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, toast],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <SalesHeader
        cartItemCount={items.length}
        onCartClickAction={() => handleCartOpenChange(true)}
        selectedCategory={selectedCategory}
        onCategoryChangeAction={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChangeAction={handleSearchChange}
        showCategoryTabs={false} // Hide category tabs from header as we'll move them inline
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-grow p-4">
        <div className="space-y-3 mb-4">
          {/* Main tabs */}
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Category tabs - moved to new line on mobile */}
          {activeTab === "products" && (
            <div className="w-full">
              <Tabs value={selectedCategory} onValueChange={(value) => handleCategoryChange(value as ProductCategory)}>
                <ScrollArea className="w-full">
                  <TabsList className="inline-flex w-max min-w-full">
                    {["All", "Spices_Oil_Tuna", "Flowers", "Vegetables", "Fruits", "Herbs_Lettuce", "Dry_Stocks_Bakery", "Eggs_Dairy_products"].map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm whitespace-nowrap"
                      >
                        {category.replace(/_/g, ' ')}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" className="h-2 mt-1" />
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </div>
        
        <TabsContent value="products" className="m-0">
          {isLoading ? (
            <SalesPageSkeleton />
          ) : (
            <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
          )}
        </TabsContent>
        <TabsContent value="orders" className="m-0">
          <RecentSalesOrders userId={user.id} limit={10} />
        </TabsContent>
      </Tabs>
      <SalesCartSheet
        isOpen={isCartOpen}
        onOpenChange={handleCartOpenChange}
        onOrderCreate={handleCreateOrder}
        user={user}
      />
    </div>
  );
};

export default SalesPage;
