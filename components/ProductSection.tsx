const ProductSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-8">Our Fresh Products</h2>
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
