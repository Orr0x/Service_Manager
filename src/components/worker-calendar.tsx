'use client'

import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfDay, endOfDay, addDays } from 'date-fns'
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

export function WorkerCalendar() {
    const [view, setView] = useState<View>(Views.MONTH)
    const [date, setDate] = useState(new Date())
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Calculate range
    const range = useMemo(() => {
        let start = startOfMonth(date);
        let end = endOfMonth(date);

        if (view === Views.WEEK) {
            start = startOfWeek(date);
            end = addDays(start, 7);
        } else if (view === Views.DAY) {
            start = startOfDay(date);
            end = endOfDay(date);
        }

        // Add buffer for Month view (previous/next month days)
        if (view === Views.MONTH) {
            start = startOfWeek(start);
            end = endOfWeek(end);
        }

        return { start, end };
    }, [view, date]);

    // Helper for endOfWeek (since not imported)
    function endOfWeek(d: Date) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = 6 - day;
        date.setDate(date.getDate() + diff);
        return date;
    }

    const { data: assignments } = api.worker.getAssignedJobs.useQuery({
        dateRange: range
    });

    const { data: unavailability } = api.worker.getUnavailability.useQuery({
        start: range.start,
        end: range.end
    });

    const events = useMemo(() => {
        if (!assignments) return [];

        const unavailabilitySet = new Set(unavailability?.map(u => u.unavailable_date) || []);

        return assignments.map(assignment => {
            const start = new Date(assignment.start_time!);
            const end = new Date(assignment.end_time!);
            let hasConflict = false;

            // Check if any day of this assignment is blocked
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (unavailabilitySet.has(d.toISOString().split('T')[0])) {
                    hasConflict = true;
                    break;
                }
            }

            return {
                id: assignment.id,
                title: `${hasConflict ? '⚠️ ' : ''}${Array.isArray(assignment.customers) ? (assignment.customers[0]?.business_name || assignment.customers[0]?.contact_name) : (assignment.customers?.business_name || assignment.customers?.contact_name) || 'Customer'} - ${assignment.title}`,
                start,
                end,
                resource: assignment,
                type: 'job',
                status: hasConflict ? 'conflict' : assignment.status
            };
        });
    }, [assignments, unavailability]);

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
        <div className="h-[600px] relative bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <style jsx global>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-event { border-radius: 4px; border: none; }
                .rbc-today { background-color: #f3f4f6; }
                .status-completed { background-color: #10b981 !important; }
                .status-in_progress { background-color: #3b82f6 !important; }
                .status-scheduled { background-color: #6366f1 !important; }
                .status-draft { background-color: #9ca3af !important; }
                .status-conflict {
                    background-color: #ef4444 !important;
                    border: 2px solid #b91c1c !important;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={(event: any) => {
                    const statusClass = `status-${event.status?.toLowerCase()}`;
                    return { className: statusClass }
                }}
                defaultView={Views.MONTH}
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
                role="worker"
            />
        </div>
    )
}
