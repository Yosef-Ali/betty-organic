// Server actions for marketing-related operations
'use server';

import { createClient } from '@/lib/supabase/server';
import { Testimonial } from '@/lib/types';
import { sendAdminWhatsAppNotification } from './whatsappActions';

export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }

  return data;
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching featured testimonials:', error);
    return [];
  }

  return data;
}

// New function to process marketing page orders with automatic WhatsApp notifications
export async function processMarketingOrder(orderData: {
  items: Array<{
    name: string
    grams: number
    price: number
  }>
  customer: {
    name: string
    phone: string
    email?: string
    address: string
  }
  total: number
  display_id: string
}) {
  console.log('🛍️ Processing marketing order with auto-notification:', orderData.display_id);
  
  try {
    // Send automatic WhatsApp notification to admin
    const notificationResult = await sendAdminWhatsAppNotification({
      id: orderData.display_id,
      display_id: orderData.display_id,
      items: orderData.items.map(item => ({
        name: item.name,
        grams: item.grams,
        price: item.price,
        unit_price: item.price / (item.grams / 1000) // Calculate unit price per kg
      })),
      total: orderData.total,
      customer_name: orderData.customer.name,
      customer_phone: orderData.customer.phone,
      delivery_address: orderData.customer.address,
      customer_email: orderData.customer.email,
      user_id: null,
      created_at: new Date().toISOString()
    });

    console.log('📱 Auto-notification result:', {
      success: notificationResult.success,
      method: notificationResult.method,
      provider: notificationResult.provider,
      orderId: orderData.display_id
    });

    return {
      success: true,
      message: 'Order processed and notification sent automatically',
      notificationSent: notificationResult.success,
      notificationMethod: notificationResult.method,
      whatsappUrl: notificationResult.whatsappUrl
    };
  } catch (error) {
    console.error('❌ Error processing marketing order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process order',
      notificationSent: false
    };
  }
}
