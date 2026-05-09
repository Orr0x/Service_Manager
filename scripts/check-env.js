#!/usr/bin/env node

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const optionalButRecommended = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
]

const missingRequired = required.filter((name) => !process.env[name])
const missingRecommended = optionalButRecommended.filter((name) => !process.env[name])

if (missingRequired.length > 0) {
  console.error('Missing required environment variables:')
  for (const name of missingRequired) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

console.log('Environment check passed: required variables are present.')

if (missingRecommended.length > 0) {
  console.log('Recommended variables not set (some scripts/features may be limited):')
  for (const name of missingRecommended) {
    console.log(`- ${name}`)
  }
}
