export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  stock: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
  unit?: string; // Keeping this as it's used in the UI but not in DB
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalSales'>;

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}
