'use client'

import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { JobPreviewModal } from '@/components/job-preview-modal'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

const DnDCalendar = withDragAndDrop(Calendar)

export function CalendarView() {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: jobs } = api.jobs.getAll.useQuery({})
    const { data: unavailability } = api.workers.getAllUnavailability.useQuery()
    const { data: contractorUnavailability } = api.contractors.getAllUnavailability.useQuery()

    const [view, setView] = useState<View>(Views.WEEK)
    const [date, setDate] = useState(new Date())
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const updateJob = api.jobs.update.useMutation({
        onSuccess: () => {
            utils.jobs.getAll.invalidate()
        }
    })

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 640px)')
        const syncMobileView = () => {
            if (mediaQuery.matches) {
                setView(Views.AGENDA)
            }
        }

        syncMobileView()
        mediaQuery.addEventListener('change', syncMobileView)
        return () => mediaQuery.removeEventListener('change', syncMobileView)
    }, [])

    const events = useMemo(() => {
        const unavailabilityMap = new Map<string, Set<string>>();
        if (unavailability) {
            unavailability.forEach(u => {
                if (!unavailabilityMap.has(u.worker_id)) {
                    unavailabilityMap.set(u.worker_id, new Set());
                }
                // @ts-ignore
                unavailabilityMap.get(u.worker_id)?.add(u.unavailable_date);
            });
        }

        const jobEvents = jobs
            ? jobs
                .filter(job => job.start_time && job.end_time)
                .map(job => {
                    const workerNames = job.job_assignments
                        ?.map((a: any) => a.workers?.first_name ? `${a.workers.first_name} ${a.workers.last_name || ''}` : a.contractors?.company_name)
                        .filter(Boolean)
                        .join(', ')

                    // Check conflicts
                    let hasConflict = false;
                    if (job.start_time && job.end_time && job.job_assignments) {
                        const jobStart = new Date(job.start_time);
                        const jobEnd = new Date(job.end_time);
                        // Iterate days of the job
                        for (let d = new Date(jobStart); d <= jobEnd; d.setDate(d.getDate() + 1)) {
                            const dateStr = d.toISOString().split('T')[0];
                            // Check each assigned worker
                            for (const assignment of job.job_assignments as any[]) {
                                if (assignment.worker_id && unavailabilityMap.get(assignment.worker_id)?.has(dateStr)) {
                                    hasConflict = true;
                                    break;
                                }
                            }
                            if (hasConflict) break;
                        }
                    }

                    return {
                        id: job.id,
                        title: `${job.start_time ? new Date(job.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} - ${hasConflict ? '⚠️ CONFLICT: ' : ''}${workerNames ? `${workerNames} - ` : ''}${job.customers?.business_name || job.customers?.contact_name}`,
                        start: new Date(job.start_time!),
                        end: new Date(job.end_time!),
                        resource: job,
                        type: 'job',
                        className: hasConflict ? 'rbc-event-conflict' : undefined
                    }
                })
            : []

        const unavailabilityEvents = unavailability
            ? unavailability
                .map(item => ({
                    id: item.id,
                    title: `BLOCKED (W): ${(item.workers as any)?.first_name} ${(item.workers as any)?.last_name}${item.reason ? ` - ${item.reason}` : ''}`,
                    start: new Date(item.unavailable_date),
                    end: new Date(item.unavailable_date),
                    resource: item,
                    type: 'blocked',
                    allDay: true
                }))
            : []

        const contractorUnavailabilityEvents = contractorUnavailability
            ? contractorUnavailability
                .map(item => ({
                    id: item.id,
                    title: `BLOCKED (C): ${(item.contractors as any)?.company_name}${item.reason ? ` - ${item.reason}` : ''}`,
                    start: new Date(item.start_date),
                    end: new Date(item.end_date),
                    resource: item,
                    type: 'blocked',
                    allDay: true
                }))
            : []

        return [...jobEvents, ...unavailabilityEvents, ...contractorUnavailabilityEvents]
    }, [jobs, unavailability, contractorUnavailability])

    const handleSelectEvent = (event: any) => {
        if (event.type === 'job') {
            setSelectedJobId(event.id)
            setIsModalOpen(true)
        }
    }

    const onEventDrop = useCallback(({ event, start, end }: any) => {
        updateJob.mutate({
            id: event.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        })
    }, [updateJob])

    const onEventResize = useCallback(({ event, start, end }: any) => {
        updateJob.mutate({
            id: event.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        })
    }, [updateJob])

    const handleNavigate = (newDate: Date) => {
        setDate(newDate)
    }

    const handleViewChange = (newView: View) => {
        setView(newView)
    }

    return (
        <div className="relative h-full min-h-[26rem]">
            <style jsx global>{`
        .rbc-calendar {
            font-family: inherit;
            min-width: 0;
        }
        .rbc-toolbar {
            gap: 0.5rem;
        }
        .rbc-toolbar button {
            color: #374151;
            border-color: #d1d5db;
            padding: 0.35rem 0.65rem;
        }
        .rbc-toolbar-label {
            min-width: 8rem;
            padding: 0.25rem 0;
        }
        .rbc-event {
            background-color: var(--primary-color);
        }
        .rbc-event.rbc-event-blocked {
            background-color: #6b7280; /* Gray 500 */
            border-color: #4b5563;
        }
        .rbc-event.rbc-event-conflict {
            background-color: #ef4444 !important; /* Red 500 */
            border-color: #b91c1c !important;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .7; }
        }
        .rbc-today {
            background-color: #f3f4f6;
        }
        @media (max-width: 640px) {
            .rbc-toolbar {
                align-items: stretch;
                flex-direction: column;
            }
            .rbc-toolbar .rbc-btn-group {
                display: grid;
                grid-auto-columns: 1fr;
                grid-auto-flow: column;
                width: 100%;
            }
            .rbc-toolbar .rbc-btn-group button {
                font-size: 0.8125rem;
                min-width: 0;
                padding-left: 0.35rem;
                padding-right: 0.35rem;
            }
            .rbc-toolbar-label {
                font-size: 0.9375rem;
                font-weight: 600;
                text-align: center;
                width: 100%;
            }
            .rbc-time-view,
            .rbc-month-view {
                min-width: 38rem;
            }
            .rbc-agenda-view {
                overflow-x: auto;
            }
        }
      `}</style>
            <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor={(event: any) => event.start}
                endAccessor={(event: any) => event.end}
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={(event: any) => {
                    if (event.type === 'blocked') {
                        return { className: 'rbc-event-blocked' }
                    }
                    return {}
                }}
                defaultView={Views.WEEK}
                view={view}
                date={date}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                resizable
                selectable
            />

            <JobPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jobId={selectedJobId}
            />
        </div>
    )
}
