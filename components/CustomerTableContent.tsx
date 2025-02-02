'use client';

import { useState } from 'react';
import { type CustomerWithOrders } from '@/types/customer';
import CustomerRow from './CustomerRow';

interface CustomerTableContentProps {
  customers: CustomerWithOrders[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  view: 'mobile' | 'desktop';
}

const CustomerTableContent = ({
  customers,
  isLoading,
  onDelete,
  view,
}: CustomerTableContentProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (view === 'mobile') {
    if (isLoading) {
      return <div className="py-4 text-center">Loading...</div>;
    }

    if (customers.length === 0) {
      return <div className="py-4 text-center">No customers found.</div>;
    }

    return (
      <div className="space-y-4">
        {customers.map(customer => (
          <CustomerRow
            key={customer.id}
            customer={{
              ...customer,
              full_name: customer.full_name || 'Unnamed Customer',
              role: customer.role || 'customer',
            }}
            deletingId={deletingId}
            onDelete={async id => {
              setDeletingId(id);
              await onDelete(id);
              setDeletingId(null);
            }}
            view="mobile"
          />
        ))}
      </div>
    );
  }

  // Desktop view
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan={7} className="h-24 text-center">
            Loading...
          </td>
        </tr>
      </tbody>
    );
  }

  if (customers.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={7} className="h-24 text-center">
            No customers found.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {customers.map(customer => (
        <CustomerRow
          key={customer.id}
          customer={{
            ...customer,
            full_name: customer.full_name || 'Unnamed Customer',
            role: customer.role || 'customer',
          }}
          deletingId={deletingId}
          onDelete={async id => {
            setDeletingId(id);
            await onDelete(id);
            setDeletingId(null);
          }}
          view="desktop"
        />
      ))}
    </tbody>
  );
};

export default CustomerTableContent;
