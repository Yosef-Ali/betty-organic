// Server actions for marketing-related operations
'use server';

import { createClient } from '@/lib/supabase/server';
import { Testimonial } from '@/lib/types';

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

// New function to process marketing page orders - Manual processing without WhatsApp automation
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
  console.log('🛍️ Processing marketing order for manual handling:', orderData.display_id);

  try {
    // Log order details for manual processing
    console.log('📋 New order details:', {
      orderId: orderData.display_id,
      customerName: orderData.customer.name,
      customerPhone: orderData.customer.phone,
      customerAddress: orderData.customer.address,
      items: orderData.items,
      total: orderData.total
    });

    // Return success - order will be handled manually through dashboard
    return {
      success: true,
      message: 'Order received successfully. Admin will process manually.',
      notificationSent: false,
      notificationMethod: 'manual'
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
