'use client'

import { api } from '@/trpc/react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, FileEdit, Plus, Trash2, UserPlus, FileText, Calendar, Clock, AlertCircle } from 'lucide-react'

interface ActivityFeedProps {
    entityType?: string
    entityId?: string
    customerId?: string
    limit?: number
    title?: string
}

export function ActivityFeed({ entityType, entityId, customerId, limit = 10, title = 'Recent Activity' }: ActivityFeedProps) {
    const { data: activities, isLoading } = api.activity.getRecent.useQuery({
        limit,
        entityType,
        entityId,
        customerId
    })

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-gray-500">Loading activity...</div>
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                No recent activity found.
            </div>
        )
    }

    const getIcon = (action: string) => {
        switch (action) {
            case 'created':
                return <Plus className="h-4 w-4 text-green-500" />
            case 'updated':
                return <FileEdit className="h-4 w-4 text-blue-500" />
            case 'deleted':
                return <Trash2 className="h-4 w-4 text-red-500" />
            case 'assigned':
                return <UserPlus className="h-4 w-4 text-purple-500" />
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />
            case 'scheduled':
                return <Calendar className="h-4 w-4 text-orange-500" />
            default:
                return <FileText className="h-4 w-4 text-gray-400" />
        }
    }

    const formatAction = (action: string) => {
        return action.charAt(0).toUpperCase() + action.slice(1);
    }

    // Helper to extract relevant details
    const getDetailsText = (details: any) => {
        if (!details) return '';
        // If details is a string, return it
        if (typeof details === 'string') return details;
        // If it has a specific message or note
        if (details.message) return details.message;
        // Fallback to generic JSON string if small, or nothing
        return '';
    }

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {activities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                        <div className="relative pb-8">
                            {activityIdx !== activities.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                                        {getIcon(activity.action_type)}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium text-gray-900">
                                                {activity.actor?.first_name || 'System'}
                                            </span>{' '}
                                            {formatAction(activity.action_type)}{' '}
                                            <span className="font-medium text-gray-900">
                                                {activity.entity_type}
                                            </span>
                                        </p>
                                        {(activity.details as any)?.message && (
                                            <p className="mt-1 text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                                "{(activity.details as any).message}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time dateTime={activity.created_at}>
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
