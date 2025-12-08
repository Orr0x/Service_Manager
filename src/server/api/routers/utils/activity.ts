
import { type SupabaseClient } from '@supabase/supabase-js'

interface LogActivityParams {
    tenantId: string
    actorId?: string
    actionType: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned' | 'status_change'
    entityType: 'job' | 'worker' | 'contractor' | 'site' | 'invoice' | 'quote' | 'user' | 'service'
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
        console.log('Logging activity attempt:', { tenantId, actorId, actionType, entityType, entityId });
        const { error } = await db.from('activity_logs').insert({
            tenant_id: tenantId,
            actor_id: actorId || null,
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            details: details
        })
        if (error) {
            console.error('Supabase insert error:', error)
            throw error
        }
        console.log('Activity logged successfully');
    } catch (error) {
        console.error('Failed to log activity:', error)
    }
}
