-- Backfill Activity Logs for existing data

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Backfill Customers (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, customer_id, details, created_at)
    SELECT 
        id as tenant_id,
        NULL as actor_id, -- System/Unknown
        'created' as action_type,
        'customer' as entity_type,
        id as entity_id,
        id as customer_id, -- Linked to itself
        jsonb_build_object('message', 'Customer created') as details,
        created_at
    FROM customers
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'customer' AND entity_id = customers.id AND action_type = 'created'
    );

    -- 2. Backfill Job Sites (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, customer_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'job_site' as entity_type,
        id as entity_id,
        customer_id,
        jsonb_build_object('message', 'Job Site created: ' || name) as details,
        created_at
    FROM job_sites
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'job_site' AND entity_id = job_sites.id AND action_type = 'created'
    );

    -- 3. Backfill Jobs (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, customer_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'job' as entity_type,
        id as entity_id,
        customer_id,
        jsonb_build_object('message', 'Job created: ' || title) as details,
        created_at
    FROM jobs
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'job' AND entity_id = jobs.id AND action_type = 'created'
    );

    -- 4. Backfill Invoices (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, customer_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'invoice' as entity_type,
        id as entity_id,
        customer_id,
        jsonb_build_object('message', 'Invoice #' || invoice_number || ' created') as details,
        created_at
    FROM invoices
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'invoice' AND entity_id = invoices.id AND action_type = 'created'
    );

    -- 5. Backfill Quotes (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, customer_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'quote' as entity_type,
        id as entity_id,
        customer_id,
        jsonb_build_object('message', 'Quote created: ' || title) as details,
        created_at
    FROM quotes
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'quote' AND entity_id = quotes.id AND action_type = 'created'
    );

    -- 6. Backfill Contracts (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, customer_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'contract' as entity_type,
        id as entity_id,
        customer_id,
        jsonb_build_object('message', 'Contract created: ' || name) as details,
        created_at
    FROM contracts
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'contract' AND entity_id = contracts.id AND action_type = 'created'
    );

    -- 7. Backfill Contractors (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'contractor' as entity_type,
        id as entity_id,
        jsonb_build_object('message', 'Contractor created: ' || company_name) as details,
        created_at
    FROM contractors
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'contractor' AND entity_id = contractors.id AND action_type = 'created'
    );

    -- 8. Backfill Workers (Created)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, details, created_at)
    SELECT 
        tenant_id,
        NULL as actor_id,
        'created' as action_type,
        'worker' as entity_type,
        id as entity_id,
        jsonb_build_object('message', 'Worker created: ' || first_name || ' ' || last_name) as details,
        created_at
    FROM workers
    WHERE NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'worker' AND entity_id = workers.id AND action_type = 'created'
    );

    -- 9. Backfill Job Assignments (Worker)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, details, created_at)
    SELECT 
        j.tenant_id, -- Fixed: Use job's tenant_id
        NULL as actor_id,
        'job_assigned' as action_type,
        'worker' as entity_type,
        ja.worker_id as entity_id,
        jsonb_build_object(
            'message', 'Assigned to Job: ' || j.title,
            'jobId', ja.job_id
        ) as details,
        ja.created_at
    FROM job_assignments ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.worker_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'worker' AND entity_id = ja.worker_id 
        AND action_type = 'job_assigned' AND (details->>'jobId')::uuid = ja.job_id
    );

    -- 10. Backfill Job Assignments (Contractor)
    INSERT INTO activity_logs (tenant_id, actor_id, action_type, entity_type, entity_id, details, created_at)
    SELECT 
        j.tenant_id, -- Fixed: Use job's tenant_id
        NULL as actor_id,
        'job_assigned' as action_type,
        'contractor' as entity_type,
        ja.contractor_id as entity_id,
        jsonb_build_object(
            'message', 'Assigned to Job: ' || j.title,
            'jobId', ja.job_id
        ) as details,
        ja.created_at
    FROM job_assignments ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.contractor_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM activity_logs 
        WHERE entity_type = 'contractor' AND entity_id = ja.contractor_id 
        AND action_type = 'job_assigned' AND (details->>'jobId')::uuid = ja.job_id
    );
    
END $$;
