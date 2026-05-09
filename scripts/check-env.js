#!/usr/bin/env node

require('dotenv').config({ quiet: true })

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
]

const optionalButRecommended = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'GOOGLE_DRIVE_FOLDER_ID',
]

const missingRequired = required.filter((name) => !process.env[name])
const missingRecommended = optionalButRecommended.filter((name) => !process.env[name])
const invalid = []

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseAppKey = supabasePublishableKey || supabaseAnonKey

if (!supabaseAppKey) {
  missingRequired.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

if (supabaseAppKey) {
  const isJwtAnonKey = supabaseAppKey.startsWith('eyJ') && supabaseAppKey.split('.').length === 3
  const isPublishableKey = supabaseAppKey.startsWith('sb_publishable_')

  if (supabaseAppKey === supabaseUrl || supabaseAppKey.startsWith('http')) {
    invalid.push('Supabase app key looks like a URL, not a Supabase anon/publishable key')
  } else if (!isJwtAnonKey && !isPublishableKey) {
    invalid.push('Supabase app key should start with eyJ or sb_publishable_')
  }
}

if (missingRequired.length > 0) {
  console.error('Missing required environment variables:')
  for (const name of missingRequired) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

if (invalid.length > 0) {
  console.error('Invalid environment variables:')
  for (const message of invalid) {
    console.error(`- ${message}`)
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
