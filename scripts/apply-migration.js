
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Client } = pg;

// Prefer POSTGRES_URL, fallback to manually constructed connection string if needed
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_CONNECTION_STRING;

if (!connectionString) {
    console.error('No connection string found. ALL Keys:', Object.keys(process.env));
    process.exit(1);
}

async function applyMigration() {
    console.log('Connection String defined. Length:', connectionString.length);
    console.log('Prefix:', connectionString.substring(0, 15));

    // If wrapped in quotes, strip them
    let cleanConnectionString = connectionString;
    if (cleanConnectionString.startsWith('"') && cleanConnectionString.endsWith('"')) {
        cleanConnectionString = cleanConnectionString.slice(1, -1);
    }

    // Autofix missing protocol
    if (!cleanConnectionString.includes('://') && !cleanConnectionString.startsWith('user=')) {
        console.log('Missing protocol, prepending postgres://');
        cleanConnectionString = 'postgres://' + cleanConnectionString;
    }

    const client = new Client({ connectionString: cleanConnectionString, ssl: { rejectUnauthorized: false } }); // Adjust SSL as needed

    try {
        await client.connect();
        console.log('Connected to database.');

        const migrationPath = process.argv[2];
        if (!migrationPath) {
            throw new Error('Please provide migration file path as argument');
        }

        const sql = fs.readFileSync(path.resolve(process.cwd(), migrationPath), 'utf8');
        console.log(`Applying migration: ${migrationPath}`);

        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
