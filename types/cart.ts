export interface CartItemType {
  id: string;  // Changed from string | number to just string
  name: string;
  grams: number;
  pricePerKg: number;
  imageUrl?: string;  // Made optional since some components don't use it
}
