-- Phase 12: Fix Trigger with Correct Enum Values
-- Date: 2025-01-10

-- Fix the trigger function to use correct price_change enum values
CREATE OR REPLACE FUNCTION update_supplier_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  IF OLD.price IS DISTINCT FROM NEW.price THEN
    NEW.last_price_update = NOW();

    IF NEW.price > OLD.price THEN
      NEW.price_change = 'up';  -- Fixed: was 'increased'
    ELSIF NEW.price < OLD.price THEN
      NEW.price_change = 'down';  -- Fixed: was 'decreased'
    ELSE
      NEW.price_change = 'stable';
    END IF;

    NEW.previous_price = OLD.price;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
