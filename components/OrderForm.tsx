'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createOrder, updateOrder } from '@/app/actions/orderActions';
import { Customer, Product, Order, OrderItem } from '@/types'; // Import types from types folder

interface OrderFormProps {
  customers: Customer[];
  products: Product[];
  initialData?: Order;
}

export function OrderForm({ customers, products, initialData }: OrderFormProps) {
  const [orderItems, setOrderItems] = useState<Omit<OrderItem, 'id' | 'orderId' | 'product'>[]>(
    initialData?.items?.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    })) || [{ productId: '', quantity: 1, price: 0 }] // Provide default order item if items are undefined
  );
  const router = useRouter();

  useEffect(() => {
    // Update prices when product selection changes
    setOrderItems(prevItems =>
      prevItems.map(item => ({
        ...item,
        price: products.find(p => p.id === item.productId)?.price || 0
      }))
    );
  }, [products]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('items', JSON.stringify(orderItems));

    if (initialData) {
      await updateOrder(initialData.id, formData);
    } else {
      await createOrder(formData);
    }

    router.refresh();
    if (initialData) {
      router.push('/orders');
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, price: 0 }]);
  };

  const updateOrderItem = (index: number, field: keyof Omit<OrderItem, 'id' | 'orderId' | 'product'>, value: string | number) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === 'productId') {
      updatedItems[index].price = products.find(p => p.id === value)?.price || 0;
    }
    setOrderItems(updatedItems);
  };

  const calculateTotalAmount = () =>
    orderItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
        <Select name="customerId" defaultValue={initialData?.customerId || ''}>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.full_name}</option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <Input name="status" defaultValue={initialData?.status || 'pending'} />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Order Items</h3>
        {orderItems.map((item, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <Select
              value={item.productId}
              onValueChange={(value) => updateOrderItem(index, 'productId', value)}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </Select>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
              min="1"
            />
            <Input
              type="number"
              value={item.price}
              readOnly
              className="bg-gray-100"
            />
          </div>
        ))}
        <Button type="button" onClick={addOrderItem}>Add Item</Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
        <Input
          type="number"
          value={calculateTotalAmount().toFixed(2)}
          readOnly
          className="bg-gray-100"
        />
      </div>

      <Button type="submit">{initialData ? 'Update Order' : 'Create Order'}</Button>
    </form>
  );
}
