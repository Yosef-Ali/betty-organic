-- Rename the table from order_item to order_items
ALTER TABLE order_item RENAME TO order_items;

-- Update foreign key constraints if they exist
ALTER TABLE order_items 
  RENAME CONSTRAINT order_item_product_id_fkey 
  TO order_items_product_id_fkey;

ALTER TABLE order_items 
  RENAME CONSTRAINT order_item_order_id_fkey 
  TO order_items_order_id_fkey;

-- Update primary key constraint if it exists
ALTER TABLE order_items 
  RENAME CONSTRAINT order_item_pkey 
  TO order_items_pkey;
