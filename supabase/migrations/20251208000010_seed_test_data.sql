-- Seed Data Migration
-- Creates 2 Tenants: Sparkle Cleaners & FixIt Right
-- Populates Users, Customers, Contractors, Services, Jobs, Quotes, Invoices

-- Relax constraints to allow manager and worker roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('provider', 'admin', 'staff', 'customer', 'manager', 'worker'));

BEGIN;

DO $$
DECLARE
    -- Common config
    pw_hash text := '$2b$12$TpY44NI/PjlMqT1N3lJ/FeTPTLP5hJKrlN5MYPuBdzn/FahA9hMXi'; -- "password123"
    
    -- Tenant 1: Sparkle Cleaners
    t1_id uuid;
    u_sp_owner uuid := gen_random_uuid();
    u_sp_lead1 uuid := gen_random_uuid();
    u_sp_lead2 uuid := gen_random_uuid();
    c_sp_customer uuid;
    j_sp_job uuid;
    
    -- Tenant 2: FixIt Right
    t2_id uuid;
    u_fx_owner uuid := gen_random_uuid();
    
    -- Loop vars
    i integer;
    new_user_id uuid;
    new_worker_id uuid;
    new_cust_id uuid;
    new_site_id uuid;
    
    -- Temp vars
    existing_t1 uuid;
    existing_t2 uuid;
