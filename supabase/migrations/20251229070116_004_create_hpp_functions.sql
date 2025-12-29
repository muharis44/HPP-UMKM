/*
  # Create HPP Calculation Functions
  
  1. Functions
    - `calculate_product_hpp` - Calculate HPP for a single product
    - `update_all_hpp_on_material_price_change` - Trigger to update all HPP when material price changes
    - `record_price_history` - Trigger to record price changes
  
  2. Triggers
    - On raw_materials price update, recalculate affected products HPP
*/

CREATE OR REPLACE FUNCTION calculate_product_hpp(p_product_id uuid)
RETURNS decimal AS $$
DECLARE
  v_material_cost decimal(15,2) := 0;
  v_additional_cost decimal(15,2) := 0;
  v_total_hpp decimal(15,2) := 0;
BEGIN
  SELECT COALESCE(SUM(bom.quantity * rm.current_price), 0)
  INTO v_material_cost
  FROM product_bom bom
  JOIN raw_materials rm ON rm.id = bom.raw_material_id
  WHERE bom.product_id = p_product_id;
  
  SELECT COALESCE(SUM(amount), 0)
  INTO v_additional_cost
  FROM product_additional_costs
  WHERE product_id = p_product_id;
  
  v_total_hpp := v_material_cost + v_additional_cost;
  
  UPDATE products
  SET current_hpp = v_total_hpp,
      updated_at = now()
  WHERE id = p_product_id;
  
  INSERT INTO product_hpp_history (product_id, hpp_value, material_cost, additional_cost, notes)
  VALUES (p_product_id, v_total_hpp, v_material_cost, v_additional_cost, 'Auto calculated');
  
  RETURN v_total_hpp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_hpp_on_material_change()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id uuid;
BEGIN
  IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
    INSERT INTO raw_material_price_history (raw_material_id, old_price, new_price, notes)
    VALUES (NEW.id, OLD.current_price, NEW.current_price, 'Price updated');
    
    FOR v_product_id IN 
      SELECT DISTINCT product_id FROM product_bom WHERE raw_material_id = NEW.id
    LOOP
      PERFORM calculate_product_hpp(v_product_id);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_hpp_on_material_change ON raw_materials;
CREATE TRIGGER trigger_update_hpp_on_material_change
  AFTER UPDATE ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_hpp_on_material_change();

CREATE OR REPLACE FUNCTION update_hpp_on_bom_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_product_hpp(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_product_hpp(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_hpp_on_bom_change ON product_bom;
CREATE TRIGGER trigger_update_hpp_on_bom_change
  AFTER INSERT OR UPDATE OR DELETE ON product_bom
  FOR EACH ROW
  EXECUTE FUNCTION update_hpp_on_bom_change();

CREATE OR REPLACE FUNCTION update_hpp_on_additional_cost_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_product_hpp(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_product_hpp(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_hpp_on_cost_change ON product_additional_costs;
CREATE TRIGGER trigger_update_hpp_on_cost_change
  AFTER INSERT OR UPDATE OR DELETE ON product_additional_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_hpp_on_additional_cost_change();

CREATE OR REPLACE FUNCTION update_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE raw_materials
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.raw_material_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE raw_materials
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.raw_material_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE raw_materials
    SET current_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.raw_material_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_stock ON raw_material_stock_transactions;
CREATE TRIGGER trigger_update_stock
  AFTER INSERT ON raw_material_stock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_transaction();
