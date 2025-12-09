
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCustomerSearch() {
    // 1. Get a real customer name
    const { data: realCustomer } = await supabase.from('customers').select('business_name').limit(1).single();
    if (!realCustomer) { console.log('No customers in DB'); return; }

    const term = realCustomer.business_name;
    console.log(`Testing Customer Search for: "${term}"`);

    // 2. Perform search using the logic we just implemented (approximating the API logic)
    const { data: results, error } = await supabase
        .from('customers')
        .select('id, business_name')
        .or(`business_name.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`);

    if (error) console.error(error);
    else console.log(`Found ${results.length} customers matches.`);
}

verifyCustomerSearch().catch(console.error);