BEGIN
    ---------------------------------------------------------------------------
    -- TENANT 1: SPARKLE CLEANERS
    ---------------------------------------------------------------------------
    
    -- Check for existing tenant
    SELECT id INTO existing_t1 FROM public.tenants WHERE slug = 'sparkle-cleaners';
    
    IF existing_t1 IS NOT NULL THEN
        t1_id := existing_t1;
        -- Optional: Update settings if needed, but for now we skip invalid duplications
        -- We won't re-insert if it exists to avoid conflicts, or use UPSERT if preferred. 
        -- Simplest fix for "already exists" is just to reuse ID.
        -- We DO need to ensure we don't break downstream constraints if we re-run.
        -- But first solving the immediate blocker.
    ELSE
        t1_id := gen_random_uuid();
        INSERT INTO public.tenants (id, name, slug) VALUES (t1_id, 'Sparkle Cleaners', 'sparkle-cleaners');
        
        -- Settings (only insert if tenant is new)
        INSERT INTO public.tenant_settings (tenant_id, services_settings)
        VALUES (t1_id, '{"default_currency": "USD", "default_duration": 120, "enabled_categories": ["cleaning", "janitorial", "sanitization"]}');
    END IF;

    -- Owner
    -- Clean up any existing record to ensure we create a valid one with identities
    DELETE FROM public.users WHERE email = 'owner@sparkle.com';
    DELETE FROM auth.users WHERE email = 'owner@sparkle.com';
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', u_sp_owner, 'authenticated', 'authenticated', 'owner@sparkle.com', pw_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Sarah Sparkle"}'::jsonb, now(), now());
    
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_sp_owner, u_sp_owner::text, jsonb_build_object('sub', u_sp_owner, 'email', 'owner@sparkle.com'), 'email', now(), now(), now());

    INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
    VALUES (u_sp_owner, t1_id, 'admin', 'Sarah', 'Sparkle', 'owner@sparkle.com');

    -- Team Lead 1
    DELETE FROM public.users WHERE email = 'lead1@sparkle.com';
    DELETE FROM auth.users WHERE email = 'lead1@sparkle.com';
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', u_sp_lead1, 'authenticated', 'authenticated', 'lead1@sparkle.com', pw_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Liam Lead"}'::jsonb, now(), now());
    
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_sp_lead1, u_sp_lead1::text, jsonb_build_object('sub', u_sp_lead1, 'email', 'lead1@sparkle.com'), 'email', now(), now(), now());

    INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
    VALUES (u_sp_lead1, t1_id, 'manager', 'Liam', 'Lead', 'lead1@sparkle.com');

    -- Team Lead 2
    DELETE FROM public.users WHERE email = 'lead2@sparkle.com';
    DELETE FROM auth.users WHERE email = 'lead2@sparkle.com';
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', u_sp_lead2, 'authenticated', 'authenticated', 'lead2@sparkle.com', pw_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Lisa Lead"}'::jsonb, now(), now());
    
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_sp_lead2, u_sp_lead2::text, jsonb_build_object('sub', u_sp_lead2, 'email', 'lead2@sparkle.com'), 'email', now(), now(), now());

    INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
    VALUES (u_sp_lead2, t1_id, 'manager', 'Lisa', 'Lead', 'lead2@sparkle.com');

    -- 7 Workers
    FOR i IN 1..7 LOOP
        -- Clean up
        DELETE FROM public.workers WHERE email = 'worker' || i || '@sparkle.com';
        DELETE FROM public.users WHERE email = 'worker' || i || '@sparkle.com';
        DELETE FROM auth.users WHERE email = 'worker' || i || '@sparkle.com';
        
        new_user_id := gen_random_uuid();
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 'worker' || i || '@sparkle.com', pw_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, ('{"full_name":"Worker ' || i || '"}')::jsonb, now(), now());
        
        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES (gen_random_uuid(), new_user_id, new_user_id::text, jsonb_build_object('sub', new_user_id, 'email', 'worker' || i || '@sparkle.com'), 'email', now(), now(), now());

        INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
        VALUES (new_user_id, t1_id, 'worker', 'Clean', 'Worker ' || i, 'worker' || i || '@sparkle.com');
        
        INSERT INTO public.workers (tenant_id, user_id, first_name, last_name, email, status)
        VALUES (t1_id, new_user_id, 'Clean', 'Worker ' || i, 'worker' || i || '@sparkle.com', 'active');
    END LOOP;

    -- 2. CONTRACTORS (5 External)
    INSERT INTO public.contractors (tenant_id, company_name, contact_name, email, specialties, status) VALUES
    (t1_id, 'Zap Electric', 'Eddie Sparks', 'eddie@zap.com', '["Electrical"]'::jsonb, 'active'),
    (t1_id, 'Flow Plumbing', 'Mario Pipes', 'mario@flow.com', '["Plumbing"]'::jsonb, 'active'),
    (t1_id, 'WoodWorks', 'Chip Sawyer', 'chip@wood.com', '["Carpentry"]'::jsonb, 'active'),
    (t1_id, 'SafeGas', 'Gary Gas', 'gary@safegas.com', '["Gas"]'::jsonb, 'active'),
    (t1_id, 'FixAll Maintenance', 'Bob Builder', 'bob@fixall.com', '["Maintenance"]'::jsonb, 'active');

    -- 3. SERVICES
    INSERT INTO public.services (tenant_id, name, description, duration_minutes, base_price, category) VALUES
    (t1_id, 'Deep Clean - Residential', 'Full deep clean of 3-bed house', 240, 350.00, 'cleaning'),
    (t1_id, 'Standard Clean', 'Ranking upkeep clean', 90, 120.00, 'cleaning'),
    (t1_id, 'Office Janitorial', 'Evening office cleaning', 120, 180.00, 'janitorial'),
    (t1_id, 'Carpet Steam', 'Steam cleaning per room', 45, 60.00, 'cleaning');

    -- 4. CUSTOMERS & JOBS
    FOR i IN 1..8 LOOP
        new_cust_id := gen_random_uuid();
        INSERT INTO public.customers (id, tenant_id, business_name, contact_name, email, phone, type, is_active)
        VALUES (new_cust_id, t1_id, 'Customer ' || i || ' Ltd', 'Contact ' || i, 'cust' || i || '@client.com', '555-010' || i, 'business', true);
        
        -- Job Site
        new_site_id := gen_random_uuid();
        INSERT INTO public.job_sites (id, tenant_id, customer_id, name, address, is_active)
        VALUES (new_site_id, t1_id, new_cust_id, 'HQ Site', '123 Business Rd, Building ' || i, true);

        -- Jobs (Mix of status)
        -- Job 1: Scheduled
        INSERT INTO public.jobs (tenant_id, customer_id, job_site_id, title, status, start_time, end_time, priority)
        VALUES (t1_id, new_cust_id, new_site_id, 'Weekly Clean', 'scheduled', now() + (i || ' days')::interval, now() + (i || ' days')::interval + '2 hours'::interval, 'normal');
        
        -- Job 2: Draft
        INSERT INTO public.jobs (tenant_id, customer_id, job_site_id, title, status, priority)
        VALUES (t1_id, new_cust_id, new_site_id, 'Pending Deep Clean', 'draft', 'low');

         -- Quote
         INSERT INTO public.quotes (tenant_id, customer_id, job_site_id, title, status, total_amount, issued_date)
         VALUES (t1_id, new_cust_id, new_site_id, 'Q-100' || i, 'draft', 500.00, now());

         -- Invoice
         INSERT INTO public.invoices (tenant_id, customer_id, job_site_id, status, total_amount, issue_date, due_date)
         VALUES (t1_id, new_cust_id, new_site_id, 'paid', 150.00, now() - '5 days'::interval, now() + '25 days'::interval);
    END LOOP;

    ---------------------------------------------------------------------------
    -- TENANT 2: FIXIT RIGHT (Maintenance)
    ---------------------------------------------------------------------------
    SELECT id INTO existing_t2 FROM public.tenants WHERE slug = 'fixit-right';

    IF existing_t2 IS NOT NULL THEN
        t2_id := existing_t2;
    ELSE
        t2_id := gen_random_uuid();
        INSERT INTO public.tenants (id, name, slug) VALUES (t2_id, 'FixIt Right', 'fixit-right');
        INSERT INTO public.tenant_settings (tenant_id, services_settings)
        VALUES (t2_id, '{"default_currency": "GBP", "default_duration": 60, "enabled_categories": ["maintenance", "carpentry", "electrical"]}');
    END IF;

    -- Owner
    DELETE FROM public.users WHERE email = 'manager@fixit.com';
    DELETE FROM auth.users WHERE email = 'manager@fixit.com';
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', u_fx_owner, 'authenticated', 'authenticated', 'manager@fixit.com', pw_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Frank Fixit"}'::jsonb, now(), now());
    
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_fx_owner, u_fx_owner::text, jsonb_build_object('sub', u_fx_owner, 'email', 'manager@fixit.com'), 'email', now(), now(), now());
    
    INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
    VALUES (u_fx_owner, t2_id, 'admin', 'Frank', 'Fixit', 'manager@fixit.com');

    -- Workers (5)
    FOR i IN 1..5 LOOP
        -- Clean up
        DELETE FROM public.workers WHERE email = 'tech' || i || '@fixit.com';
        DELETE FROM public.users WHERE email = 'tech' || i || '@fixit.com';
        DELETE FROM auth.users WHERE email = 'tech' || i || '@fixit.com';
        
        new_user_id := gen_random_uuid();
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 'tech' || i || '@fixit.com', pw_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, ('{"full_name":"Tech ' || i || '"}')::jsonb, now(), now());
        
        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES (gen_random_uuid(), new_user_id, new_user_id::text, jsonb_build_object('sub', new_user_id, 'email', 'tech' || i || '@fixit.com'), 'email', now(), now(), now());

        INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
        VALUES (new_user_id, t2_id, 'worker', 'Tech', 'Num ' || i, 'tech' || i || '@fixit.com');
        
        INSERT INTO public.workers (tenant_id, user_id, first_name, last_name, email, status)
        VALUES (t2_id, new_user_id, 'Tech', 'Num ' || i, 'tech' || i || '@fixit.com', 'active');
    END LOOP;

    -- Services
    INSERT INTO public.services (tenant_id, name, description, duration_minutes, base_price, category) VALUES
    (t2_id, 'Door Hanging', 'Install internal door', 60, 80.00, 'carpentry'),
    (t2_id, 'Lock Change', 'Standard cylinder replacement', 30, 95.00, 'security'),
    (t2_id, 'Decking Repair', 'Replace rotten boards', 180, 450.00, 'maintenance');

    -- Random Data for Tenant 2
    FOR i IN 1..5 LOOP
        new_cust_id := gen_random_uuid();
        INSERT INTO public.customers (id, tenant_id, business_name, contact_name, email, type, is_active)
        VALUES (new_cust_id, t2_id, 'FixIt Client ' || i, 'Homeowner ' || i, 'client' || i || '@home.com', 'individual', true);
        
        -- Job
         INSERT INTO public.jobs (tenant_id, customer_id, title, status, priority)
        VALUES (t2_id, new_cust_id, 'Repair Job ' || i, 'unassigned', 'high');
    END LOOP;

END $$;

COMMIT;
