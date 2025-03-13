import { createClient } from '@/lib/supabase/server';

export class OrderIDService {
  private static instance: OrderIDService;
  private counterKey = 'order_counter';
  private prefix = 'BO';

  private constructor() { }

  public static getInstance(): OrderIDService {
    if (!OrderIDService.instance) {
      OrderIDService.instance = new OrderIDService();
    }
    return OrderIDService.instance;
  }

  /**
   * Generates a unique order ID in the format BO-YYYYMMDD-XXXX
   */
  public async generateOrderID(): Promise<string> {
    const sequentialNumber = await this.getNextSequentialNumber();
    return this.formatOrderID(sequentialNumber);
  }

  /**
   * Gets the next sequential number using the database function
   */
  private async getNextSequentialNumber(): Promise<number> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const counterKey = `${this.counterKey}_${today}`;

    // Use the database function to get and increment the counter
    const { data, error } = await supabase
      .rpc('get_and_increment_counter', {
        counter_key_param: counterKey
      });

    if (error) {
      console.error('Failed to get next counter value:', error);
      throw new Error(`Counter increment failed: ${error.message}`);
    }

    // Log the result for debugging
    console.log('Counter value received:', data);

    // The function returns the current counter value
    return data || 1;
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
   * Resets counter for a specific day (admin only)
   */
  public async resetCounter(date: string): Promise<void> {
    const supabase = await createClient();
    const counterKey = `${this.counterKey}_${date}`;

    const { error } = await supabase
      .rpc('reset_counter', {
        counter_key_param: counterKey
      });

    if (error) {
      console.error('Failed to reset counter:', error);
      throw new Error(`Counter reset failed: ${error.message}`);
    }
  }

  /**
   * Gets the current counter value without incrementing (for debugging)
   */
  public async getCurrentValue(date: string): Promise<number> {
    const supabase = await createClient();
    const counterKey = `${this.counterKey}_${date}`;

    const { data, error } = await supabase
      .from('system_counters')
      .select('counter_value')
      .eq('counter_key', counterKey)
      .single();

    if (error) {
      console.error('Failed to get current counter value:', error);
      return 0;
    }

    return data?.counter_value || 0;
  }
}

// Export a singleton instance
export const orderIdService = OrderIDService.getInstance();
