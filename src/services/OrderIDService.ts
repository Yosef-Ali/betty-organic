/**
 * Service for generating and managing order IDs
 * Format: BO-YYYYMMDD-XXXX
 * Example: BO-20240313-0001
 */
export class OrderIDService {
  private static instance: OrderIDService;
  private counter: number = 0;

  private constructor() { }

  /**
   * Get the singleton instance of OrderIDService
   */
  public static getInstance(): OrderIDService {
    if (!OrderIDService.instance) {
      OrderIDService.instance = new OrderIDService();
    }
    return OrderIDService.instance;
  }

  /**
   * Generate a new order ID in the format BO-YYYYMMDD-XXXX
   * @returns string The generated order ID
   */
  public generateOrderID(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = this.getNextSequentialNumber().toString().padStart(4, '0');

    return `BO-${year}${month}${day}-${sequence}`;
  }

  /**
   * Get the next sequential number for order ID generation
   * @returns number The next number in sequence
   */
  private getNextSequentialNumber(): number {
    this.counter++;
    return this.counter;
  }

  /**
   * Get the current counter value
   * @returns number The current counter value
   */
  public getCurrentCounter(): number {
    return this.counter;
  }

  /**
   * Reset the counter to a specific value
   * @param value The value to reset the counter to
   */
  public resetCounter(value: number = 0): void {
    this.counter = value;
  }
}
