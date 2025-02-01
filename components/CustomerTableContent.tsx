"use client";

import { useState } from 'react';
import { type CustomerWithOrders } from '@/types/customer';
import CustomerRow from './CustomerRow';

interface CustomerTableContentProps {
  customers: CustomerWithOrders[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}

const CustomerTableContent = ({ customers, isLoading, onDelete }: CustomerTableContentProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        {/* Mobile loading state */}
        <div className="block sm:hidden py-4 text-center">
          Loading...
        </div>
        {/* Desktop loading state */}
        <tr className="hidden sm:table-row">
          <td colSpan={7} className="h-24 text-center">
            Loading...
          </td>
        </tr>
      </>
    );
  }

  if (customers.length === 0) {
    return (
      <>
        {/* Mobile empty state */}
        <div className="block sm:hidden py-4 text-center">
          No customers found.
        </div>
        {/* Desktop empty state */}
        <tr className="hidden sm:table-row">
          <td colSpan={7} className="h-24 text-center">
            No customers found.
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="block sm:hidden space-y-4">
        {customers.map((customer) => (
          <CustomerRow
            key={customer.id}
            customer={{
              ...customer,
              full_name: customer.full_name || 'Unnamed Customer',
              role: customer.role || 'customer'
            }}
            deletingId={deletingId}
            onDelete={async (id) => {
              setDeletingId(id);
              await onDelete(id);
              setDeletingId(null);
            }}
            view="mobile"
          />
        ))}
      </div>
      
      {/* Desktop View */}
      <tbody className="hidden sm:table-row-group">
        {customers.map((customer) => (
          <CustomerRow
            key={customer.id}
            customer={{
              ...customer,
              full_name: customer.full_name || 'Unnamed Customer',
              role: customer.role || 'customer'
            }}
            deletingId={deletingId}
            onDelete={async (id) => {
              setDeletingId(id);
              await onDelete(id);
              setDeletingId(null);
            }}
            view="desktop"
          />
        ))}
      </tbody>
    </>
  );
};

export default CustomerTableContent;
