'use client';

import { CreditCard } from 'lucide-react';

interface PaymentMethod {
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
}

const defaultPayment: PaymentMethod = {
  type: 'visa',
  last4: '4532',
};

export default function PaymentDetails() {
  const payment = defaultPayment;

  return (
    <div className="grid gap-3">
      <div className="font-semibold">Payment Information</div>
      <dl className="grid gap-3">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span className="capitalize">{payment.type}</span>
          </dt>
          <dd className="font-mono">**** **** **** {payment.last4}</dd>
        </div>
      </dl>
    </div>
  );
}
