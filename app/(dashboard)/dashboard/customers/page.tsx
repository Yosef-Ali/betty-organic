import { createClient } from '@/lib/supabase/server';
import { CustomerTable } from '@/components/CustomerTable';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  // Get current user for role-based access
  const authData = await getCurrentUser();
  if (!authData) {
    redirect('/auth/login');
  }
  const { isAdmin } = authData ?? {};

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
      role,
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
    full_name: profile.name,
    email: profile.email,
    location: profile.address || null,
    image_url: profile.avatar_url || null,
    status: profile.status || 'active',
    role: profile.role || 'customer',
    createdAt: profile.created_at || null,
    updatedAt: profile.updated_at || null
  }));

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage and view customer information
          </p>
        </div>
      </div>
      <CustomerTable initialCustomers={customers} />
    </div>
  );
}
