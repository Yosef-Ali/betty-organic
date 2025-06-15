'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { AvatarUpload } from '@/components/avatar-upload';
import { updateProfile } from '@/app/actions/userActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
  initialImage: string;
  initialPhone?: string;
  userId: string;
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialImage,
  initialPhone,
  userId,
}: ProfileFormProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
      avatar_url: initialImage,
      phone: initialPhone || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setMessage('');
    setIsSubmitting(true);

    try {
      const result = await updateProfile({
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url,
        phone: data.phone,
      });

      if (result.success) {
        setMessage('Profile updated successfully');
        router.refresh();
      } else {
        setMessage(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred while updating the profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <AvatarUpload
          form={form}
          name="avatar_url"
          label="Profile Picture"
          bucketName="profiles"
          entityId={userId}
          size="lg"
          className="flex flex-col items-center"
        />

        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+251944113998"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  Ethiopian phone number format: +251XXXXXXXXX
                </p>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>

        {message && (
          <Alert
            variant={message.includes('success') ? 'default' : 'destructive'}
          >
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
