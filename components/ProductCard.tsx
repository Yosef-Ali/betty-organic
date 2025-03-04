'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import { ProductWithStatus } from './SalesPage';

interface ProductCardProps {
  product: ProductWithStatus;
  onClick: () => void;
}

export const ProductCard: FC<ProductCardProps> = ({ product, onClick }) => {
  const [hasError, setHasError] = useState(false);
  const fallbackImage = '/placeholder-product.svg';
  const imageUrl = hasError || !product.imageUrl ? fallbackImage : product.imageUrl;

  return (
    <div
      className="w-full overflow-hidden cursor-pointer border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all group"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full">
        <Image
          src={imageUrl}
          alt={product.name}
          width={200}
          height={200}
          className="object-cover w-full h-full transition-all group-hover:scale-105"
          onError={() => setHasError(true)}
          priority={false}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
          <h3 className="text-sm sm:text-sm font-semibold text-white">
            {product.name}
          </h3>
          <p className="text-sm sm:text-base font-bold text-white mt-1">
            Br {product.price.toFixed(2)}{' '}
            <span className="text-xs font-normal">per kg</span>
          </p>
          <p
            className={`text-xs mt-1 ${product.status === 'Available' ? 'text-green-300' : 'text-red-300'
              }`}
          >
            {product.status}
          </p>
        </div>
      </div>
    </div>
  );
};
