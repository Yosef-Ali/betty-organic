import { useState } from 'react';
import { createProduct, updateProduct } from '../actions/productActions';
import { uploadImage } from '../actions/upload-image'; // Ensure correct import
import { useProductStore } from '@/store/productStore'

const ProductForm = () => {
  const { isUploading, uploadError, setUploading, setUploadError, resetUploadState } = useProductStore()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: null as File | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === 'image' && files) {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetUploadState();

    try {
      // Create product first
      const formDataToCreate = new FormData();
      formDataToCreate.append('name', formData.name);
      formDataToCreate.append('description', formData.description);
      formDataToCreate.append('price', formData.price);
      formDataToCreate.append('stock', formData.stock);

      console.log('Creating product...');
      const product = await createProduct(formDataToCreate);
      console.log('Product created:', product);

      if (!product || !product.id) {
        throw new Error('Product creation failed: Invalid response');
      }

      // Handle image upload if provided
      if (formData.image && product.id) {
        setUploading(true);
        console.log('Preparing image upload...');
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', formData.image);
        formDataToUpload.append('productId', product.id);

        const uploadResult = await uploadImage(formDataToUpload);
        console.log('Upload result:', uploadResult);

        if (uploadResult.success && uploadResult.imageUrl) {
          console.log('Image uploaded successfully:', uploadResult.imageUrl);
          const updateFormData = new FormData();
          updateFormData.append('imageUrl', uploadResult.imageUrl); // Now TypeScript knows imageUrl is defined
          await updateProduct(product.id, updateFormData);
        } else {
          console.error('Upload failed:', uploadResult.error, uploadResult.details);
          setUploadError(uploadResult.error || 'Failed to upload image');
        }
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: null,
      });
    } catch (err: any) {
      console.error('Form submission error:', err);
      setUploadError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ...existing form fields... */}
      <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      <textarea name="description" value={formData.description} onChange={handleChange} required />
      <input type="number" name="price" value={formData.price} onChange={handleChange} required />
      <input type="number" name="stock" value={formData.stock} onChange={handleChange} required />
      <input type="file" name="image" accept="image/*" onChange={handleChange} />
      {uploadError && <p className="text-red-500">{uploadError}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || isUploading}
      >
        {isUploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
};

export default ProductForm;
