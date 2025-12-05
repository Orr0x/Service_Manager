
const { Client } = require('pg');

async function verifyDb() {
    const client = new Client({
        user: 'postgres.ktxnjsqgghjofwyludzm',
        password: 'jkdihvFRJ647GfdRE$#@',
        host: 'aws-1-eu-west-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        const tables = res.rows.map(r => r.table_name);
        console.log('Tables found:', tables.join(', '));

        const expected = ['tenants', 'users', 'provider_profiles', 'services', 'service_areas'];
        const missing = expected.filter(t => !tables.includes(t));
        const unexpected = tables.filter(t => !expected.includes(t));

        if (missing.length === 0 && unexpected.length === 0) {
            console.log('All expected tables are present and no unexpected tables found.');
        } else {
            if (missing.length > 0) console.error('Missing tables:', missing.join(', '));
            if (unexpected.length > 0) console.error('Unexpected tables:', unexpected.join(', '));
        }
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await client.end();
    }
}

verifyDb();
