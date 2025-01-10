export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  createdAt: string
  updatedAt: string
  totalSales?: number
}

export interface DbProductInsert {
  id?: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  createdAt?: string
  updatedAt?: string
}

export interface DbProductUpdate {
  name?: string
  description?: string
  price?: number
  stock?: number
  imageUrl?: string
  updatedAt?: string
}
