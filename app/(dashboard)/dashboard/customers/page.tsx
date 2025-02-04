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

  const { isAdmin, profile } = authData ?? {};
  if (!isAdmin) {
    console.error('Access denied: User is not an admin', {
      userRole: profile?.role,
    });
    redirect('/dashboard'); // Redirect non-admin users
  }

  try {
    const supabase = await createClient();

    // Log auth state before queries
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log('Auth state:', {
      hasSession: !!session,
      userRole: profile?.role,
      isAdmin,
    });

    // First try a simple query to test access
    const { error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Error testing database access:', testError);
      console.error('Additional context:', {
        statusCode: testError?.code,
        hint: testError?.hint,
        details: testError?.details,
      });
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Database Access Error
          </h2>
          <p className="text-gray-600">
            Unable to access the database. Please try again later.
          </p>
          {testError.message && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              {testError.message}
            </pre>
          )}
        </div>
      );
    }

    // If test succeeds, fetch customer profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        'id, name, email, address, avatar_url, status, role, created_at, updated_at',
      )
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      console.error('Query error details:', {
        statusCode: error?.code,
        hint: error?.hint,
        details: error?.details,
      });
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Customers
          </h2>
          <p className="text-gray-600">
            Unable to load customer list.
            {error.message && (
              <>
                <br />
                <span className="font-mono text-sm">
                  Error: {error.message}
                </span>
              </>
            )}
          </p>
          {error.details && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    if (!profiles) {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-amber-600 mb-4">
            No Data Available
          </h2>
          <p className="text-gray-600">No customer profiles were found.</p>
        </div>
      );
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
      updatedAt: profile.updated_at || null,
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
  } catch (error) {
    console.error('Unexpected error in CustomersPage:', error);
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Unexpected Error
        </h2>
        <p className="text-gray-600">
          An unexpected error occurred while loading the customers page.
          {error instanceof Error && (
            <>
              <br />
              <span className="font-mono text-sm">Error: {error.message}</span>
            </>
          )}
        </p>
      </div>
    );
  }
}
