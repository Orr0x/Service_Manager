-- Create Certification Settings Table
-- Stores custom tab names for each entity type per tenant.
CREATE TABLE certification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'tenant', 'worker', 'job', 'job_site', 'customer'
    category_key TEXT NOT NULL, -- 'cat_1', 'cat_2', ... 'cat_6'
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, category_key)
);

-- Enable RLS for Settings
ALTER TABLE certification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view certification settings" ON certification_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert certification settings" ON certification_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update certification settings" ON certification_settings
    FOR UPDATE USING (auth.role() = 'authenticated');


-- Create Certifications Table
-- Links uploaded files to entities and categories
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL, -- The ID of the specific worker, job, etc. Or tenant_id for business docs.
    category_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path
    file_type TEXT NOT NULL, -- 'application/pdf', 'image/png', etc.
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Certifications
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view certifications" ON certifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert certifications" ON certifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete certifications" ON certifications
    FOR DELETE USING (auth.role() = 'authenticated');


-- Storage Bucket Setup for 'certifications'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certifications', 'certifications', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can upload certifications" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'certifications' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update certifications" ON storage.objects
    FOR UPDATE WITH CHECK (
        bucket_id = 'certifications' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Everyone can view certifications" ON storage.objects
    FOR SELECT USING (bucket_id = 'certifications');

CREATE POLICY "Authenticated users can delete certifications" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'certifications' AND
        auth.role() = 'authenticated'
    );
