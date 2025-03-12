import { FC } from "react";

type PrintPreviewProps = {
  items: Array<{
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }>;
  totalAmount: number;
  phoneNumber?: string;
};

export const PrintPreview: FC<PrintPreviewProps> = ({
  items,
  totalAmount,
  phoneNumber,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Order Summary</h2>
      {phoneNumber && <p className="text-sm">Phone: {phoneNumber}</p>}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.name} ({item.grams}g)
            </span>
            <span>Br {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>Br {totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
};
