'use client';

import { useState } from 'react';
import { api } from "@/trpc/react";
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { DayPicker, DayClickEventHandler } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // We might need to style manually if CSS not imported
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Assuming we have these or need to make simple ones
import { Briefcase, Plane, AlertTriangle, Truck, X, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import classNames from 'classnames';

// Custom CSS since we might not have the CSS file configured globally or want tailwind styles
const calendarStyle = `
.rdp {
  --rdp-cell-size: 40px;
  --rdp-accent-color: #4f46e5;
  --rdp-background-color: #eef2ff;
  margin: 0;
}
.rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
  background-color: #f3f4f6;
}
.rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
  background-color: var(--rdp-accent-color);
  color: white;
}
`;

type UnavailabilityReason = 'non_working' | 'holiday' | 'sickness' | 'transport' | 'other';

const REASONS: { id: UnavailabilityReason; label: string; icon: any; color: string }[] = [
    { id: 'non_working', label: 'Non-working Day', icon: Briefcase, color: 'text-gray-500 bg-gray-100' },
    { id: 'holiday', label: 'Holiday / Vacation', icon: Plane, color: 'text-blue-500 bg-blue-100' },
    { id: 'sickness', label: 'Sickness', icon: AlertTriangle, color: 'text-red-500 bg-red-100' },
    { id: 'transport', label: 'Transport / Vehicle', icon: Truck, color: 'text-orange-500 bg-orange-100' },
];

export default function AvailabilityPage() {
    const [month, setMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const utils = api.useUtils();

    // Fetch Unavailability for current month view
    const { data: unavailability, isLoading } = api.worker.getUnavailability.useQuery({
        start: startOfMonth(month),
        end: endOfMonth(month)
    });

    // Mutation
    const { mutate: setUnavailability, isPending: isUpdating } = api.worker.setUnavailability.useMutation({
        onSuccess: () => {
            utils.worker.getUnavailability.invalidate();
            setIsDialogOpen(false);
            setSelectedDate(undefined);
        },
        onError: (err) => {
            alert(`Failed to update availability: ${err.message}`);
        }
    });

    const handleDayClick: DayClickEventHandler = (day, modifiers) => {
        setSelectedDate(day);
        setIsDialogOpen(true);
    };

    const handleReasonSelect = (reason: UnavailabilityReason | null) => {
        if (!selectedDate) return;

        setUnavailability({
            date: format(selectedDate, 'yyyy-MM-dd'),
            reason: reason || undefined // undefined sends delete to backend
        });
    };

    const existingReason = selectedDate
        ? unavailability?.find(u => u.unavailable_date === format(selectedDate, 'yyyy-MM-dd'))?.reason
        : null;

    // Fetch jobs for conflict detection
    const { data: assignments } = api.worker.getAssignedJobs.useQuery({
        filter: 'month' // Simplified: Check jobs this month
    });

    const hasConflict = (date: Date) => {
        if (!assignments) return false;
        const dateStr = format(date, 'yyyy-MM-dd');
        return assignments.some(job => {
            if (!job || !job.start_time || !job.end_time) return false;

            // Check if job spans this date
            const jStart = new Date(job.start_time);
            const jEnd = new Date(job.end_time);
            const d = new Date(dateStr); // Local midnight
            const jStartDay = new Date(jStart); jStartDay.setHours(0, 0, 0, 0);
            const jEndDay = new Date(jEnd); jEndDay.setHours(23, 59, 59, 999);

            // Simple string comparison for day might be safer if already using YYYY-MM-DD
            // but 'date' from DayPicker matches local. 
            // Let's re-use the logic: Iterate job days
            for (let current = new Date(jStart); current <= jEnd; current.setDate(current.getDate() + 1)) {
                if (current.toISOString().split('T')[0] === dateStr) return true;
            }
            return false;
        });
    };

    // Modifiers for Calendar
    // Use string comparison to avoid Timezone issues (DB date vs Local Date)
    const modifiers = {
        blocked: (date: Date) => !!unavailability?.some(u => u.unavailable_date === format(date, 'yyyy-MM-dd')),
        holiday: (date: Date) => !!unavailability?.some(u => u.reason === 'holiday' && u.unavailable_date === format(date, 'yyyy-MM-dd')),
        sickness: (date: Date) => !!unavailability?.some(u => u.reason === 'sickness' && u.unavailable_date === format(date, 'yyyy-MM-dd')),
        transport: (date: Date) => !!unavailability?.some(u => u.reason === 'transport' && u.unavailable_date === format(date, 'yyyy-MM-dd')),
        non_working: (date: Date) => !!unavailability?.some(u => u.reason === 'non_working' && u.unavailable_date === format(date, 'yyyy-MM-dd')),
        conflict: (date: Date) => {
            const isBlocked = !!unavailability?.some(u => u.unavailable_date === format(date, 'yyyy-MM-dd'));
            return isBlocked && hasConflict(date);
        }
    };

    const modifiersStyles = {
        blocked: { color: 'red' } // Fallback
    };

    // Custom day render or classnames
    const modifiersClassNames = {
        blocked: 'font-bold text-red-500',
        holiday: 'bg-blue-100 text-blue-600',
        sickness: 'bg-red-100 text-red-600',
        transport: 'bg-orange-100 text-orange-600',
        non_working: 'bg-gray-100 text-gray-500',
        conflict: 'bg-red-500 text-white font-bold ring-2 ring-red-600 animate-pulse'
    };


    return (
        <div className="p-4 max-w-lg mx-auto">
            <style>{calendarStyle}</style>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
                <p className="text-gray-500 text-sm">Manage your time off and blocked dates.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-center">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    onDayClick={handleDayClick}
                    month={month}
                    onMonthChange={setMonth}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    className="m-0"
                />
            </div>

            <div className="mt-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Legend</h3>
                <div className="grid grid-cols-2 gap-2">
                    {REASONS.map(r => (
                        <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-white text-xs">
                            <r.icon className={classNames("h-4 w-4 rounded p-0.5", r.color)} />
                            <span>{r.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-red-200 bg-red-50 text-xs">
                        <AlertTriangle className="h-4 w-4 rounded p-0.5 text-red-600" />
                        <span className="text-red-700 font-bold">Conflict!</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Blocked Dates (This Month)</h3>
                {unavailability?.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No blocked dates found for this month.</p>
                ) : (
                    <div className="space-y-2">
                        {unavailability?.map(u => {
                            const reason = REASONS.find(r => r.id === u.reason);
                            const dateObj = new Date(u.unavailable_date);
                            const isConflict = hasConflict(dateObj);

                            return (
                                <div key={u.id} className={classNames(
                                    "flex items-center justify-between p-3 rounded-lg border bg-white",
                                    isConflict ? "border-red-300 bg-red-50" : "border-gray-100"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={classNames(
                                            "h-8 w-8 rounded-full flex items-center justify-center",
                                            isConflict ? "bg-red-500 text-white" : (reason?.color || "bg-gray-100 text-gray-500")
                                        )}>
                                            {isConflict ? <AlertTriangle className="h-4 w-4" /> : (reason ? <reason.icon className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">
                                                {format(dateObj, 'EEEE, MMM do')}
                                                {isConflict && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded border border-red-200 uppercase font-bold">Conflict</span>}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">{reason?.label || u.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal / Dialog for Reason Selection */}
            <Dialog open={isDialogOpen && !!selectedDate} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-sm mx-auto">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        {selectedDate && (
                            <div>
                                <DialogTitle>
                                    {format(selectedDate, 'EEEE, MMMM do')}
                                </DialogTitle>
                                <DialogDescription>Update availability status</DialogDescription>
                            </div>
                        )}
                        <button onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-2">
                        {/* Option to clear (Available) */}
                        <button
                            onClick={() => handleReasonSelect(null)}
                            disabled={isUpdating}
                            className={classNames(
                                "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                !existingReason ? "border-green-500 bg-green-50 ring-1 ring-green-500" : "border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-gray-900">Available</p>
                                <p className="text-xs text-gray-500">I am available to work</p>
                            </div>
                            {!existingReason && <div className="h-2 w-2 rounded-full bg-green-500" />}
                        </button>

                        <div className="my-2 border-t border-gray-100 opacity-50" />
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Mark as Unavailable</p>

                        {REASONS.map((reason) => {
                            const isSelected = existingReason === reason.id;
                            return (
                                <button
                                    key={reason.id}
                                    onClick={() => handleReasonSelect(reason.id)}
                                    disabled={isUpdating}
                                    className={classNames(
                                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                        isSelected ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <div className={classNames("h-8 w-8 rounded-full flex items-center justify-center", reason.color)}>
                                        <reason.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900">{reason.label}</p>
                                    </div>
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                                </button>
                            );
                        })}
                    </div>
                    {isUpdating && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
