'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testRealtimeTrigger } from '@/app/actions/testRealtimeTrigger';

export default function QuickTestPage() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const response = await testRealtimeTrigger();
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Quick Real-time Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Real-time Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will create and update a test order to trigger real-time events.
            Watch the console for &quot;[RealtimeProvider] Event received:&quot; messages.
          </p>
          
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Test Order...' : 'Trigger Real-time Test'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.success ? (
                <div>
                  <p><strong>Success!</strong> {result.message}</p>
                  <div className="mt-2 text-xs">
                    <p>Created Order ID: {result.data?.created?.id}</p>
                    <p>Updated Order ID: {result.data?.updated?.id}</p>
                    <p className="mt-2 font-semibold">
                      Check console for real-time events!
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p><strong>Error:</strong> {result.error}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded text-black">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold mb-2">What to expect:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click &quot;Trigger Real-time Test&quot;</li>
          <li>Check console for <code>[RealtimeProvider] Event received:</code></li>
          <li>Should see 2 events: INSERT and UPDATE</li>
          <li>Check if notification bell updates with new pending order</li>
        </ol>
      </div>
    </div>
  );
}