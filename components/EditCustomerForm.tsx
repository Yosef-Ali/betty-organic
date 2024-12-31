'use client';

import { CustomerForm } from '@/components/CustomerForm';

export function EditCustomerForm({ initialData }: any) {
  return (
    <CustomerForm initialData={initialData} />
  );
}
