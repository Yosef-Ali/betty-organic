import { User } from '@supabase/supabase-js';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.email || ''}
          readOnly
          disabled
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          defaultValue={user.user_metadata?.full_name || ''}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Update Profile</Button>
      </div>
    </div>
  );
}
