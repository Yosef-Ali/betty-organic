// Emergency fix for getProducts function
// Replace the current getProducts function with this version

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Simplified query with basic columns first
    const { data, error } = await supabase
      .from('products')
      .select('*') // Select all columns to avoid column name mismatches
      .eq('active', true)
      .order('created_at', { ascending: false }); // Use standard created_at

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      stock: product.stock || 0,
      imageUrl: product.imageUrl || product.image_url || '/placeholder-product.svg',
      category: product.category || '',
      active: product.active ?? true,
      unit: product.unit || 'kg',
      totalSales: product.totalSales || product.total_sales || product.totalsales || 0,
      createdAt: product.createdAt || product.created_at || product.createdat || new Date().toISOString(),
      updatedAt: product.updatedAt || product.updated_at || product.updatedat || new Date().toISOString(),
      created_by: product.created_by || null
    }));
  } catch (error: any) {
    console.error('Error in getProducts:', error);
    return []; // Return empty array instead of throwing
  }
}