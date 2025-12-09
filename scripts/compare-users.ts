// Compare working vs seeded users
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktxnjsqgghjofwyludzm.supabase.co';
const supabaseServiceKey = 'sb_secret_inF8np618RL3HiIjpciwWw_b5j_iwz-';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function compare() {
    // Query auth.users via RPC or direct query
    const { data: users, error: usersError } = await supabase
        .rpc('get_auth_users_comparison', {
            emails: ['dageve5732@crsay.com', 'owner@sparkle.com']
        });

    if (usersError) {
        // Fallback: try direct query via REST
        console.log('RPC not available, trying direct SQL...');

        // Use the service role to query auth schema directly
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('email', ['dageve5732@crsay.com', 'owner@sparkle.com']);

        if (error) {
            console.error('Error querying public.users:', error);
        } else {
            console.log('\n=== PUBLIC.USERS ===');
            console.log(JSON.stringify(data, null, 2));
        }
    } else {
        console.log('\n=== AUTH.USERS ===');
        console.log(JSON.stringify(users, null, 2));
    }

    // Query identities
    const { data: identities, error: idError } = await supabase
        .from('identities')
        .select('*')
        .in('email', ['dageve5732@crsay.com', 'owner@sparkle.com']);

    if (!idError) {
        console.log('\n=== IDENTITIES (if accessible) ===');
        console.log(JSON.stringify(identities, null, 2));
    }

    // Get the user IDs for both
    console.log('\n=== Fetching via Admin API ===');

    // List all users and filter
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
    } else {
        const targetUsers = allUsers.users.filter(u =>
            u.email === 'dageve5732@crsay.com' || u.email === 'owner@sparkle.com'
        );

        console.log('\n=== AUTH USERS VIA ADMIN API ===');
        for (const user of targetUsers) {
            console.log(`\n--- ${user.email} ---`);
            console.log(JSON.stringify(user, null, 2));
        }
    }
}

compare();
