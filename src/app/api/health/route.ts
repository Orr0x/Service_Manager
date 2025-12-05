import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Check database connection
        const { error } = await supabase.from('tenants').select('count').limit(1).single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows" which is fine for count
            // Actually .single() on empty table throws error.
            // Let's just select id limit 1
        }

        // Retry with simpler query
        const { error: dbError } = await supabase.from('tenants').select('id').limit(1)

        if (dbError) {
            console.error('Health check DB error:', dbError)
            // We don't throw here to allow app to be "up" even if DB is having issues, 
            // but status should reflect it.
            return NextResponse.json(
                { status: 'degraded', database: 'error', message: dbError.message },
                { status: 503 }
            )
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV
        })
    } catch (_error) {
        return NextResponse.json(
            {
                status: 'error',
                message: 'Internal Server Error'
            },
            { status: 500 }
        )
    }
}
