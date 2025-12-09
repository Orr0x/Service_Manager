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
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
} catch (e) {
    console.log('Could not read .env.local, relying on process.env');
}

async function inspect() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    // Reuse parsing logic
    let clientConfig;
    try {
        let urlStr = connectionString;
        if (urlStr.startsWith('postgres://')) urlStr = urlStr.slice(11);
        else if (urlStr.startsWith('postgresql://')) urlStr = urlStr.slice(13);
        const lastAt = urlStr.lastIndexOf('@');
        const userPass = urlStr.substring(0, lastAt);
        const hostDb = urlStr.substring(lastAt + 1);
        const firstColon = userPass.indexOf(':');
        const user = userPass.substring(0, firstColon);
        const password = userPass.substring(firstColon + 1);
        const firstSlash = hostDb.indexOf('/');
        const hostPort = firstSlash === -1 ? hostDb : hostDb.substring(0, firstSlash);
        const database = firstSlash === -1 ? 'postgres' : hostDb.substring(firstSlash + 1);
        const [host, port] = hostPort.split(':');
        clientConfig = { user, password, host, port: port ? parseInt(port) : 5432, database, ssl: { rejectUnauthorized: false } };
    } catch (e) { clientConfig = { connectionString, ssl: { rejectUnauthorized: false } }; }

    const client = new Client(clientConfig);

    try {
        await client.connect();

        console.log('--- CHECKLISTS ---');
        const checklists = await client.query('SELECT name, search_vector FROM checklists LIMIT 3');
        checklists.rows.forEach(r => console.log(`Name: ${r.name}, Vector: ${JSON.stringify(r.search_vector)}`));

        console.log('\n--- JOBS ---');
        const jobs = await client.query('SELECT title, search_vector FROM jobs LIMIT 3');
        jobs.rows.forEach(r => console.log(`Title: ${r.title}, Vector: ${JSON.stringify(r.search_vector)}`));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

inspect();
