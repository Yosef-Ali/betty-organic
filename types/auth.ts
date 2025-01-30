import { Profile } from "@/lib/types/auth";
import { User } from "./user";


export type AuthData = {
  user: User;
  profile: Profile;
  isAdmin: boolean;
} | null;
