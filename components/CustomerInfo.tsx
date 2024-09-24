// CustomerInfo.tsx
import React from 'react';

type CustomerInfoProps = {
  fullName: string;
  email: string;
  imageUrl: string;
};

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ fullName, email, imageUrl }) => {
  return (
    <div className="flex items-center">
      <div className="h-10 w-10 flex-shrink-0">
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={imageUrl || '/public/uploads/default.jpg'}
          alt={fullName || 'Customer'}
        />
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-gray-900">
          {fullName || 'Anonymous'}
        </div>
        <div className="text-sm text-gray-500">
          {email || 'No email'}
        </div>
      </div>
    </div>
  );
};
