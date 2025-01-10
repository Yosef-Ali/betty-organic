export const SALES_ROUTES = {
  dashboard: '/dashboard',
  products: '/dashboard/products',
  orders: '/dashboard/orders',
  customers: '/dashboard/customers',
  sales: '/dashboard/sales',
} as const;

export const ROLE_ROUTES = {
  admin: [...Object.values(SALES_ROUTES), '/dashboard/users', '/dashboard/settings'],
  sales: Object.values(SALES_ROUTES),
  customer: ['/dashboard', '/dashboard/orders'],
} as const;

export const checkRouteAccess = (role: string, path: string) => {
  const allowedRoutes = ROLE_ROUTES[role as keyof typeof ROLE_ROUTES] || [];
  return allowedRoutes.some(route => path.startsWith(route));
};
