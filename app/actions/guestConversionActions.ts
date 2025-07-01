'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createAccountFromGuestOrder(
    guestOrderData: {
        name: string;
        phone: string;
        email: string;
        address: string;
        orderId?: string;
    }
) {
    try {
        const { name, phone, email, address, orderId } = guestOrderData;

        // Validate input
        if (!name || !phone || !email) {
            return {
                error: 'Name, phone, and email are required',
                status: 400
            };
        }

        const supabase = await createAdminClient();

        // Check if profile exists (simpler than checking auth user)
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingProfile) {
            return {
                error: 'An account with this email already exists. Please sign in instead.',
                status: 409
            };
        }

        // Create new user account
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true, // Auto-confirm email for guest orders
            user_metadata: {
                name,
                phone,
                address,
                source: 'guest_order_conversion',
                guest_order_id: orderId
            }
        });

        if (authError) {
            console.error('Failed to create user account:', authError);
            return {
                error: 'Failed to create account. Please try again.',
                status: 500
            };
        }

        if (!newUser.user) {
            return {
                error: 'Failed to create user account',
                status: 500
            };
        }

        // Create or update profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email,
                name,
                phone,
                address,
                role: 'customer',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error('Failed to create profile:', profileError);
            // Continue anyway, profile can be created later
        }

        // If there's an associated guest order, try to link it to the new user
        if (orderId) {
            const { error: orderUpdateError } = await supabase
                .from('orders')
                .update({
                    profile_id: newUser.user.id,
                    customer_profile_id: newUser.user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('display_id', orderId)
                .eq('profile_id', newUser.user.id); // Only update if it's still a guest order

            if (orderUpdateError) {
                console.error('Failed to link guest order to new account:', orderUpdateError);
                // This is not critical, continue anyway
            }
        }

        // Revalidate relevant paths
        revalidatePath('/dashboard/orders');
        revalidatePath('/profile');

        return {
            success: true,
            user: {
                id: newUser.user.id,
                email,
                name
            },
            message: 'Account created successfully! You can now track your orders.'
        };

    } catch (error) {
        console.error('Unexpected error creating account from guest order:', error);
        return {
            error: 'An unexpected error occurred. Please try again.',
            status: 500
        };
    }
}

export async function sendGuestOrderConversionEmail(
    email: string,
    orderDetails: {
        orderId: string;
        customerName: string;
        total: number;
    }
) {
    try {
        // This would integrate with your email service
        // For now, we'll just log the action
        console.log('Sending order conversion email to:', email, orderDetails);

        // TODO: Implement email sending logic here
        // You could use services like Resend, SendGrid, or AWS SES

        return { success: true };
    } catch (error) {
        console.error('Failed to send conversion email:', error);
        return { error: 'Failed to send email' };
    }
}
