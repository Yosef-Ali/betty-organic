'use client';

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ShippingBillingInfoProps {
  profileName: string;
  shippingAddress?: Partial<Address>;
  billingAddress?: Partial<Address>;
}

const defaultAddress: Address = {
  street: '1234 Main St.',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  name: '',
};

export default function ShippingBillingInfo({
  profileName,
  shippingAddress = defaultAddress,
  billingAddress,
}: ShippingBillingInfoProps) {
  const shipping = {
    ...defaultAddress,
    ...shippingAddress,
    name: profileName,
  };
  const billing = billingAddress || shipping;
  const isSameAddress = !billingAddress;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-3">
        <div className="font-semibold">Shipping Information</div>
        <address className="grid gap-0.5 not-italic text-muted-foreground">
          <span>{shipping.name}</span>
          <span>{shipping.street}</span>
          <span>
            {shipping.city}, {shipping.state} {shipping.zipCode}
          </span>
        </address>
      </div>

      <div className="grid gap-3">
        <div className="font-semibold">Billing Information</div>
        {isSameAddress ? (
          <div className="text-muted-foreground">Same as shipping address</div>
        ) : (
          <address className="grid gap-0.5 not-italic text-muted-foreground">
            <span>{billing.name}</span>
            <span>{billing.street}</span>
            <span>
              {billing.city}, {billing.state} {billing.zipCode}
            </span>
          </address>
        )}
      </div>
    </div>
  );
}
