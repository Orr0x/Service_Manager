
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        user: 'postgres.ktxnjsqgghjofwyludzm', // User from pooler string
        password: 'jkdihvFRJ647GfdRE$#@',      // Password provided earlier
        host: 'aws-1-eu-west-1.pooler.supabase.com', // Pooler host
        port: 5432,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully.');

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251204000000_initial_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration executed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
