'use client';

import { useAuth } from '@/components/providers/ImprovedAuthProvider';
import { useAuth as useAuthOld } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugRolePage() {
  const { user, profile, isLoading } = useAuth();
  
  // Test both auth providers - always call hooks conditionally at top level
  const oldAuth = useAuthOld();

  return (
    <div className="container max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Role Debug Information</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </div>
            
            <div>
              <strong>User:</strong> {user ? 'Present' : 'Not present'}
            </div>
            
            {user && (
              <div>
                <strong>User ID:</strong> {user.id}
                <br />
                <strong>User Email:</strong> {user.email}
              </div>
            )}
            
            <div>
              <strong>Profile:</strong> {profile ? 'Present' : 'Not present'}
            </div>
            
            {profile && (
              <div>
                <strong>Profile Role:</strong> &quot;{profile.role}&quot;
                <br />
                <strong>Profile Name:</strong> {profile.name}
                <br />
                <strong>Profile Status:</strong> {profile.status}
              </div>
            )}
            
            <div>
              <strong>Role Check Results:</strong>
              <br />
              - Is Admin: {profile?.role === 'admin' ? 'Yes' : 'No'}
              <br />
              - Is Sales: {profile?.role === 'sales' ? 'Yes' : 'No'}
              <br />
              - Should Show Tabs: {(profile?.role === 'admin' || profile?.role === 'sales') ? 'Yes' : 'No'}
            </div>

            <div>
              <strong>Raw Profile Object:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>

            <div>
              <strong>Old Auth Provider (for comparison):</strong>
              <pre className="bg-red-50 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(oldAuth, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}