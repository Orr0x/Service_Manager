ALTER TABLE invoices ADD COLUMN quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
