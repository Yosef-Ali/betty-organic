export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type Customer = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  status: 'active' | 'inactive';
  image_url?: string | null;
};
