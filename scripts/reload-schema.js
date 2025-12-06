const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                process.env[key] = value;
            }
        });
        console.log('.env.local loaded');
    } else {
        console.log('.env.local not found at', envPath);
    }
} catch (e) {
    console.log('Could not read .env.local:', e.message);
}

async function reloadSchema() {
    // Try different common env var names for the connection string
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_CONNECTION_STRING;

    if (!connectionString) {
        console.error('Error: DATABASE_URL (or equivalent) is not set.');
        console.log('Available Env Keys:', Object.keys(process.env));
        process.exit(1);
    }

    // Check if it starts with postgres:// or postgresql://
    if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
        console.log('Connection string missing protocol, adding postgresql://');
        // It might be just host=... port=... format which pg client supports natively but maybe not via new Client(string)
        // actually new Client({ connectionString }) expects a URL.
    }
    console.log('Connection string starts with:', connectionString.substring(0, 15) + '...');

    let clientConfig;
    try {
        // Custom parser to handle passwords with @ or other special chars
        // Format: postgresql://user:password@host:port/database

        let urlStr = connectionString;
        if (urlStr.startsWith('postgres://')) urlStr = urlStr.slice(11);
        else if (urlStr.startsWith('postgresql://')) urlStr = urlStr.slice(13);

        const lastAt = urlStr.lastIndexOf('@');
        if (lastAt === -1) throw new Error('No @ found in connection string');

        const userPass = urlStr.substring(0, lastAt);
        const hostDb = urlStr.substring(lastAt + 1);

        const firstColon = userPass.indexOf(':');
        if (firstColon === -1) throw new Error('No : found in user:password section');

        const user = userPass.substring(0, firstColon);
        const password = userPass.substring(firstColon + 1);

        const firstSlash = hostDb.indexOf('/');
        const hostPort = firstSlash === -1 ? hostDb : hostDb.substring(0, firstSlash);
        const database = firstSlash === -1 ? 'postgres' : hostDb.substring(firstSlash + 1);

        const [host, port] = hostPort.split(':');

        clientConfig = {
            user,
            password, // Use raw password, pg client handles it
            host,
            port: port ? parseInt(port) : 5432,
            database,
            ssl: { rejectUnauthorized: false }
        };
        console.log('Parsed connection string manually (custom logic).');
        console.log(`Host: ${host}, User: ${user}, DB: ${database}`);

    } catch (e) {
        console.error('Failed to parse URL manually:', e);
        // Fallback
        clientConfig = {
            connectionString,
            ssl: { rejectUnauthorized: false }
        };
    }

    console.log('Connecting to database...');
    const client = new Client(clientConfig);

    try {
        await client.connect();
        console.log('Connected.');

        // 1. Verify column exists
        console.log('Verifying job_id column...');
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'job_id';
        `);

        if (res.rows.length > 0) {
            console.log('SUCCESS: job_id column exists.');
        } else {
            console.error('FAILURE: job_id column MISSING in invoices table. Migration might have failed.');
        }

        // 2. Reload Schema Cache
        console.log('Reloading PostgREST schema cache...');
        await client.query("NOTIFY pgrst, 'reload config';");
        console.log('Reload signal sent.');

    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        await client.end();
    }
}

reloadSchema();
