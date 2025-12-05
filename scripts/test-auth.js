
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

async function testAdminCreation() {
    const env = loadEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase credentials (URL or Service Role Key) in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const testEmail = `test-worker-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testTenantId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID, might fail FK constraint if tenants table is empty

    console.log(`Attempting to create user: ${testEmail}`);

    // 1. Create a tenant first to satisfy FK
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name: 'Test Tenant', slug: `test-tenant-${Date.now()}` })
        .select()
        .single();

    if (tenantError) {
        console.error('Failed to create test tenant:', tenantError);
        // If tenant creation fails, we can't proceed with user creation due to FK
        process.exit(1);
    }

    console.log('Created test tenant:', tenant.id);

    // 2. Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { role: 'provider', tenant_id: tenant.id }
    });

    if (authError) {
        console.error('Failed to create auth user:', authError);
        process.exit(1);
    }

    console.log('Created auth user:', authUser.user.id);

    // 3. Create user in public.users
    const { error: dbError } = await supabase
        .from('users')
        .insert({
            id: authUser.user.id,
            email: testEmail,
            role: 'provider',
            tenant_id: tenant.id
        });

    if (dbError) {
        console.error('Failed to create public user:', dbError);
        process.exit(1);
    }

    console.log('Created public user successfully.');

    // 4. Verify data sync (optional, check if trigger worked for updates if we were testing that)
    // For now, just verifying creation flow is enough.

    console.log('Test passed!');
}

testAdminCreation();
