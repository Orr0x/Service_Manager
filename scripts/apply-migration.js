
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

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

    // Manual parsing to avoid pg-connection-string issues and handle unencoded passwords
    let config = { ssl: { rejectUnauthorized: false } };

    // Fallback logic
    let isHandled = false;

    if (cleanConnectionString.startsWith('postgres://') || cleanConnectionString.startsWith('postgresql://')) {
        try {
            const str = cleanConnectionString.replace(/^postgres(ql)?:\/\//, '');
            const lastAt = str.lastIndexOf('@');
            if (lastAt !== -1) {
                const creds = str.substring(0, lastAt);
                const hostPart = str.substring(lastAt + 1);

                const firstColon = creds.indexOf(':');
                if (firstColon !== -1) {
                    config.user = creds.substring(0, firstColon);
                    config.password = creds.substring(firstColon + 1);
                } else {
                    config.user = creds;
                }

                // parse hostPart: host:port/db
                const slash = hostPart.indexOf('/');
                if (slash !== -1) {
                    config.database = hostPart.substring(slash + 1);
                    const hostPort = hostPart.substring(0, slash);
                    const colon = hostPort.lastIndexOf(':');
                    if (colon !== -1) {
                        config.host = hostPort.substring(0, colon);
                        config.port = parseInt(hostPort.substring(colon + 1), 10);
                    } else {
                        config.host = hostPort;
                        config.port = 5432;
                    }
                } else {
                    // no db specified?
                    config.host = hostPart;
                    config.port = 5432;
                }
                isHandled = true;
                console.log(`Parsed connection manually: host=${config.host}, user=${config.user}`);
            }
        } catch (e) {
            console.error('Manual parsing failed:', e);
        }
    }

    if (!isHandled) {
        // Fallback to library/default if our manual logic failed (e.g. no @)
        config.connectionString = cleanConnectionString;
    }

    const client = new Client(config);

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
