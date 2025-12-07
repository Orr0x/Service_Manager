'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { KanbanResources } from './kanban-resources'
import { api } from '@/trpc/react'
import { JobPreviewModal } from '@/components/job-preview-modal'
import { User, Briefcase, CheckSquare } from 'lucide-react'

// Helper to remove prefixes
const getId = (str: string) => str.split('-').slice(1).join('-')

export function KanbanBoard() {
    const utils = api.useUtils()
    const { data: jobs, isLoading: isJobsLoading } = api.jobs.getAll.useQuery({})
    const { data: settings } = api.settings.getSettings.useQuery()

    // Mutations
    const updateJob = api.jobs.update.useMutation({
        onSuccess: () => utils.jobs.getAll.invalidate()
    })

    const updateAssignments = api.jobs.updateAssignments.useMutation({
        onSuccess: () => utils.jobs.getAll.invalidate()
    })

    const addChecklist = api.jobs.addChecklist.useMutation({
        onSuccess: () => utils.jobs.getAll.invalidate()
    })

    const updateSettings = api.settings.updateKanbanSettings.useMutation({
        onSuccess: () => utils.settings.getSettings.invalidate()
    })

    // State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeDragItem, setActiveDragItem] = useState<any>(null)

    // Column Renaming State
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
    const [tempColumnTitle, setTempColumnTitle] = useState('')

    // Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    // Columns Configuration
    const columnConfig = useMemo(() => {
        const defaultColumns = {
            backlog: 'Backlog',
            unscheduled: 'Unscheduled',
            scheduled: 'Scheduled',
            in_progress: 'In Progress',
            completed: 'Completed',
        }

        const customColumns = (settings?.kanban_settings as any)?.columns || {}
        return { ...defaultColumns, ...customColumns }
    }, [settings])

    // Group Jobs
    const columns = useMemo(() => {
        if (!jobs) return { backlog: [], unscheduled: [], scheduled: [], in_progress: [], completed: [] }

        return {
            backlog: jobs.filter(j => j.status === 'draft'),
            unscheduled: jobs.filter(j => j.status === 'pending'), // Approved but not scheduled
            scheduled: jobs.filter(j => j.status === 'scheduled'),
            in_progress: jobs.filter(j => j.status === 'in_progress'),
            completed: jobs.filter(j => j.status === 'completed'),
        }
    }, [jobs])

    const handleDragStart = (event: any) => {
        const { active } = event
        setActiveDragItem(active.data.current)
    }

    const handleDragEnd = async (event: any) => {
        const { active, over } = event
        setActiveDragItem(null)

        if (!over) return

        const activeType = active.data.current?.type
        const overType = over.data.current?.type

        // 1. Dragging a Job Card to a Column
        if (activeType === 'job' && overType === 'column') {
            const jobId = active.data.current.job.id
            const targetColumn = over.data.current.columnId
            const job = active.data.current.job

            let updates: any = {}
            let newStatus = '' // Keep track for later comparison

            if (targetColumn === 'backlog') {
                newStatus = 'draft'
                updates = { status: 'draft' }
            } else if (targetColumn === 'unscheduled') {
                newStatus = 'pending'
                updates = { status: 'pending' }
            } else if (targetColumn === 'scheduled') {
                newStatus = 'scheduled'
                updates = {
                    status: 'scheduled',
                    // Default to today + 1 hour if no time set
                    startTime: job.start_time || new Date().toISOString(),
                    endTime: job.end_time || new Date(Date.now() + 3600000).toISOString()
                }
            } else if (targetColumn === 'in_progress') {
                newStatus = 'in_progress'
                updates = { status: 'in_progress' }
            } else if (targetColumn === 'completed') {
                newStatus = 'completed'
                updates = { status: 'completed' }
            }

            if (newStatus && newStatus !== job.status) {
                try {
                    await updateJob.mutateAsync({
                        id: jobId,
                        ...updates
                    })
                } catch (e) {
                    console.error("Failed to move job", e)
                }
            }
        }
        // 2. Dragging a Resource to a Job Card
        if ((activeType === 'worker' || activeType === 'contractor' || activeType === 'checklist') && overType === 'job-drop-zone') {
            const resourceId = getId(active.id)
            const jobId = over.data.current.jobId
            const job = jobs?.find(j => j.id === jobId)

            if (!job) return

            if (activeType === 'worker') {
                const currentAssignments = job.job_assignments?.map((a: any) => ({
                    workerId: a.worker_id,
                    contractorId: a.contractor_id
                })) || []

                if (currentAssignments.some((a: any) => a.workerId === resourceId)) return

                try {
                    await updateAssignments.mutateAsync({
                        jobId,
                        assignments: [
                            ...currentAssignments,
                            { workerId: resourceId, contractorId: undefined }
                        ]
                    })
                } catch (e: any) {
                    alert(e.message || "Failed to assign worker")
                }
            }
            else if (activeType === 'contractor') {
                const currentAssignments = job.job_assignments?.map((a: any) => ({
                    workerId: a.worker_id,
                    contractorId: a.contractor_id
                })) || []
                if (currentAssignments.some((a: any) => a.contractorId === resourceId)) return

                try {
                    await updateAssignments.mutateAsync({
                        jobId,
                        assignments: [
                            ...currentAssignments,
                            { workerId: undefined, contractorId: resourceId }
                        ]
                    })
                } catch (e: any) {
                    alert(e.message || "Failed to assign contractor")
                }
            }
            else if (activeType === 'checklist') {
                try {
                    await addChecklist.mutateAsync({
                        jobId,
                        checklistTemplateId: resourceId
                    })
                } catch (e: any) {
                    alert(e.message || "Failed to add checklist")
                }
            }
        }
    }

    const handleViewJob = (id: string) => {
        setSelectedJobId(id)
        setIsModalOpen(true)
    }

    // Renaming Handlers
    const startEditing = (columnId: string, currentTitle: string) => {
        setEditingColumnId(columnId)
        setTempColumnTitle(currentTitle)
    }

    const saveTitle = async () => {
        if (!editingColumnId || !tempColumnTitle.trim()) {
            setEditingColumnId(null)
            return
        }

        try {
            await updateSettings.mutateAsync({
                columns: {
                    [editingColumnId]: tempColumnTitle
                }
            })
        } catch (e) {
            console.error("Failed to update column name", e)
        } finally {
            setEditingColumnId(null)
            setTempColumnTitle('')
        }
    }

    if (isJobsLoading) return <div>Loading board...</div>

    return (
        <div className="flex h-full border rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Board Area */}
                <div className="flex-1 flex overflow-x-auto p-4 gap-4 bg-gray-50/50">
                    {/* Backlog */}
                    <div className="flex-1 min-w-[280px] h-full">
                        <KanbanColumn
                            id="backlog"
                            title={columnConfig.backlog}
                            jobs={columns.backlog}
                            color="bg-gray-100"
                            onViewJob={handleViewJob}
                            isEditing={editingColumnId === 'backlog'}
                            onTitleChange={setTempColumnTitle}
                            onSaveTitle={() => editingColumnId === 'backlog' ? saveTitle() : startEditing('backlog', columnConfig.backlog)}
                        />
                    </div>

                    {/* Unscheduled */}
                    <div className="flex-1 min-w-[280px] h-full">
                        <KanbanColumn
                            id="unscheduled"
                            title={columnConfig.unscheduled}
                            jobs={columns.unscheduled}
                            color="bg-orange-50"
                            onViewJob={handleViewJob}
                            isEditing={editingColumnId === 'unscheduled'}
                            onTitleChange={setTempColumnTitle}
                            onSaveTitle={() => editingColumnId === 'unscheduled' ? saveTitle() : startEditing('unscheduled', columnConfig.unscheduled)}
                        />
                    </div>

                    {/* Scheduled */}
                    <div className="flex-1 min-w-[280px] h-full">
                        <KanbanColumn
                            id="scheduled"
                            title={columnConfig.scheduled}
                            jobs={columns.scheduled}
                            color="bg-blue-50"
                            onViewJob={handleViewJob}
                            isEditing={editingColumnId === 'scheduled'}
                            onTitleChange={setTempColumnTitle}
                            onSaveTitle={() => editingColumnId === 'scheduled' ? saveTitle() : startEditing('scheduled', columnConfig.scheduled)}
                        />
                    </div>

                    {/* In Progress */}
                    <div className="flex-1 min-w-[280px] h-full">
                        <KanbanColumn
                            id="in_progress"
                            title={columnConfig.in_progress}
                            jobs={columns.in_progress}
                            color="bg-purple-50"
                            onViewJob={handleViewJob}
                            isEditing={editingColumnId === 'in_progress'}
                            onTitleChange={setTempColumnTitle}
                            onSaveTitle={() => editingColumnId === 'in_progress' ? saveTitle() : startEditing('in_progress', columnConfig.in_progress)}
                        />
                    </div>

                    {/* Completed */}
                    <div className="flex-1 min-w-[280px] h-full">
                        <KanbanColumn
                            id="completed"
                            title={columnConfig.completed}
                            jobs={columns.completed}
                            color="bg-emerald-50"
                            onViewJob={handleViewJob}
                            isEditing={editingColumnId === 'completed'}
                            onTitleChange={setTempColumnTitle}
                            onSaveTitle={() => editingColumnId === 'completed' ? saveTitle() : startEditing('completed', columnConfig.completed)}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="h-full flex-shrink-0">
                    <KanbanResources />
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeDragItem ? (
                        activeDragItem.type === 'job' ? (
                            <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-[var(--primary-color)] w-[300px] rotate-3 cursor-grabbing">
                                <h3 className="font-medium text-gray-900">{activeDragItem.job.title}</h3>
                            </div>
                        ) : (
                            <div className="flex items-center p-2 bg-white rounded shadow-lg border-2 border-[var(--primary-color)] w-60 cursor-grabbing">
                                <div className={`p-1.5 rounded-full mr-3 ${activeDragItem.type === 'worker' ? 'bg-blue-100 text-blue-600' :
                                        activeDragItem.type === 'contractor' ? 'bg-purple-100 text-purple-600' :
                                            'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {activeDragItem.type === 'worker' && <User className="h-4 w-4" />}
                                    {activeDragItem.type === 'contractor' && <Briefcase className="h-4 w-4" />}
                                    {activeDragItem.type === 'checklist' && <CheckSquare className="h-4 w-4" />}
                                </div>
                                <span className="font-medium text-sm">{activeDragItem.name}</span>
                            </div>
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>

            <JobPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jobId={selectedJobId}
            />
        </div>
    )
}
