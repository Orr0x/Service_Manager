
import { type SupabaseClient } from '@supabase/supabase-js'

interface LogActivityParams {
    tenantId: string
    actorId?: string
    actionType: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned' | 'status_change'
    entityType: 'job' | 'worker' | 'contractor' | 'site' | 'invoice' | 'quote' | 'user'
    entityId: string
    details?: Record<string, any>
    db: SupabaseClient
}

export async function logActivity({
    tenantId,
    actorId,
    actionType,
    entityType,
    entityId,
    details = {},
    db
}: LogActivityParams) {
    try {
        await db.from('activity_logs').insert({
            tenant_id: tenantId,
            actor_id: actorId || null,
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            details: details
        })
    } catch (error) {
        console.error('Failed to log activity:', error)
        // We don't throw here to avoid failing the main action if logging fails
    }
}
