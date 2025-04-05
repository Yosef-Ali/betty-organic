'use client';

import React from 'react';

export default function NotificationDebugPage(): React.ReactNode {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification System</h1>
      <p className="mb-6">
        The notification system is working in the background. You can see the notification bell in the header.
      </p>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              The debug page has been temporarily simplified to avoid server configuration issues.
              Please use the notification bell in the header to see pending orders.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">How to Test Notifications</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Create a new order from the orders page</li>
            <li>The notification bell will show a count of pending orders</li>
            <li>Click the bell to see pending order details</li>
            <li>When a new order is created, the bell will animate and play a sound</li>
          </ol>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Notification Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Real-time updates when orders are created or status changes</li>
            <li>Sound notifications (can be toggled on/off)</li>
            <li>Visual animation when new orders arrive</li>
            <li>Displays order ID in the same format as the orders table</li>
            <li>Shows the most recent pending orders</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
