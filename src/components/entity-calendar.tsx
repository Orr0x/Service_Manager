'use client'

import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { api } from '@/trpc/react'
import { useMemo, useState } from 'react'
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

interface EntityCalendarProps {
    entityType: 'worker' | 'contractor'
    entityId: string
}

export function EntityCalendar({ entityType, entityId }: EntityCalendarProps) {
    const [view, setView] = useState<View>(Views.WEEK)
    const [date, setDate] = useState(new Date())
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Fetch jobs for the specific entity
    const { data: workerJobs } = api.jobs.getByWorkerId.useQuery(
        { workerId: entityId },
        { enabled: entityType === 'worker' }
    )

    const { data: contractorJobs } = api.jobs.getByContractorId.useQuery(
        { contractorId: entityId },
        { enabled: entityType === 'contractor' }
    )

    // Fetch unavailability for the specific entity
    const { data: workerUnavailability } = api.workers.getUnavailability.useQuery(
        { workerId: entityId },
        { enabled: entityType === 'worker' }
    )

    const { data: contractorUnavailability } = api.contractors.getUnavailability.useQuery(
        { contractorId: entityId },
        { enabled: entityType === 'contractor' }
    )

    const events = useMemo(() => {
        const jobs = entityType === 'worker' ? workerJobs : contractorJobs
        const unavailability = entityType === 'worker' ? workerUnavailability : contractorUnavailability

        const jobEvents = jobs
            ? jobs
                .filter(job => job.start_time && job.end_time)
                .map(job => ({
                    id: job.id,
                    title: `${job.start_time ? new Date(job.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} - ${job.customers?.business_name || job.customers?.contact_name} - ${job.title}`,
                    start: new Date(job.start_time!),
                    end: new Date(job.end_time!),
                    resource: job,
                    type: 'job',
                }))
            : []

        const unavailabilityEvents = unavailability
            ? unavailability
                .map(item => ({
                    id: item.id,
                    title: `BLOCKED: ${item.reason || 'Unavailable'}`,
                    start: new Date(item.start_date),
                    end: new Date(item.end_date),
                    resource: item,
                    type: 'blocked',
                    allDay: true
                }))
            : []

        return [...jobEvents, ...unavailabilityEvents]
    }, [entityType, workerJobs, contractorJobs, workerUnavailability, contractorUnavailability])

    const handleSelectEvent = (event: any) => {
        if (event.type === 'job') {
            setSelectedJobId(event.id)
            setIsModalOpen(true)
        }
    }

    const handleNavigate = (newDate: Date) => {
        setDate(newDate)
    }

    const handleViewChange = (newView: View) => {
        setView(newView)
    }

    return (
        <div className="h-[600px] relative">
            <style jsx global>{`
        .rbc-calendar {
            font-family: inherit;
        }
        .rbc-event {
            background-color: var(--primary-color, #2563eb);
        }
        .rbc-event.rbc-event-blocked {
            background-color: #6b7280; /* Gray 500 */
            border-color: #4b5563;
        }
        .rbc-today {
            background-color: #f3f4f6;
        }
      `}</style>
            <Calendar
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
            />

            <JobPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jobId={selectedJobId}
            />
        </div>
    )
}
