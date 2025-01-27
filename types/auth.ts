import { User } from "@supabase/supabase-js";

export type AuthData = {
  user: User | null;
  isAdmin: boolean;
};
