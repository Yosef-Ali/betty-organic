'use client';

import { createContext, useContext, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/types/auth'; // Import the correct Profile type definition

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  setUser: () => { },
  setProfile: () => { },
  setIsLoading: () => { },
  setError: () => { },
});

interface AuthProviderProps {
  user: User | null;
  profile: Profile | null;
  children: React.ReactNode;
}

export function AuthProvider({ user: initialUser, profile: initialProfile, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(false); // No longer loading on mount
  const [error, setError] = useState<Error | null>(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        error,
        setUser,
        setProfile,
        setIsLoading,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
