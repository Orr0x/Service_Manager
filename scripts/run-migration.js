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
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; // Fallback? No, Supabase URL is API url not DB.

    if (!connectionString) {
        console.error('Error: DATABASE_URL or POSTGRES_URL environment variable is not set.');
        // Debug: print keys
        console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('URL')));
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Neon usually
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20251205000021_storage_policies.sql');
        const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

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
