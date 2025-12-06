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

async function verifySchema() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('Error: DATABASE_URL is not set.');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'job_id';
        `);

        if (res.rows.length > 0) {
            console.log('SUCCESS: job_id column exists in invoices table.');
        } else {
            console.error('FAILURE: job_id column MISSING in invoices table.');
            process.exit(1);
        }

    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifySchema();
