'use client';

import { NotificationDebugger } from '@/components/debug/NotificationDebugger';
import { NotificationTester } from '@/components/debug/NotificationTester';

export default function NotificationDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification System Debug</h1>
      <p className="mb-6">
        Use this page to test the notification system. Create a test order and
        check if the notification bell updates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Notification Tester</h2>
          <NotificationTester />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Notification Debugger</h2>
          <NotificationDebugger />
        </div>
      </div>
    </div>
  );
}
