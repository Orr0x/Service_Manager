-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who performed the action (nullable for system)
    action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'assigned', etc.
    entity_type TEXT NOT NULL, -- 'job', 'worker', 'site', 'invoice', 'quote', etc.
    entity_id UUID NOT NULL, -- ID of the entity
    details JSONB DEFAULT '{}'::jsonb, -- Additional details (e.g. "assigned to John")
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster timeline queries
CREATE INDEX idx_activity_logs_tenant_created ON activity_logs(tenant_id, created_at DESC);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their tenant"
    ON activity_logs FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- Only system/backend will insert via service role key usually, but allow users to insert their own actions if needed?
-- For now, we'll assume insertions happen via TRPC protected procedures which act as the user.
CREATE POLICY "Users can insert activities for their tenant"
    ON activity_logs FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));
