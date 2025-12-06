const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.join(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key] = value;
        }
    });
} catch (e) {
    console.log('Could not read .env.local, relying on process.env');
}

async function runMigration() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_CONNECTION_STRING;

    if (!connectionString) {
        console.error('Error: DATABASE_URL or POSTGRES_URL environment variable is not set.');
        // Debug: print keys
        console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('URL')));
        process.exit(1);
    }

    let clientConfig;
    try {
        // Custom parser to handle passwords with @ or other special chars
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
            password,
            host,
            port: port ? parseInt(port) : 5432,
            database,
            ssl: { rejectUnauthorized: false }
        };
        console.log('Parsed connection string manually.');
    } catch (e) {
        console.error('Failed to parse URL manually:', e);
        clientConfig = {
            connectionString,
            ssl: { rejectUnauthorized: false }
        };
    }

    const client = new Client(clientConfig);

    try {
        await client.connect();
        console.log('Connected to database.');

        const migrationFile = path.join(__dirname, '../supabase/migrations/20251205000024_add_address_columns.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Running migration...');

        await client.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
