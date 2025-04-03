export interface LoginFormType {
  email: string;
  password: string;
}

export interface SignupFormType {
  email: string;
  password: string;
  full_name: string;
}

export interface ResetFormType {
  email: string;
}

export interface UpdatePasswordFormType {
  password: string;
  confirmPassword: string;
}

import { Tables } from '@/types/supabase';

export type BaseProfile = Tables<'profiles'>;

export type Profile = BaseProfile & {
  phone?: string | null;
  address?: string | null;
  role: 'admin' | 'sales' | 'customer';
};

export interface AuthResponse<T = unknown> {
  error: string | null;
  success: boolean;
  data: T | null;
  message?: string;
  redirectTo?: string;
}

export interface AuthErrorResponse {
  error: string;
  success: false;
  data: null;
}

export interface AuthSuccessResponse<T> {
  error: null;
  success: true;
  data: T;
  message?: string;
  redirectTo?: string;
}

export type LoginResponse = {
  role?: 'admin' | 'sales' | 'customer';
  redirectTo?: string;
};

// Role-based access control types
export type UserRole = 'admin' | 'sales' | 'customer';

export interface RolePermissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canViewDashboard: true,
    canManageUsers: true,
    canManageProducts: true,
    canManageOrders: true,
    canViewReports: true,
    canManageSettings: true,
  },
  sales: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: true,
    canViewReports: true,
    canManageSettings: false,
  },
  customer: {
    canViewDashboard: false,
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: false,
    canViewReports: false,
    canManageSettings: false,
  },
};

// Session management types
export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
  refreshToken?: string;
  expires?: number;
}

export interface AuthState {
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

// Error types
export type AuthErrorType =
  | 'InvalidCredentials'
  | 'EmailNotVerified'
  | 'AccountInactive'
  | 'NetworkError'
  | 'UnexpectedError'
  | 'SignOutError';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, unknown>;
}
