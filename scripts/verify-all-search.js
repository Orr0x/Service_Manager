
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAll() {
    const term = "Search"; // Just a generic term, or we can fetch real data
    console.log(`\n--- Verifying CUSTOMERS Search logic ---`);
    // Replica of router logic
    const { data: custs } = await supabase.from('customers')
        .select('id, business_name')
        .or(`business_name.ilike.%${term}%,contact_name.ilike.%${term}%`)
        .limit(1);
    console.log(`Custs Query: ${custs ? 'OK' : 'FAIL'} (Count: ${custs?.length})`);

    console.log(`\n--- Verifying SERVICES Search logic ---`);
    const { data: servs, error: sErr } = await supabase.from('services')
        .select('id, name')
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`)
        .limit(1);
    if (sErr) console.error(sErr);
    else console.log(`Services Query: OK (Count: ${servs?.length})`);

    console.log(`\n--- Verifying INVOICES Search logic (2-step) ---`);
    // 1. Fetch matching customers for "Search"
    const { data: matchedCust } = await supabase.from('customers').select('id').ilike('business_name', `%${term}%`);
    const cIds = matchedCust?.map(c => c.id) || [];

    // 2. Search Invoices
    let q = supabase.from('invoices').select('id, invoice_number');
    const isNumeric = !isNaN(Number(term)) && term.trim() !== '';
    let orCond = `status.ilike.%${term}%`;

    if (isNumeric) orCond += `,invoice_number.eq.${term}`;

    if (cIds.length > 0) orCond += `,customer_id.in.(${cIds.join(',')})`;

    q = q.or(orCond).limit(1);
    const { data: invs, error: iErr } = await q;

    if (iErr) console.error(iErr);
    else console.log(`Invoices Query: OK (Count: ${invs?.length})`);
}

verifyAll().catch(console.error);
