'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/ImprovedAuthProvider';

export default function RealtimeDebugPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);
  const { user, profile, supabase } = useAuth();

  const createTestOrder = async () => {
    if (!user?.id) {
      setLastResult({ error: 'Not authenticated' });
      return;
    }

    setIsCreating(true);
    setLastError(null);
    
    try {
      console.log('🧪 [RealtimeDebug] Creating test order...');
      
      const orderData = {
        status: 'pending',
        total_amount: 99.99,
        type: 'sale',
        display_id: `DEBUG-${Date.now()}`,
        profile_id: user.id,
        customer_profile_id: user.id
      };

      console.log('🧪 [RealtimeDebug] Order data:', orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        // Log the raw error object
        console.error('🧪 [RealtimeDebug] ❌ Order creation failed - Raw error:', error);
        console.error('🧪 [RealtimeDebug] ❌ Error type:', typeof error);
        console.error('🧪 [RealtimeDebug] ❌ Error keys:', Object.keys(error || {}));
        console.error('🧪 [RealtimeDebug] ❌ Error message:', error?.message);
        console.error('🧪 [RealtimeDebug] ❌ Error code:', error?.code);
        console.error('🧪 [RealtimeDebug] ❌ Error details:', error?.details);
        console.error('🧪 [RealtimeDebug] ❌ Error hint:', error?.hint);
        
        // Try to extract all properties
        const errorInfo: any = {};
        if (error) {
          for (const key in error) {
            try {
              errorInfo[key] = error[key];
            } catch (e) {
              errorInfo[key] = 'Could not serialize';
            }
          }
        }
        
        setLastError(errorInfo);
        setLastResult({ 
          error: error?.message || 'Unknown error',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint',
          code: error?.code || 'No code',
          fullError: errorInfo
        });
      } else {
        console.log('🧪 [RealtimeDebug] ✅ Order created:', data);
        setLastResult({ success: true, order: data });
      }
    } catch (err) {
      console.error('🧪 [RealtimeDebug] ❌ Exception:', err);
      setLastError(err);
      setLastResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsCreating(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      // First, try to get column information
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_columns', { table_name: 'orders' })
        .single();
        
      if (tableError) {
        // Fallback: just try a simple select
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .limit(1);
          
        if (error) {
          setLastResult({ 
            testResult: 'Database connection failed',
            error: error.message,
            details: error
          });
        } else {
          // Show the structure of an existing order
          const sampleOrder = data?.[0];
          setLastResult({ 
            testResult: 'Database connection successful',
            sampleData: data,
            orderStructure: sampleOrder ? Object.keys(sampleOrder) : 'No orders found',
            orderExample: sampleOrder
          });
        }
      } else {
        setLastResult({ 
          testResult: 'Table structure retrieved',
          columns: tableInfo
        });
      }
    } catch (err) {
      setLastResult({ 
        testResult: 'Database connection failed with exception',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Real-time Debug Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>User Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>User Role:</strong> {profile?.role || 'Unknown'}</p>
            <p><strong>Profile Status:</strong> {profile?.status || 'Unknown'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testDatabaseConnection} 
              variant="outline"
              className="w-full"
            >
              Test Database Connection
            </Button>
            
            <Button 
              onClick={createTestOrder} 
              disabled={isCreating || !user?.id}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Test Order'}
            </Button>
            
            <div className="text-xs text-muted-foreground">
              This will create a test order and trigger real-time events.
              Check the browser console for detailed logging.
            </div>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {lastError && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-red-600">Last Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-red-50 p-4 rounded overflow-auto text-red-900">
              {JSON.stringify(lastError, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open browser DevTools console (F12)</li>
            <li>Test database connection first</li>
            <li>Click "Create Test Order"</li>
            <li>Watch console for RealtimeProvider logs</li>
            <li>Check if OrderDashboard and NotificationBell update</li>
            <li>Open another tab to see cross-tab updates</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
