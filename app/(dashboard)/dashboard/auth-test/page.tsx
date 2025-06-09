import { getUser } from '@/app/actions/auth';
import { getProfile } from '@/app/actions/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AuthTestPage() {
  let user = null;
  let profile = null;
  let error = null;

  try {
    console.log('🔍 [AuthTest] Getting user...');
    user = await getUser();
    console.log('🔍 [AuthTest] User result:', user);

    if (user) {
      console.log('🔍 [AuthTest] Getting profile...');
      profile = await getProfile(user.id);
      console.log('🔍 [AuthTest] Profile result:', profile);
    }
  } catch (err) {
    console.error('🔍 [AuthTest] Error:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="container max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Server-Side Auth Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Server-Side Authentication Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error ? (
              <div className="bg-red-50 p-4 rounded">
                <strong>Error:</strong> {error}
              </div>
            ) : (
              <>
                <div>
                  <strong>User Data:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-2">
                    {user ? JSON.stringify(user, null, 2) : 'null'}
                  </pre>
                </div>

                <div>
                  <strong>Profile Data:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-2">
                    {profile ? JSON.stringify(profile, null, 2) : 'null'}
                  </pre>
                </div>

                <div className="bg-blue-50 p-4 rounded">
                  <strong>Status:</strong> {user ? 'Authenticated' : 'Not authenticated'}
                  {user && profile && (
                    <>
                      <br />
                      <strong>Role:</strong> {profile.role}
                      <br />
                      <strong>Should see tabs:</strong> {(profile.role === 'admin' || profile.role === 'sales') ? 'Yes' : 'No'}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>This page uses server-side auth functions to check your authentication status.</p>
            <p>If you see &quot;Not authenticated&quot;, you need to log in again.</p>
            <p>If you are authenticated but the client shows null, there&apos;s a session sync issue.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}