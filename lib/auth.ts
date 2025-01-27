// lib/auth.ts
import { getCurrentUser as getCurrentUserServer } from '@/app/actions/auth';

// Client-side wrapper for server action
export async function getCurrentUser() {
  return await getCurrentUserServer();
}
