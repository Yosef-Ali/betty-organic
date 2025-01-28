'use client';

import { CustomerForm, CustomerFormValues } from '@/components/CustomerForm';

interface EditCustomerFormProps {
  initialData: CustomerFormValues;
}

export function EditCustomerForm({ initialData }: EditCustomerFormProps) {
  return <CustomerForm initialData={initialData} />;
}
