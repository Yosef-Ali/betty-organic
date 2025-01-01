import { getCustomerById } from '@/app/actions/customersActions';
import { notFound } from 'next/navigation';
import { EditCustomerForm } from '@/components/EditCustomerForm';

type CustomerStatus = 'active' | 'inactive';

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(params.id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Edit Customer</h2>
      <EditCustomerForm
        initialData={{
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
          location: customer.location ?? undefined,
          status: customer.status as CustomerStatus,
          imageUrl: customer.imageUrl ?? undefined, // Ensure imageUrl is included
        }}
      />
    </div>
  );
}
