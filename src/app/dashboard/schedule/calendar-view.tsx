'use client'

import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useCallback } from 'react'
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

    const [view, setView] = useState<View>(Views.WEEK)
    const [date, setDate] = useState(new Date())
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const updateJob = api.jobs.update.useMutation({
        onSuccess: () => {
            utils.jobs.getAll.invalidate()
        }
    })

    const events = useMemo(() => {
        const jobEvents = jobs
            ? jobs
                .filter(job => job.start_time && job.end_time)
                .map(job => {
                    const workerNames = job.job_assignments
                        ?.map((a: any) => a.workers?.first_name ? `${a.workers.first_name} ${a.workers.last_name || ''}` : a.contractors?.company_name)
                        .filter(Boolean)
                        .join(', ')

                    return {
                        id: job.id,
                        title: `${job.start_time ? new Date(job.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} - ${workerNames ? `${workerNames} - ` : ''}${job.customers?.business_name || job.customers?.contact_name}`,
                        start: new Date(job.start_time!),
                        end: new Date(job.end_time!),
                        resource: job,
                        type: 'job',
                    }
                })
            : []

        const unavailabilityEvents = unavailability
            ? unavailability
                .map(item => ({
                    id: item.id,
                    title: `BLOCKED: ${(item.workers as any)?.first_name} ${(item.workers as any)?.last_name}${item.reason ? ` - ${item.reason}` : ''}`,
                    start: new Date(item.start_date),
                    end: new Date(item.end_date),
                    resource: item,
                    type: 'blocked',
                    allDay: true
                }))
            : []

        return [...jobEvents, ...unavailabilityEvents]
    }, [jobs, unavailability])

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
        <div className="h-full relative">
            <style jsx global>{`
        .rbc-calendar {
            font-family: inherit;
        }
        .rbc-event {
            background-color: var(--primary-color);
        }
        .rbc-event.rbc-event-blocked {
            background-color: #6b7280; /* Gray 500 */
            border-color: #4b5563;
        }
        .rbc-today {
            background-color: #f3f4f6;
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
