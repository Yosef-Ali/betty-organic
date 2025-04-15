-- Migration: Add delivery cost and coupon fields to orders table
-- Description: This migration adds delivery_cost, coupon_code, discount_amount fields to the orders table
-- Created: 2025-04-14

-- Add delivery_cost column (nullable decimal)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10, 2);

-- Add coupon_code column (nullable varchar)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Add discount_amount column (nullable decimal)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2);

-- Add coupon jsonb object for storing structured coupon data
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon JSONB;

-- Comment on the new columns
COMMENT ON COLUMN public.orders.delivery_cost IS 'Cost of delivery for this order';
COMMENT ON COLUMN public.orders.coupon_code IS 'Code of the coupon applied to this order';
COMMENT ON COLUMN public.orders.discount_amount IS 'Amount of discount applied to this order';
COMMENT ON COLUMN public.orders.coupon IS 'Full coupon details including discount type, expiration, etc.';

-- Update existing orders to have default values
UPDATE public.orders SET 
  delivery_cost = 0,
  discount_amount = 0
WHERE delivery_cost IS NULL OR discount_amount IS NULL;

-- Create a function to update total_amount when delivery_cost or discount_amount changes
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
DECLARE
  items_total DECIMAL(10, 2);
BEGIN
  -- Calculate the items total from order_items table
  SELECT COALESCE(SUM(price * quantity), 0) 
  INTO items_total 
  FROM public.order_items 
  WHERE order_id = NEW.id;
  
  -- Set delivery cost to 0 if null
  IF NEW.delivery_cost IS NULL THEN
    NEW.delivery_cost := 0;
  END IF;
  
  -- Set discount amount to 0 if null
  IF NEW.discount_amount IS NULL THEN
    NEW.discount_amount := 0;
  END IF;
  
  -- Update total_amount including delivery cost and discount
  NEW.total_amount := items_total + COALESCE(NEW.delivery_cost, 0) - COALESCE(NEW.discount_amount, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update total_amount on delivery_cost/discount_amount change
DROP TRIGGER IF EXISTS update_order_total_trigger ON public.orders;
CREATE TRIGGER update_order_total_trigger
BEFORE INSERT OR UPDATE OF delivery_cost, discount_amount ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_order_total();
