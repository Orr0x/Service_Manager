
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error('Please provide an email address as the first argument.');
    console.error('Usage: npx ts-node scripts/seed-worker-data.ts <email>');
    process.exit(1);
}

async function seedWorkerData() {
    console.log(`🌱 Seeding data for worker: ${targetEmail}`);

    // 1. Find or Create User & Worker Profile
    let userId;
    let tenantId;

    // Check by email
    const { data: user } = await supabase.from('users').select('id, tenant_id').eq('email', targetEmail).single();

    if (user) {
        userId = user.id;
        tenantId = user.tenant_id;
        console.log('Found existing user.');
    } else {
        console.log('User not found. Creating mock user...');
        // Mock User Creation (Bypassing Auth Service since it's failing)
        // We need a tenant first. Let's pick 'sparkle-cleaners' or default.
        const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', 'sparkle-cleaners').single();
        if (!tenant) throw new Error('Tenant sparkle-cleaners not found');
        tenantId = tenant.id;
        userId = uuidv4();

        const { error: uError } = await supabase.from('users').insert({
            id: userId,
            tenant_id: tenantId,
            email: targetEmail,
            role: 'worker',
            first_name: 'Seed',
            last_name: 'Worker'
        });
        if (uError) throw new Error(`Failed to create mock user: ${uError.message}`);
    }

    let workerId;
    const { data: worker } = await supabase.from('workers').select('id').eq('user_id', userId).single();

    if (worker) {
        workerId = worker.id;
        console.log(`Found Worker ID: ${workerId}`);
    } else {
        console.log('Worker profile not found. Creating...');
        const { data: newWorker, error: wError } = await supabase.from('workers').insert({
            tenant_id: tenantId,
            user_id: userId,
            first_name: 'Seed',
            last_name: 'Worker',
            email: targetEmail,
            status: 'active'
        }).select().single();

        if (wError) throw new Error(`Failed to create worker profile: ${wError.message}`);
        workerId = newWorker.id;
        console.log(`Created Worker ID: ${workerId}`);
    }

    // 2. Create Customers
    const customers = [
        { business_name: 'Acme Corp', contact_name: 'Alice Manager', email: 'alice@acme.com', phone: '555-0101', type: 'business' },
        { business_name: 'Beta Industries', contact_name: 'Bob Supervisor', email: 'bob@beta.com', phone: '555-0102', type: 'business' }
    ];

    const customerIds = [];
    for (const c of customers) {
        // Check if exists
        const { data: existing } = await supabase.from('customers')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('email', c.email)
            .single();

        if (existing) {
            customerIds.push(existing.id);
        } else {
            const { data, error } = await supabase.from('customers').insert({
                tenant_id: tenantId,
                ...c
            }).select().single();

            if (error) {
                console.error(`Error Creating Customer ${c.email}:`, error.message);
            }
            if (data) customerIds.push(data.id);
        }
    }
    console.log(`Ensured ${customerIds.length} customers.`);

    // 3. Create Job Sites
    const sites = [
        { name: 'Acme HQ', address: '123 Tech Blvd', city: 'Innovation City', state: 'CA', postal_code: '90210', customer_id: customerIds[0] },
        { name: 'Beta Warehouse', address: '456 Industrial Way', city: 'Manufacturing Town', state: 'TX', postal_code: '75001', customer_id: customerIds[1] }
    ];

    const siteIds = [];
    for (const s of sites) {
        if (!s.customer_id) {
            console.error('Skipping site due to missing customer');
            continue;
        }
        const { data, error } = await supabase.from('job_sites').insert({
            tenant_id: tenantId,
            ...s
        }).select().single();

        if (error) {
            console.error(`Error Creating Site ${s.name}:`, error.message);
        }
        if (data) siteIds.push(data.id);
    }
    console.log(`Created ${siteIds.length} job sites.`);


    // 4. Create Jobs
    const now = new Date();

    // Helper to add days/hours
    const addTime = (d: Date, days: number, hours: number) => {
        const newD = new Date(d);
        newD.setDate(newD.getDate() + days);
        newD.setHours(newD.getHours() + hours);
        return newD;
    };

    const jobsData = [
        // Past (Completed)
        {
            title: 'Monthly Maintenance',
            description: 'Routine HVAC check.',
            status: 'completed',
            start_time: addTime(now, -2, 0).toISOString(),
            end_time: addTime(now, -2, 2).toISOString(),
            customer_id: customerIds[0],
            job_site_id: siteIds[0]
        },
        // Today (In Progress)
        {
            title: 'Emergency Repair',
            description: 'Leaking pipe in server room.',
            status: 'in_progress',
            start_time: addTime(now, 0, -2).toISOString(), // Started 2 hours ago
            end_time: addTime(now, 0, 2).toISOString(),
            customer_id: customerIds[0],
            job_site_id: siteIds[0]
        },
        // Today (Scheduled - Later)
        {
            title: 'Site Inspection',
            description: 'Safety check.',
            status: 'scheduled',
            start_time: addTime(now, 0, 4).toISOString(),
            end_time: addTime(now, 0, 5).toISOString(),
            customer_id: customerIds[1],
            job_site_id: siteIds[1]
        },
        // Future (Next Week)
        {
            title: 'Q3 Review',
            description: 'Walkthrough with client.',
            status: 'scheduled',
            start_time: addTime(now, 7, 0).toISOString(),
            end_time: addTime(now, 7, 1).toISOString(),
            customer_id: customerIds[1],
            job_site_id: siteIds[1]
        },
        // Unscheduled (No Dates?) - Depending on schema constraints, dates might be nullable
        // We will assume scheduled for now but status 'unscheduled' if allowed, or just far future with 'pending'
        {
            title: 'Pending Equipment Install',
            description: 'Waiting on parts.',
            status: 'draft', // or pending
            start_time: null,
            end_time: null,
            customer_id: customerIds[0],
            job_site_id: siteIds[0]
        }
    ];

    for (const job of jobsData) {
        // Remove null dates if schema forces not null, but usually start_time is nullable for drafts
        const { data: jobData, error } = await supabase.from('jobs').insert({
            tenant_id: tenantId,
            ...job
        }).select().single();

        if (error) {
            console.error('Error creating job:', error.message);
            continue;
        }

        if (jobData) {
            // Assign to worker
            await supabase.from('job_assignments').insert({
                tenant_id: tenantId,
                job_id: jobData.id,
                worker_id: workerId,
                status: job.status === 'completed' ? 'completed' : 'assigned'
            });
        }
    }

    console.log(`✅ Seeded 5 jobs for ${targetEmail}`);
}

seedWorkerData();
