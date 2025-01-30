import { getProfile } from '@/app/actions/profile';
import { notFound } from 'next/navigation';
import { EditCustomerForm } from '@/components/EditCustomerForm';
import { CustomerFormValues } from '@/components/CustomerForm';

type CustomerStatus = 'active' | 'inactive';

export async function CustomerData({ id }: { id: string }) {
  const profile = await getProfile(id);

  if (!profile || profile.role !== 'customer') {
    notFound();
  }

  const initialData: CustomerFormValues = {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    status: profile.status as CustomerStatus,
    imageUrl: profile.imageUrl,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Edit Customer</h2>
      <EditCustomerForm initialData={initialData} />
    </div>
  );
}
