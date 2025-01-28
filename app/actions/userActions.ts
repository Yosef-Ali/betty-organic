'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

interface UpdateProfileData {
  name: string;
  email: string;
  avatar_url?: string | null;
}

export async function updateProfile(data: UpdateProfileData) {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: data.name,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

export async function deleteUserAvatar(userId: string) {
  try {
    const supabase = createClient();

    // Get current avatar URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (profile?.avatar_url) {
      // Extract filename from URL
      const path = profile.avatar_url.split('/').pop();
      if (path) {
        // Delete file from storage
        const { error: deleteError } = await supabase.storage
          .from('public')
          .remove([`profiles/${path}`]);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete avatar',
    };
  }
}
