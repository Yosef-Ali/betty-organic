import { createClient } from '@/lib/supabase/server';
import { CustomerTable } from '@/components/CustomerTable';

export default async function CustomersPage() {
  const supabase = await createClient();

  // Fetch customers (profiles with role='customer')
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      name,
      email,
      address,
      avatar_url,
      status,
      created_at,
      updated_at,
      orders (
        id,
        total_amount,
        status,
        created_at,
        updated_at
      )
    `,
    )
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
    return <div>Error loading customers</div>;
  }

  const customers = profiles.map(profile => ({
    id: profile.id,
    fullName: profile.name,
    email: profile.email,
    phone: '', // Not in profiles table
    location: profile.address,
    imageUrl: profile.avatar_url,
    status: profile.status || 'active',
    orders: profile.orders || [],
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Customers</h2>
      <CustomerTable initialCustomers={customers} />
    </div>
  );
}
