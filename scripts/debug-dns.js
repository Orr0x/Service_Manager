
const dns = require('dns');

const host = 'db.ktxnjsqgghjofwyludzm.supabase.co';

console.log(`Looking up ${host}...`);

dns.lookup(host, { all: true }, (err, addresses) => {
    if (err) {
        console.error('Lookup failed:', err);
    } else {
        console.log('Lookup results:', addresses);
    }
});

dns.resolve4(host, (err, addresses) => {
    if (err) {
        console.error('Resolve4 failed:', err.code);
    } else {
        console.log('Resolve4 results:', addresses);
    }
});

dns.resolve6(host, (err, addresses) => {
    if (err) {
        console.error('Resolve6 failed:', err.code);
    } else {
        console.log('Resolve6 results:', addresses);
    }
});
