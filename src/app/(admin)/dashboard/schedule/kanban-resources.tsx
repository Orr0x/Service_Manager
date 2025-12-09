'use client'

import { useDraggable } from '@dnd-kit/core'
import { api } from '@/trpc/react'
import { User, Briefcase, CheckSquare, GripVertical } from 'lucide-react'

// Draggable Resource Item Component
function DraggableResource({ id, type, name, subtitle, icon: Icon }: any) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        data: {
            type: type, // 'worker' | 'contractor' | 'checklist'
            id: id, // The real ID, prefixed in parent if needed, but here we pass full unique ID
            name: name,
        },
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="flex items-center p-2 bg-white rounded shadow-lg border-2 border-[var(--primary-color)] opacity-80 z-50 w-full"
            >
                <Icon className="h-4 w-4 mr-2 text-[var(--primary-color)]" />
                <div className="text-sm font-medium text-gray-900">{name}</div>
            </div>
        )
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200 transition-colors group"
        >
            <GripVertical className="h-4 w-4 text-gray-300 mr-2 group-hover:text-gray-400" />
            <div className={`p-1.5 rounded-full mr-3 ${type === 'worker' ? 'bg-blue-100 text-blue-600' :
                    type === 'contractor' ? 'bg-purple-100 text-purple-600' :
                        'bg-emerald-100 text-emerald-600'
                }`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
            </div>
        </div>
    )
}

export function KanbanResources() {
    const { data: workers } = api.workers.getAll.useQuery()
    const { data: contractors } = api.contractors.getAll.useQuery()
    const { data: checklists } = api.checklists.getAll.useQuery()

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Resources</h3>
                <p className="text-xs text-gray-500 mt-1">Drag onto jobs to assign</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                {/* Workers */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workers</h4>
                    <div className="space-y-1">
                        {workers?.map(worker => (
                            <DraggableResource
                                key={worker.id}
                                id={`worker-${worker.id}`}
                                type="worker"
                                name={`${worker.first_name} ${worker.last_name}`}
                                subtitle={worker.role}
                                icon={User}
                            />
                        ))}
                    </div>
                </div>

                {/* Contractors */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contractors</h4>
                    <div className="space-y-1">
                        {contractors?.map(contractor => (
                            <DraggableResource
                                key={contractor.id}
                                id={`contractor-${contractor.id}`}
                                type="contractor"
                                name={contractor.company_name}
                                subtitle={contractor.contact_name}
                                icon={Briefcase}
                            />
                        ))}
                    </div>
                </div>

                {/* Checklists */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Checklists</h4>
                    <div className="space-y-1">
                        {checklists?.map(checklist => (
                            <DraggableResource
                                key={checklist.id}
                                id={`checklist-${checklist.id}`}
                                type="checklist"
                                name={checklist.name}
                                subtitle={`${(checklist.items as any[])?.length || 0} items`}
                                icon={CheckSquare}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
