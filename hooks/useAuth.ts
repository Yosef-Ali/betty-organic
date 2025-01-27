import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/server';

interface Profile {
  id: string;
  role: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

