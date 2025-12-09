const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function inspectVectors() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
        console.error('No DB URL found');
        return;
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const tables = ['customers', 'jobs', 'workers', 'checklists'];

        for (const table of tables) {
            console.log(`\n--- Inspecting ${table} ---`);
            try {
                // Check if column exists
                const res = await client.query(`
                    SELECT count(*) as total, 
                           count(search_vector) as filled,
                           count(*) FILTER (WHERE search_vector IS NULL) as nulls
                    FROM ${table}
                `);
                console.log(`Stats: Total=${res.rows[0].total}, Filled=${res.rows[0].filled}, Nulls=${res.rows[0].nulls}`);

                if (res.rows[0].filled > 0) {
                    const sample = await client.query(`SELECT search_vector FROM ${table} LIMIT 1`);
                    console.log('Sample vector:', JSON.stringify(sample.rows[0].search_vector));
                }
            } catch (e) {
                console.log(`Error querying ${table}:`, e.message);
            }
        }

    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

inspectVectors();
