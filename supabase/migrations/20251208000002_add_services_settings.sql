-- Add services_settings column to tenant_settings table
ALTER TABLE tenant_settings 
ADD COLUMN services_settings JSONB DEFAULT '{"default_currency": "GBP", "default_duration": 60, "enabled_categories": ["general"]}'::jsonb;
