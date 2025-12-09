// Fix: Clean up orphaned auth.users and recreate test users properly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktxnjsqgghjofwyludzm.supabase.co';
const supabaseServiceKey = 'sb_secret_inF8np618RL3HiIjpciwWw_b5j_iwz-';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: 'public'
    }
});

const testEmails = [
    'owner@sparkle.com',
    'lead1@sparkle.com',
    'lead2@sparkle.com',
    'worker1@sparkle.com',
    'worker2@sparkle.com',
    'worker3@sparkle.com',
    'worker4@sparkle.com',
    'worker5@sparkle.com',
    'worker6@sparkle.com',
    'worker7@sparkle.com',
    'manager@fixit.com',
    'tech1@fixit.com',
    'tech2@fixit.com',
    'tech3@fixit.com',
    'tech4@fixit.com',
    'tech5@fixit.com',
];

async function fixUsers() {
    console.log('=== Checking public.users for test accounts ===\n');

    // First, let's see what's in public.users
    const { data: publicUsers, error: pubError } = await supabase
        .from('users')
        .select('id, email, tenant_id, role')
        .in('email', testEmails);

    if (pubError) {
        console.error('Error querying public.users:', pubError.message);
    } else {
        console.log('Public.users test accounts:', publicUsers?.length || 0);
        publicUsers?.forEach(u => console.log(`  - ${u.email} (tenant: ${u.tenant_id})`));
    }

    console.log('\n=== Checking auth.users state ===');

    // Try to get auth user by email directly
    for (const email of ['owner@sparkle.com', 'dageve5732@crsay.com']) {
        const { data, error } = await supabase.auth.admin.getUserByEmail(email);
        if (error) {
            console.log(`\n${email}: ERROR - ${error.message}`);
        } else if (data) {
            console.log(`\n${email}:`);
            console.log(`  id: ${data.user.id}`);
            console.log(`  email_confirmed: ${data.user.email_confirmed_at ? 'YES' : 'NO'}`);
            console.log(`  app_metadata: ${JSON.stringify(data.user.app_metadata)}`);
            console.log(`  identities: ${data.user.identities?.length || 0}`);
        }
    }
}

fixUsers();
