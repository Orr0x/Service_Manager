
const fs = require('fs');
const path = require('path');

function checkEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.log('No .env.local file found.');
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const keys = [];
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=/);
            if (match) {
                keys.push(match[1].trim());
            }
        });

        console.log('Available keys:', keys.join(', '));

        const hasServiceKey = keys.includes('SUPABASE_SERVICE_ROLE_KEY');
        const hasDbUrl = keys.includes('DATABASE_URL');
        const hasAnonKey = keys.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

        if (hasDbUrl) {
            console.log('DATABASE_URL found. We can use a postgres client to run migrations.');
        } else if (hasServiceKey) {
            console.log('SUPABASE_SERVICE_ROLE_KEY found. We might be restricted without a direct DB connection or SQL function.');
        } else if (hasAnonKey) {
            console.log('Only NEXT_PUBLIC_SUPABASE_ANON_KEY found. This key is likely insufficient for DDL operations (DROP/CREATE TABLE).');
        } else {
            console.log('No relevant keys found.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkEnv();
