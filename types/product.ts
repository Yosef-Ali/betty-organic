export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string;
  category: any;
  active: boolean;
  created_by: string | null;
  totalSales: number;
  unit: string | null;
  createdAt: string; // updated property name
  updatedAt: string; // updated property name
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string;
  active?: boolean;
  status?: 'active' | 'out_of_stock';
}

export type UpdateProductInput = Partial<CreateProductInput>;
