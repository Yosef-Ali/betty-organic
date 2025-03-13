import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

export class OrderIDService {
  private static instance: OrderIDService;
  private counterKey = 'order_counter';
  private prefix = 'BO';
  private supabaseClient: SupabaseClient<Database> | null = null;

  private constructor() { }

  public static getInstance(): OrderIDService {
    if (!OrderIDService.instance) {
      OrderIDService.instance = new OrderIDService();
    }
    return OrderIDService.instance;
  }

  private async getSupabaseClient(): Promise<SupabaseClient<Database>> {
    if (!this.supabaseClient) {
      this.supabaseClient = await createClient();
    }
    return this.supabaseClient;
  }

  /**
   * Generates a unique order ID in the format BO-YYYYMMDD-XXXX
   */
  public async generateOrderID(): Promise<string> {
    const sequentialNumber = await this.getNextSequentialNumber();
    return this.formatOrderID(sequentialNumber);
  }

  /**
   * Gets the next sequential number for the current day
   */
  private async getNextSequentialNumber(): Promise<number> {
    const supabase = await this.getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    const counterKey = `${this.counterKey}_${today}`;

    // Attempt to get the current counter
    const { data: currentCounter } = await supabase
      .from('system_counters')
      .select('counter_value')
      .eq('counter_key', counterKey)
      .single();

    if (!currentCounter) {
      // Initialize counter for the day
      const { error } = await supabase
        .from('system_counters')
        .insert({
          counter_key: counterKey,
          counter_value: 1,
        });

      if (error) {
        throw new Error(`Failed to initialize counter: ${error.message}`);
      }

      return 1;
    }

    // Increment the counter
    const { data: updatedCounter, error: updateError } = await supabase
      .from('system_counters')
      .update({ counter_value: currentCounter.counter_value + 1 })
      .eq('counter_key', counterKey)
      .select()
      .single();

    if (updateError || !updatedCounter) {
      throw new Error(`Failed to update counter: ${updateError?.message}`);
    }

    return updatedCounter.counter_value;
  }

  /**
   * Formats the order ID using the current date and sequential number
   */
  private formatOrderID(sequentialNumber: number): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sequence = sequentialNumber.toString().padStart(4, '0');
    return `${this.prefix}-${date}-${sequence}`;
  }

  /**
   * Gets the current counter value for the day without incrementing
   */
  public async getCurrentCounter(): Promise<number> {
    const supabase = await this.getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    const counterKey = `${this.counterKey}_${today}`;

    const { data: counter } = await supabase
      .from('system_counters')
      .select('counter_value')
      .eq('counter_key', counterKey)
      .single();

    return counter?.counter_value || 0;
  }
}

// Export a singleton instance
export const orderIdService = OrderIDService.getInstance();
