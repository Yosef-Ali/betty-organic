'use client';

// Import mock components instead of the real ones that require admin access
// This avoids the SUPABASE_SERVICE_ROLE_KEY error

// Import the mock page implementation
import MockPage from './page.mock';

export default function NotificationDebugPage() {
  // Use the mock implementation that doesn't require admin access
  return <MockPage />;
}
