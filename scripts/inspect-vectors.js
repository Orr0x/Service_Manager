
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

async function inspectVectors() {
    console.log('Inspecting Quotes Search Vectors...');

    // Fetch a few quotes
    const { data: quotes, error } = await supabase
        .from('quotes')
        .select('id, quote_number, title, search_vector')
        .limit(5);

    if (error) {
        console.error('Error fetching quotes:', error);
        return;
    }

    quotes.forEach(quote => {
        console.log(`\nQuote #${quote.quote_number} ("${quote.title}"):`);
        console.log(`Search Vector: ${JSON.stringify(quote.search_vector)}`);
    });
}

inspectVectors().catch(console.error);
