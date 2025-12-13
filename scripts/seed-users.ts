// Seed Test Users using Supabase Admin API
// Run this script with: npx ts-node scripts/seed-users.ts
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

interface TestUser {
    email: string;
    password: string;
    fullName: string;
    role: 'admin' | 'manager' | 'worker';
    tenantSlug: string;
}

const testUsers: TestUser[] = [
    // Sparkle Cleaners
    { email: 'owner@sparkle.com', password: 'password123', fullName: 'Sarah Sparkle', role: 'admin', tenantSlug: 'sparkle-cleaners' },
    { email: 'lead1@sparkle.com', password: 'password123', fullName: 'Liam Lead', role: 'manager', tenantSlug: 'sparkle-cleaners' },
    { email: 'lead2@sparkle.com', password: 'password123', fullName: 'Lisa Lead', role: 'manager', tenantSlug: 'sparkle-cleaners' },
    { email: 'worker1@sparkle.com', password: 'password123', fullName: 'Worker 1', role: 'worker', tenantSlug: 'sparkle-cleaners' },
    { email: 'worker2@sparkle.com', password: 'password123', fullName: 'Worker 2', role: 'worker', tenantSlug: 'sparkle-cleaners' },
    { email: 'worker3@sparkle.com', password: 'password123', fullName: 'Worker 3', role: 'worker', tenantSlug: 'sparkle-cleaners' },

    // FixIt Right
    { email: 'manager@fixit.com', password: 'password123', fullName: 'Frank Fixit', role: 'admin', tenantSlug: 'fixit-right' },
    { email: 'tech1@fixit.com', password: 'password123', fullName: 'Tech 1', role: 'worker', tenantSlug: 'fixit-right' },
    { email: 'tech2@fixit.com', password: 'password123', fullName: 'Tech 2', role: 'worker', tenantSlug: 'fixit-right' },
];

async function seedUsers() {
    console.log('Starting user seeding...\n');

    for (const user of testUsers) {
        try {
            // Delete existing user first (both public.users and auth.users)
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', user.email)
                .maybeSingle();

            if (existingUser) {
                console.log(`🗑️  Deleting existing ${user.email}...`);

                // Delete from public.workers first (FK constraint)
                await supabase.from('workers').delete().eq('email', user.email);

                // Delete from public.users
                await supabase.from('users').delete().eq('email', user.email);

                // Delete from auth.users via Admin API
                await supabase.auth.admin.deleteUser(existingUser.id);
            }

            // Get tenant ID
            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('slug', user.tenantSlug)
                .single();

            if (!tenant) {
                console.error(`❌ Tenant not found: ${user.tenantSlug}`);
                continue;
            }

            // Create user via Admin API (this properly sets up auth.users AND auth.identities)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Mark email as verified
                user_metadata: {
                    full_name: user.fullName,
                },
                app_metadata: {
                    tenant_id: tenant.id,
                    role: user.role,
                },
            });

            if (authError) {
                console.error(`❌ Failed to create ${user.email}:`, authError.message);
                continue;
            }

            // Create public.users record
            const firstName = user.fullName.split(' ')[0];
            const lastName = user.fullName.split(' ').slice(1).join(' ') || firstName;

            const { error: publicError } = await supabase.from('users').insert({
                id: authUser.user.id,
                tenant_id: tenant.id,
                email: user.email,
                role: user.role,
                first_name: firstName,
                last_name: lastName,
            });

            if (publicError) {
                console.error(`❌ Failed to create public.users for ${user.email}:`, publicError.message);
                continue;
            }

            // If worker, also add to workers table
            if (user.role === 'worker') {
                await supabase.from('workers').insert({
                    tenant_id: tenant.id,
                    user_id: authUser.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    email: user.email,
                    status: 'active',
                });
            }

            console.log(`✅ Created ${user.email}`);
        } catch (err) {
            console.error(`❌ Error seeding ${user.email}:`, err);
        }
    }

    console.log('\n✨ Seeding complete!');
}

seedUsers();
