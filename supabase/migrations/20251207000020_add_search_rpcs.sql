-- RPC for searching invoices with customer joined
CREATE OR REPLACE FUNCTION search_invoices(
  p_tenant_id UUID,
  p_search_text TEXT
) RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  customer_id UUID,
  job_site_id UUID,
  invoice_number INTEGER,
  status TEXT,
  issue_date DATE,
  due_date DATE,
  total_amount DECIMAL,
  items JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  customer_business_name TEXT,
  customer_contact_name TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.tenant_id,
    i.customer_id,
    i.job_site_id,
    i.invoice_number,
    i.status,
    i.issue_date,
    i.due_date,
    i.total_amount,
    i.items,
    i.notes,
    i.created_at,
    i.updated_at,
    c.business_name AS customer_business_name,
    c.contact_name AS customer_contact_name
  FROM invoices i
  JOIN customers c ON i.customer_id = c.id
  WHERE i.tenant_id = p_tenant_id
  AND (
    CAST(i.invoice_number AS TEXT) ILIKE '%' || p_search_text || '%' OR
    i.status ILIKE '%' || p_search_text || '%' OR
    i.notes ILIKE '%' || p_search_text || '%' OR
    c.business_name ILIKE '%' || p_search_text || '%' OR
    c.contact_name ILIKE '%' || p_search_text || '%'
  )
  ORDER BY i.created_at DESC;
END;
$$;

-- RPC for searching contractors
CREATE OR REPLACE FUNCTION search_contractors(
  p_tenant_id UUID,
  p_search_text TEXT
) RETURNS SETOF contractors LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM contractors
  WHERE tenant_id = p_tenant_id
  AND (
    company_name ILIKE '%' || p_search_text || '%' OR
    contact_name ILIKE '%' || p_search_text || '%' OR
    status ILIKE '%' || p_search_text || '%' OR
    CAST(specialties AS TEXT) ILIKE '%' || p_search_text || '%'
  )
  ORDER BY created_at DESC;
END;
$$;
