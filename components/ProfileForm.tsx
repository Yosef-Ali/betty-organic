'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from '@/app/actions/userActions';

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
  initialImage: string;
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialImage,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [image, setImage] = useState(initialImage);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const result = await updateProfile({
        name,
        email,
        image,
      });

      if (result.success) {
        setMessage('Profile updated successfully');
      } else {
        setMessage(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred while updating the profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-32 h-32">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="text-4xl">
            {name?.charAt(0) || 'A'}
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImage('')}>
            Remove
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = prompt('Enter image URL:');
              if (url) setImage(url);
            }}
          >
            Change
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Profile Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image"
              name="image"
              type="url"
              value={image}
              onChange={e => setImage(e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
      {message && (
        <div
          className={`mt-4 p-4 rounded-md ${
            message.includes('success')
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}
