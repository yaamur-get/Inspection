-- Add name_table column to sub_items table
ALTER TABLE sub_items ADD COLUMN IF NOT EXISTS name_table TEXT;
