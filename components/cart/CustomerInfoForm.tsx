import { FC } from "react";
import { Customer } from "@/types/customer";

interface CustomerInfoFormProps {
  customer: Customer;
  setCustomer: (customer: Customer) => void;
}

export const CustomerInfoForm: FC<CustomerInfoFormProps> = ({ customer, setCustomer }) => {
  return (
    <div>
      {/* Implement form fields for customer name and email */}
      <div>
        <label htmlFor="customer-name">Name:</label>
        <input
          type="text"
          id="customer-name"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="customer-email">Email:</label>
        <input
          type="email"
          id="customer-email"
          value={customer.email}
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
        />
      </div>
    </div>
  );
};
