import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProductForm from './products/product-form';

const ProductSection = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
        <h2 className="text-3xl font-semibold mb-8">Our Fresh Products</h2>

        <div className="mb-8">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Hide Form' : 'Add New Product'}
          </Button>
        </div>

        {showForm && (
          <div className="max-w-2xl mx-auto mb-8">
            <ProductForm />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">Product 1</div>
          <div className="bg-white rounded-lg shadow p-6">Product 2</div>
          <div className="bg-white rounded-lg shadow p-6">Product 3</div>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
