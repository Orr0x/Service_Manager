
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file not found');
            return {};
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env.local:', e);
        return {};
    }
}

async function testConnection() {
    const env = loadEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env.local');
        console.log('Found keys:', Object.keys(env));
        process.exit(1);
    }

    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Try to query information_schema to list tables
        // Note: This might fail with anon key depending on permissions. 
        // If it fails, we'll try a simple select on a known table or just report the error.

        // Attempt 1: RPC call if available (unlikely for fresh setup)
        // Attempt 2: Direct query on information_schema (often restricted for anon)
        // Attempt 3: Just check if we can connect (e.g. auth.getSession)

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Auth check failed:', sessionError.message);
        } else {
            console.log('Auth connection successful.');
        }

        // Try to list tables using a query that might work if public schema is readable
        // We can't directly query information_schema with supabase-js client usually unless we use rpc or if we have permissions.
        // But we can try to select from 'tenants' to see if it exists.

        console.log('Checking for existing tables...');

        // We will try to fetch the list of tables by querying the 'tenants' table. 
        // If it errors with "relation does not exist", then the table is missing.
        // If it errors with "permission denied", the table exists but RLS blocks us (which is good/expected).

        const tablesToCheck = ['tenants', 'users', 'provider_profiles', 'services', 'service_areas'];
        const existingTables = [];
        const missingTables = [];
        const permissionDeniedTables = [];

        for (const table of tablesToCheck) {
            const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });

            if (!error) {
                existingTables.push(table);
            } else if (error.code === '42P01') { // undefined_table
                missingTables.push(table);
            } else if (error.code === '42501') { // insufficient_privilege
                permissionDeniedTables.push(table);
            } else {
                console.log(`Result for ${table}:`, error.message, error.code);
                // If we get other errors, it might mean the table exists but something else is wrong
                // For now, assume if it's not 42P01, it might exist.
                if (error.message.includes('does not exist')) {
                    missingTables.push(table);
                } else {
                    existingTables.push(table + ` (Error: ${error.message})`);
                }
            }
        }

        console.log('\nTable Status:');
        console.log('Existing (accessible):', existingTables.length > 0 ? existingTables.join(', ') : 'None');
        console.log('Existing (permission denied):', permissionDeniedTables.length > 0 ? permissionDeniedTables.join(', ') : 'None');
        console.log('Missing:', missingTables.length > 0 ? missingTables.join(', ') : 'None');

        if (existingTables.length === 0 && permissionDeniedTables.length === 0 && missingTables.length === tablesToCheck.length) {
            console.log('\nIt looks like no tables have been created yet.');
        } else if (missingTables.length === 0) {
            console.log('\nAll core tables appear to exist.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
