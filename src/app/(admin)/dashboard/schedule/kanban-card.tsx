'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MapPin, User, CheckSquare } from 'lucide-react'
import { format } from 'date-fns'

interface KanbanCardProps {
    job: any
    onView: (id: string) => void
}

export function KanbanCard({ job, onView }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef: setDraggableRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `job-${job.id}`,
        data: {
            type: 'job',
            job,
        },
    })

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `job-drop-${job.id}`,
        data: {
            type: 'job-drop-zone',
            jobId: job.id,
        },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
    }

    if (isDragging) {
        return (
            <div
                ref={setDraggableRef}
                style={style}
                className="bg-white p-4 rounded-lg shadow-lg border-2 border-[var(--primary-color)] opacity-50 h-[150px]"
            />
        )
    }

    return (
        <div
            ref={setDraggableRef}
            style={style}
            {...listeners}
            {...attributes}
            className="mb-3 group relative"
        >
            <div
                ref={setDroppableRef}
                className={`bg-white p-4 rounded-lg shadow-sm border transition-colors cursor-grab active:cursor-grabbing ${isOver ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)] ring-opacity-50 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                onClick={(e) => {
                    // Prevent click when dragging
                    if (!isDragging) {
                        e.stopPropagation()
                        onView(job.id)
                    }
                }}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate pr-2">{job.title}</h3>
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium capitalize ${job.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        job.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {job.priority || 'normal'}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                        <User className="mr-1.5 h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.customers?.business_name || job.customers?.contact_name}</span>
                    </div>

                    {job.job_sites && (
                        <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="mr-1.5 h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{job.job_sites.name}</span>
                        </div>
                    )}

                    {(job.start_time) && (
                        <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="mr-1.5 h-3 w-3 flex-shrink-0" />
                            <span>{format(new Date(job.start_time), 'MMM d, h:mm a')}</span>
                        </div>
                    )}
                </div>

                {/* Assignments & Checklists footer */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex -space-x-1 overflow-hidden">
                        {job.job_assignments?.map((assign: any) => {
                            const name = assign.workers
                                ? `${assign.workers.first_name?.[0]}${assign.workers.last_name?.[0]}`
                                : assign.contractors?.company_name?.[0] || '?'
                            const title = assign.workers
                                ? `${assign.workers.first_name} ${assign.workers.last_name}`
                                : assign.contractors?.company_name

                            return (
                                <div
                                    key={assign.id}
                                    title={title}
                                    className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 ring-2 ring-white hover:z-10"
                                >
                                    {name}
                                </div>
                            )
                        })}
                        {(!job.job_assignments || job.job_assignments.length === 0) && (
                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                    </div>

                    {job.job_checklists && job.job_checklists.length > 0 && (
                        <div
                            className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"
                            title="Checklists Assigned"
                        >
                            <CheckSquare className="mr-1 h-3 w-3" />
                            {job.job_checklists.length} Checklist{job.job_checklists.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
