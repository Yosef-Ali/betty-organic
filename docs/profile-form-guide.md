# Profile Form Component Documentation

## Overview
The ProfileForm component is a comprehensive form implementation for user profile management in the Betty Organic App. It handles profile image uploads, form validation, and profile updates.

## Component Architecture

### Dependencies
```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AvatarUpload } from '@/components/avatar-upload'

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  avatar_url: z.string().optional(),
});

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
  initialImage: string;
  userId: string;
}
```

### Image Upload Implementation

The ProfileForm component uses the `AvatarUpload` component to handle profile image uploads. Here's how the image upload functionality works:

1. **Component Integration**
```typescript
<AvatarUpload
  form={form}
  name="avatar_url"
  label="Profile Picture"
  bucketName="profiles"
  entityId={userId}
  size="lg"
  className="flex flex-col items-center"
/>
```

2. **Storage Configuration**
- Images are stored in a dedicated "profiles" bucket
- Each user's avatar is stored with a unique identifier
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 5MB

3. **Upload Process**
- The AvatarUpload component handles:
  - File selection and validation
  - Image preview generation
  - Upload progress indication
  - Error handling
  - Automatic cleanup of temporary files

4. **Error Handling**
```typescript
try {
  const result = await updateProfile({
    name: data.name,
    email: data.email,
    avatar_url: data.avatar_url,
  });

  if (result.success) {
    setMessage('Profile updated successfully');
    router.refresh();
  } else {
    setMessage(result.error || 'Failed to update profile');
  }
} catch (error) {
  setMessage('An error occurred while updating the profile');
}
```

### Usage Example
```typescript
<ProfileForm
  initialName="User Name"
  initialEmail="user@example.com"
  initialImage="/default-avatar.png"
  userId="user-123"
/>
```

### Best Practices
1. **Image Optimization**
   - Implement client-side image compression
   - Use WebP format when supported
   - Maintain aspect ratio during resizing

2. **Security**
   - Validate file types server-side
   - Implement upload size limits
   - Use signed URLs for secure access

3. **User Experience**
   - Show upload progress
   - Provide immediate visual feedback
   - Handle network errors gracefully
   - Enable image cropping/adjustment

4. **Performance**
   - Implement lazy loading for images
   - Use appropriate image sizes
   - Cache uploaded images
   - Clean up unused temporary files
