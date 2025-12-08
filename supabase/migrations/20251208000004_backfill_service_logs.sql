-- Backfill activity logs for existing services

DO $$
DECLARE
    service_record RECORD;
    admin_user_id UUID;
    log_count INT := 0;
BEGIN
    -- Try to find an admin user to attribute the creation to.
    -- If no user is logged in context (e.g. migration), we pick the first user or a specific one.
    -- For safety, we can try to look up the user who created the tenant, or just pick ANY user in the tenant if possible.
    -- However, services might belong to different tenants. We must backfill per service.
    
    -- Iterate over all services that don't have a creation log
    FOR service_record IN 
        SELECT s.* 
        FROM services s
        WHERE NOT EXISTS (
            SELECT 1 FROM activity_logs al 
            WHERE al.entity_id = s.id 
            AND al.entity_type = 'service' 
            AND al.action_type = 'created'
        )
    LOOP
        -- Attempt to find a user for this tenant to be the 'actor'.
        -- We'll pick the first user found for this tenant.
        -- Attempt to find a user for this tenant to be the 'actor'.
        SELECT id INTO admin_user_id FROM auth.users 
        WHERE (raw_app_meta_data->>'tenant_id')::uuid = service_record.tenant_id 
        LIMIT 1;

        INSERT INTO activity_logs (
            tenant_id,
            actor_id,
            entity_type,
            entity_id,
            action_type,
            details,
            created_at
        ) VALUES (
            service_record.tenant_id,
            admin_user_id, -- Will be NULL if no user found, which is acceptable
            'service',
            service_record.id,
            'created',
            jsonb_build_object('name', service_record.name, 'backfilled', true),
            COALESCE(service_record.created_at, NOW())
        );
        log_count := log_count + 1;
    END LOOP;

    RAISE NOTICE 'Backfilled % service creation logs.', log_count;
END $$;
