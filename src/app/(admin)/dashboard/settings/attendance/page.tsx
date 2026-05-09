'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

type AttendanceSettingsView = {
    start_distance_meters?: number
    start_window_before_minutes?: number
    start_window_after_minutes?: number
    end_window_before_minutes?: number
    end_window_after_minutes?: number
    require_location_to_start?: boolean
    require_location_to_complete?: boolean
    max_location_accuracy_meters?: number
    allow_admin_location_override?: boolean
}

export default function AttendanceSettingsPage() {
    const { data: settings, isLoading } = api.settings.getSettings.useQuery()

    if (isLoading) return <div className="p-8">Loading settings...</div>

    const attendance = (settings?.attendance_settings || {}) as AttendanceSettingsView

    return (
        <AttendanceSettingsForm
            key={JSON.stringify(attendance)}
            attendance={attendance}
        />
    )
}

function AttendanceSettingsForm({ attendance }: { attendance: AttendanceSettingsView }) {
    const router = useRouter()
    const utils = api.useUtils()

    const updateAttendanceSettings = api.settings.updateAttendanceSettings.useMutation({
        onSuccess: () => {
            utils.settings.getSettings.invalidate()
            router.refresh()
            alert('Attendance and payroll settings updated successfully!')
        },
    })

    const [startDistanceMeters, setStartDistanceMeters] = useState(attendance.start_distance_meters ?? 250)
    const [startWindowBeforeMinutes, setStartWindowBeforeMinutes] = useState(attendance.start_window_before_minutes ?? 10)
    const [startWindowAfterMinutes, setStartWindowAfterMinutes] = useState(attendance.start_window_after_minutes ?? 10)
    const [endWindowBeforeMinutes, setEndWindowBeforeMinutes] = useState(attendance.end_window_before_minutes ?? 10)
    const [endWindowAfterMinutes, setEndWindowAfterMinutes] = useState(attendance.end_window_after_minutes ?? 10)
    const [requireLocationToStart, setRequireLocationToStart] = useState(attendance.require_location_to_start ?? true)
    const [requireLocationToComplete, setRequireLocationToComplete] = useState(attendance.require_location_to_complete ?? false)
    const [maxLocationAccuracyMeters, setMaxLocationAccuracyMeters] = useState(attendance.max_location_accuracy_meters ?? 100)
    const [allowAdminLocationOverride, setAllowAdminLocationOverride] = useState(attendance.allow_admin_location_override ?? true)

    const handleSubmit = () => {
        updateAttendanceSettings.mutate({
            startDistanceMeters,
            startWindowBeforeMinutes,
            startWindowAfterMinutes,
            endWindowBeforeMinutes,
            endWindowAfterMinutes,
            requireLocationToStart,
            requireLocationToComplete,
            maxLocationAccuracyMeters,
            allowAdminLocationOverride,
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <Link href="/dashboard/settings" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to System Settings
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Attendance & Payroll</h2>
                    <p className="text-sm text-gray-500 mt-1">Control worker start rules and payable-time defaults.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={updateAttendanceSettings.isPending}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {updateAttendanceSettings.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Start Gate</h3>
                        <p className="mt-1 text-sm text-gray-500">These controls decide whether a worker can start a scheduled job.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
                        <NumberField
                            label="Distance from site (metres)"
                            value={startDistanceMeters}
                            min={1}
                            max={5000}
                            onChange={setStartDistanceMeters}
                        />
                        <NumberField
                            label="Minutes before start"
                            value={startWindowBeforeMinutes}
                            min={0}
                            max={240}
                            onChange={setStartWindowBeforeMinutes}
                        />
                        <NumberField
                            label="Minutes after start"
                            value={startWindowAfterMinutes}
                            min={0}
                            max={240}
                            onChange={setStartWindowAfterMinutes}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Complete Gate</h3>
                        <p className="mt-1 text-sm text-gray-500">These controls decide whether a worker can complete a scheduled job.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <NumberField
                            label="Minutes before end"
                            value={endWindowBeforeMinutes}
                            min={0}
                            max={240}
                            onChange={setEndWindowBeforeMinutes}
                        />
                        <NumberField
                            label="Minutes after end"
                            value={endWindowAfterMinutes}
                            min={0}
                            max={240}
                            onChange={setEndWindowAfterMinutes}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Location Evidence</h3>
                        <p className="mt-1 text-sm text-gray-500">Browser GPS accuracy and job-site coordinates are used for attendance gates.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <NumberField
                            label="Maximum GPS accuracy (metres)"
                            value={maxLocationAccuracyMeters}
                            min={1}
                            max={1000}
                            onChange={setMaxLocationAccuracyMeters}
                        />
                        <div className="space-y-4">
                            <ToggleField
                                label="Require location to start jobs"
                                checked={requireLocationToStart}
                                onChange={setRequireLocationToStart}
                            />
                            <ToggleField
                                label="Require location to complete jobs"
                                checked={requireLocationToComplete}
                                onChange={setRequireLocationToComplete}
                            />
                            <ToggleField
                                label="Allow admin location override"
                                checked={allowAdminLocationOverride}
                                onChange={setAllowAdminLocationOverride}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Payroll Defaults</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Early starts, late starts, and late finishes are calculated against scheduled times until an admin authorises an adjustment on the job.
                    </p>
                </div>
            </div>
        </div>
    )
}

function NumberField({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
}) {
    return (
        <label className="block">
            <span className="block text-sm font-medium leading-6 text-gray-900">{label}</span>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)}
                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
        </label>
    )
}

function ToggleField({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
        </label>
    )
}
