-- Fix for order total calculation with delivery cost and discount
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

  -- Ensure we don't overwrite a valid total_amount value with zero
  -- when there are no items yet but a value was provided
  IF items_total = 0 AND NEW.total_amount > 0 THEN
    -- Leave the existing total_amount as is
    NULL;
  ELSE
    -- Update total_amount including delivery cost and discount
    NEW.total_amount := items_total + COALESCE(NEW.delivery_cost, 0) - COALESCE(NEW.discount_amount, 0);
  END IF;
  
  -- Ensure total_amount is never negative
  IF NEW.total_amount < 0 THEN
    NEW.total_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_order_total_trigger ON public.orders;
CREATE TRIGGER update_order_total_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_order_total();

-- Update existing orders to fix their total amounts
UPDATE public.orders SET 
  total_amount = (
    SELECT COALESCE(SUM(price * quantity), 0) 
    FROM public.order_items 
    WHERE order_id = orders.id
  ) + COALESCE(delivery_cost, 0) - COALESCE(discount_amount, 0)
WHERE total_amount = 0 AND EXISTS (
  SELECT 1 FROM public.order_items WHERE order_id = orders.id
);
