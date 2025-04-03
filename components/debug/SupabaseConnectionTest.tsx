'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

export function SupabaseConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const [supabaseUrl, setSupabaseUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testType, setTestType] = useState<'anon' | 'service'>('service');

  const testConnection = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Create a client with the provided credentials
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Try a simple query that requires admin privileges if testing service key
      let response;
      if (testType === 'service') {
        // This query would typically require admin access
        response = await supabase
          .from('profiles')
          .select('id, role')
          .limit(5);
      } else {
        // This query should work with anon key depending on your RLS policies
        response = await supabase
          .from('products')
          .select('id, name')
          .limit(5);
      }

      if (response.error) {
        throw new Error(`${response.error.message}${response.error.hint ? ` - ${response.error.hint}` : ''}`);
      }

      setResult({
        success: true,
        message: `Successfully connected to Supabase with ${testType} key!`,
        details: {
          rowCount: response.data?.length,
          firstRows: response.data?.slice(0, 2)
        }
      });
    } catch (error) {
      console.error('Error testing Supabase connection:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Direct Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium">Supabase URL</label>
            <Input
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Supabase Key</label>
            <Input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="Enter your service role key or anon key"
              className="mt-1"
            />
            <div className="mt-2 flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={testType === 'service'}
                  onChange={() => setTestType('service')}
                />
                <span className="text-sm">Service Role Key</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={testType === 'anon'}
                  onChange={() => setTestType('anon')}
                />
                <span className="text-sm">Anon Key</span>
              </label>
            </div>
          </div>
        </div>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>
              <div>{result.message}</div>
              {result.success && result.details && (
                <div className="mt-2 text-sm">
                  <div>Rows: {result.details.rowCount}</div>
                  <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs max-h-32">
                    {JSON.stringify(result.details.firstRows, null, 2)}
                  </pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Button>
      </CardFooter>
    </Card>
  );
}
