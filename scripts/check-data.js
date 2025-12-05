const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envPath = path.join(__dirname, '../.env.local');
let connectionString = '';

try {
    const envFile = fs.readFileSync(envPath, 'utf8');

    // Try to match SUPABASE_CONNECTION_STRING
    const match = envFile.match(/SUPABASE_CONNECTION_STRING=(.*)/);
    if (match && match[1]) {
        connectionString = match[1].trim().replace(/^["']|["']$/g, '');
    }

    if (!connectionString) {
        // Fallback to DATABASE_URL
        const matchDb = envFile.match(/DATABASE_URL=(.*)/);
        if (matchDb && matchDb[1]) {
            connectionString = matchDb[1].trim().replace(/^["']|["']$/g, '');
        }
    }
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

console.log('Connection string found:', !!connectionString);
if (connectionString) {
    console.log('Connection string starts with:', connectionString.substring(0, 10) + '...');
}

if (!connectionString) {
    console.error('Error: SUPABASE_CONNECTION_STRING or DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function checkData() {
    try {
        await client.connect();
        console.log('Connected to database.');

        console.log('\n--- Tenants ---');
        const tenants = await client.query('SELECT * FROM tenants');
        console.table(tenants.rows);

        console.log('\n--- Public Users (public.users) ---');
        const users = await client.query('SELECT * FROM users');
        console.table(users.rows);

        console.log('\n--- Auth Users (auth.users - limited view) ---');
        // We try to fetch what we can. 
        try {
            const authUsers = await client.query('SELECT id, email, raw_app_meta_data FROM auth.users');
            console.table(authUsers.rows.map(u => ({
                id: u.id,
                email: u.email,
                role: u.raw_app_meta_data?.role,
                tenant_id: u.raw_app_meta_data?.tenant_id
            })));
        } catch (e) {
            console.log('Could not query auth.users directly (permission denied likely):', e.message);
        }

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await client.end();
    }
}

checkData();
