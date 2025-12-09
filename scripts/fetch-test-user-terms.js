
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER = {
    email: 'dageve5732@crsay.com',
    password: 'password123',
};

async function fetchTerms() {
    console.log('Logging in as test user...');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password,
    });

    if (authError || !session) {
        console.error('Login failed:', authError);
        return;
    }

    // Create client with user session
    const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } }
    });

    // Get User's Tenant
    const { data: userData } = await userClient
        .from('users')
        .select('id, email, tenant_id')
        .eq('email', TEST_USER.email)
        .single();

    if (!userData?.tenant_id) {
        const { data: userLink } = await userClient.from('users').select('*').limit(1);
        console.error('Could not find tenant_id for user. User data available:', userLink);
        // Fallback: try to see if there is ANY tenant?
        // But typically we need tenant_id to insert.
        return;
    }

    const tenantId = userData.tenant_id;
    console.log(`User Tenant ID: ${tenantId}`);

    const results = {};

    // Helper to fetch or create
    async function getOrCreate(table, select, createData, resultKey) {
        // Fetch
        let { data } = await userClient
            .from(table)
            .select(select + ', tenant_id')
            .eq('tenant_id', tenantId)
            .limit(1);

        if (!data || data.length === 0) {
            console.log(`No ${table} found for tenant. Creating one...`);
            const { data: newData, error } = await userClient
                .from(table)
                .insert({ ...createData, tenant_id: tenantId })
                .select()
                .single();

            if (error) {
                console.error(`Failed to create ${table}:`, error);
                return null;
            }
            data = [newData];
        }

        return data[0];
    }

    // Job Sites
    const site = await getOrCreate('job_sites', 'id, name, address, city', {
        name: 'Searchable Job Site',
        address: '777 Search Lane',
        city: 'SearchCity',
        state: 'ST',
        postal_code: '54321',
        country: 'SearchLand'
    });
    if (site) {
        results.jobSiteName = site.name;
        results.jobSiteAddress = site.address;
        results.jobSiteCity = site.city;
    }

    // Customers (needed for contracts/quotes)
    const customer = await getOrCreate('customers', 'id, business_name', {
        business_name: 'Searchable Customer',
        contact_name: 'Search Contact',
        email: 'search@customer.com'
    });

    // Contracts
    if (customer) {
        const contract = await getOrCreate('contracts', 'name', {
            name: 'Searchable Contract',
            customer_id: customer.id,
            status: 'draft',
            total_value: 1000,
            start_date: new Date().toISOString()
        });
        if (contract) results.contractName = contract.name;

        // Quotes
        const quote = await getOrCreate('quotes', 'quote_number, title', {
            title: 'Searchable Quote',
            customer_id: customer.id,
            status: 'draft',
            total_amount: 500,
            issued_date: new Date().toISOString()
        });
        if (quote) {
            results.quoteNumber = quote.quote_number;
            results.quoteTitle = quote.title;
        }
    }

    // Jobs
    if (customer && site) {
        const job = await getOrCreate('jobs', 'title', {
            title: 'Searchable Job',
            customer_id: customer.id,
            job_site_id: site.id,
            priority: 'medium',
            status: 'scheduled'
        });
        if (job) results.jobTitle = job.title;
    }

    // Workers
    const worker = await getOrCreate('workers', 'first_name', {
        first_name: 'SearchWorker',
        last_name: 'Findable',
        email: 'searchworker@example.com',
        status: 'active'
    });
    if (worker) results.workerName = worker.first_name;

    console.log('Found terms:', results);

    // Write to file
    fs.writeFileSync(
        path.resolve(process.cwd(), 'tests/fixtures/search-terms.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('Updated tests/fixtures/search-terms.json');
}

fetchTerms().catch(console.error);
