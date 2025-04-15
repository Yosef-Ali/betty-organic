'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';

/**
 * Creates a Supabase client for server-side operations
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies(); // Await the cookies() promise

    // Get the Supabase URL and key from environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Missing required Supabase environment variables');
    }

    return createServerClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.set(name, '', { ...options, maxAge: 0 });
                },
            },
        }
    );
}

/**
 * Signs a user in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

/**
 * Signs up a new user with email and password
 */
export async function signUpWithEmail(email: string, password: string, metadata?: any) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

/**
 * Signs out the current user
 */
export async function signOut() {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect('/');
}

/**
 * Gets the current user session
 */
export async function getSession() {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Gets the current user
 */
export async function getCurrentUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
