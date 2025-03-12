import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/ProductForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCategory } from '@/types/supabase';

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'All',
  'Spices_Oil_Tuna',
  'Flowers',
  'Vegetables',
  'Fruits',
  'Herbs_Lettuce',
  'Dry_Stocks_Bakery',
  'Eggs_Dairy_products'
];

const ProductSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold mb-4">Our Fresh Products</h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as ProductCategory)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category: ProductCategory) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Hide Form' : 'Add New Product'}
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="max-w-2xl mx-auto mb-8">
            <ProductForm isAdmin={true} isSales={true} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* TODO: Replace with actual product data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Product 1</h3>
            <p className="text-sm text-gray-600">Category: {selectedCategory}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Product 2</h3>
            <p className="text-sm text-gray-600">Category: {selectedCategory}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Product 3</h3>
            <p className="text-sm text-gray-600">Category: {selectedCategory}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
