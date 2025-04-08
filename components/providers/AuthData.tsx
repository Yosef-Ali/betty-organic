import { getUser } from '@/app/actions/auth';
import { getProfile } from '@/app/actions/profile';

interface AuthDataProps {
    children: React.ReactNode;
}

export async function AuthData({ children }: AuthDataProps) {
    const user = await getUser();
    const profile = user ? await getProfile(user.id) : null;

    return children;
}
