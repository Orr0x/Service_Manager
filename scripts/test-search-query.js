
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
    // Dynamic search term from DB
    const { data: realCustomer } = await supabase.from('customers').select('business_name').limit(1).single();

    if (!realCustomer) {
        console.log("No customers found in DB");
        return;
    }

    const quoteTerm = realCustomer.business_name;
    console.log(`\nTesting OR QUOTES search for: "${quoteTerm}"`);

    // Two-step search:
    // 1. Find matching customers
    const { data: customers } = await supabase
        .from('customers')
        .select('id, business_name')
        .ilike('business_name', `%${quoteTerm}%`);

    console.log('Found customers:', customers?.length);
    const custIds = customers?.map(c => c.id) || [];

    // 2. Search quotes by title OR matching customer IDs
    let query = supabase
        .from('quotes')
        .select('id, quote_number, title, customers(business_name)');

    if (custIds.length > 0) {
        // Construct OR: title.ilike.val,customer_id.in.(ids)
        const idList = `(${custIds.join(',')})`;
        query = query.or(`title.ilike.%${quoteTerm}%,customer_id.in.${idList}`);
    } else {
        query = query.ilike('title', `%${quoteTerm}%`);
    }

    const { data: quoteData, error: quoteError } = await query;

    if (quoteError) console.error(quoteError);
    else console.log(`Found ${quoteData.length} quotes`);
}

testSearch().catch(console.error);
