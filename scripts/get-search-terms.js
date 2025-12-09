const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function getTerms() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: Missing Supabase URL or Key in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results = {};

    try {
        // 1. Job Sites
        const { data: jobSites } = await supabase.from('job_sites').select('name, city').limit(1);
        if (jobSites && jobSites.length) {
            results.jobSiteName = jobSites[0].name;
            results.jobSiteCity = jobSites[0].city;
        }

        const { data: jobSitesAddr } = await supabase.from('job_sites')
            .select('address')
            .neq('address', null)
            .neq('address', '')
            .limit(1);

        if (jobSitesAddr && jobSitesAddr.length) {
            results.jobSiteAddress = jobSitesAddr[0].address;
        }

        // 2. Contracts
        const { data: contracts } = await supabase.from('contracts').select('name').limit(1);
        if (contracts && contracts.length) results.contractName = contracts[0].name;

        // 3. Quotes
        const { data: quotes } = await supabase.from('quotes').select('quote_number').limit(1);
        if (quotes && quotes.length) results.quoteNumber = quotes[0].quote_number;

        // 4. Jobs
        const { data: jobs } = await supabase.from('jobs').select('title').limit(1);
        if (jobs && jobs.length) results.jobTitle = jobs[0].title;

        // 5. Workers
        const { data: workers } = await supabase.from('workers').select('first_name').limit(1);
        if (workers && workers.length) results.workerName = workers[0].first_name;

        // 6. Services
        const { data: services } = await supabase.from('services').select('name').limit(1);
        if (services && services.length) results.serviceName = services[0].name;

        // 7. Checklists
        const { data: checklists } = await supabase.from('checklists').select('name').limit(1);
        if (checklists && checklists.length) results.checklistName = checklists[0].name;

        console.log("Found terms:", JSON.stringify(results, null, 2));

        const fixturesDir = path.join(__dirname, '../tests/fixtures');
        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
        }

        fs.writeFileSync(path.join(fixturesDir, 'search-terms.json'), JSON.stringify(results, null, 2));

    } catch (err) {
        console.error('Error fetching data:', err.message);
        process.exit(1);
    }
}

getTerms();
