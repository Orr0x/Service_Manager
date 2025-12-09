'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './kanban-card'

interface KanbanColumnProps {
    id: string
    title: string
    jobs: any[]
    color: string
    onViewJob: (id: string) => void
    // New props for editing
    isEditing?: boolean
    onTitleChange?: (newTitle: string) => void
    onSaveTitle?: () => void
}

export function KanbanColumn({
    id,
    title,
    jobs,
    color,
    onViewJob,
    isEditing,
    onTitleChange,
    onSaveTitle
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${id}`,
        data: {
            type: 'column',
            columnId: id,
        },
    })

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className={`p-3 border-b border-gray-200 flex items-center justify-between ${color}`}>
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange?.(e.target.value)}
                        onBlur={onSaveTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveTitle?.()
                        }}
                        autoFocus
                        className="w-full bg-white/80 px-2 py-1 rounded text-sm font-semibold text-gray-900 border-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                ) : (
                    <h3
                        className="font-semibold text-gray-700 cursor-text hover:bg-black/5 px-2 py-1 rounded transition-colors"
                        title="Double click to rename"
                        onClick={onSaveTitle} // Or double click. Let's rely on parent to pass "startEditing" if needed, but for now simple input mode from parent.
                    >
                        {title}
                    </h3>
                )}
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 ml-2">
                    {jobs.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-3 overflow-y-auto transition-colors scrollbar-thin scrollbar-thumb-gray-300 ${isOver ? 'bg-blue-50/50' : ''
                    }`}
            >
                {jobs.map((job) => (
                    <KanbanCard key={job.id} job={job} onView={onViewJob} />
                ))}

                {jobs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    )
}
