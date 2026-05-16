export type AttendanceSettings = {
    start_distance_meters: number
    start_window_before_minutes: number
    start_window_after_minutes: number
    end_window_before_minutes: number
    end_window_after_minutes: number
    enforce_start_time_gate: boolean
    enforce_end_time_gate: boolean
    enforce_location_distance_gate: boolean
    enforce_location_accuracy_gate: boolean
    require_location_to_start: boolean
    require_location_to_complete: boolean
    max_location_accuracy_meters: number
    allow_admin_location_override: boolean
}

const minimumStartEarlyAllowanceMinutes = 30

export const defaultAttendanceSettings: AttendanceSettings = {
    start_distance_meters: 250,
    start_window_before_minutes: minimumStartEarlyAllowanceMinutes,
    start_window_after_minutes: 0,
    end_window_before_minutes: 0,
    end_window_after_minutes: 0,
    enforce_start_time_gate: true,
    enforce_end_time_gate: false,
    enforce_location_distance_gate: true,
    enforce_location_accuracy_gate: true,
    require_location_to_start: true,
    require_location_to_complete: false,
    max_location_accuracy_meters: 100,
    allow_admin_location_override: true,
}

export function mergeAttendanceSettings(settings: unknown): AttendanceSettings {
    const raw = settings && typeof settings === 'object' ? settings as Partial<AttendanceSettings> : {}

    return {
        ...defaultAttendanceSettings,
        ...raw,
        start_distance_meters: toPositiveNumber(raw.start_distance_meters, defaultAttendanceSettings.start_distance_meters),
        start_window_before_minutes: toNonNegativeNumber(raw.start_window_before_minutes, defaultAttendanceSettings.start_window_before_minutes),
        start_window_after_minutes: toNonNegativeNumber(raw.start_window_after_minutes, defaultAttendanceSettings.start_window_after_minutes),
        end_window_before_minutes: toNonNegativeNumber(raw.end_window_before_minutes, defaultAttendanceSettings.end_window_before_minutes),
        end_window_after_minutes: toNonNegativeNumber(raw.end_window_after_minutes, defaultAttendanceSettings.end_window_after_minutes),
        enforce_start_time_gate: raw.enforce_start_time_gate ?? defaultAttendanceSettings.enforce_start_time_gate,
        enforce_end_time_gate: raw.enforce_end_time_gate ?? defaultAttendanceSettings.enforce_end_time_gate,
        enforce_location_distance_gate: raw.enforce_location_distance_gate ?? defaultAttendanceSettings.enforce_location_distance_gate,
        enforce_location_accuracy_gate: raw.enforce_location_accuracy_gate ?? defaultAttendanceSettings.enforce_location_accuracy_gate,
        max_location_accuracy_meters: toPositiveNumber(raw.max_location_accuracy_meters, defaultAttendanceSettings.max_location_accuracy_meters),
        require_location_to_start: raw.require_location_to_start ?? defaultAttendanceSettings.require_location_to_start,
        require_location_to_complete: raw.require_location_to_complete ?? defaultAttendanceSettings.require_location_to_complete,
        allow_admin_location_override: raw.allow_admin_location_override ?? defaultAttendanceSettings.allow_admin_location_override,
    }
}

export type Coordinate = {
    latitude: number
    longitude: number
}

export type PayableTimeInput = {
    scheduledStart?: string | Date | null
    scheduledEnd?: string | Date | null
    actualStart?: string | Date | null
    actualEnd?: string | Date | null
    earlyStartAuthorized?: boolean
    lateStartAuthorized?: boolean
    lateFinishAuthorized?: boolean
}

export function calculateDistanceMeters(from: Coordinate, to: Coordinate): number {
    const earthRadiusMeters = 6371000
    const lat1 = toRadians(from.latitude)
    const lat2 = toRadians(to.latitude)
    const deltaLat = toRadians(to.latitude - from.latitude)
    const deltaLng = toRadians(to.longitude - from.longitude)

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
        + Math.cos(lat1) * Math.cos(lat2)
        * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(earthRadiusMeters * c)
}

export function calculatePayableTime(input: PayableTimeInput) {
    const scheduledStart = toDate(input.scheduledStart)
    const scheduledEnd = toDate(input.scheduledEnd)
    const actualStart = toDate(input.actualStart)
    const actualEnd = toDate(input.actualEnd)

    let payableStart: Date | null = null
    let payableEnd: Date | null = null

    if (scheduledStart && actualStart) {
        if (actualStart.getTime() < scheduledStart.getTime()) {
            payableStart = input.earlyStartAuthorized ? actualStart : scheduledStart
        } else if (actualStart.getTime() > scheduledStart.getTime()) {
            payableStart = input.lateStartAuthorized ? scheduledStart : actualStart
        } else {
            payableStart = actualStart
        }
    } else {
        payableStart = actualStart || scheduledStart
    }

    if (scheduledEnd && actualEnd) {
        if (actualEnd.getTime() <= scheduledEnd.getTime()) {
            payableEnd = scheduledEnd
        } else {
            payableEnd = input.lateFinishAuthorized ? actualEnd : scheduledEnd
        }
    } else {
        payableEnd = actualEnd || scheduledEnd
    }

    const payableMinutes = payableStart && payableEnd
        ? Math.max(0, Math.ceil((payableEnd.getTime() - payableStart.getTime()) / 60000))
        : null

    return {
        payableStart,
        payableEnd,
        payableMinutes,
    }
}

export function getStartGateFailure(input: {
    now: Date
    scheduledStart?: string | Date | null
    settings: AttendanceSettings
    distanceMeters?: number | null
    accuracyMeters?: number | null
    hasWorkerLocation: boolean
    hasSiteLocation: boolean
    locationOverrideAuthorized?: boolean
}) {
    const scheduledStart = toDate(input.scheduledStart)
    const locationOverride = input.locationOverrideAuthorized && input.settings.allow_admin_location_override

    if (!scheduledStart) {
        return 'This job needs a scheduled start time before it can be started.'
    }

    const earliestStart = new Date(scheduledStart.getTime() - minimumStartEarlyAllowanceMinutes * 60000)

    if (input.now.getTime() < earliestStart.getTime()) {
        return `This job can be started from ${formatGateTime(earliestStart)}.`
    }

    if (input.settings.require_location_to_start && !locationOverride) {
        if (!input.hasSiteLocation) {
            return 'This job site has missing or invalid coordinates. Ask an admin to update the site location.'
        }

        if (!input.hasWorkerLocation) {
            return 'Location permission is required before this job can be started.'
        }

        if (
            input.settings.enforce_location_accuracy_gate
            && typeof input.accuracyMeters === 'number'
            && input.accuracyMeters > input.settings.max_location_accuracy_meters
        ) {
            return `Location accuracy is ${Math.round(input.accuracyMeters)}m. It must be within ${input.settings.max_location_accuracy_meters}m to start this job.`
        }

        if (
            input.settings.enforce_location_distance_gate
            && typeof input.distanceMeters === 'number'
            && input.distanceMeters > input.settings.start_distance_meters
        ) {
            return `You are ${Math.round(input.distanceMeters)}m from the job site. You must be within ${input.settings.start_distance_meters}m to start this job.`
        }
    }

    return null
}

function toDate(value?: string | Date | null) {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function toRadians(value: number) {
    return value * Math.PI / 180
}

function toPositiveNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && value > 0 ? value : fallback
}

function toNonNegativeNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && value >= 0 ? value : fallback
}

function formatGateTime(value: Date) {
    return value.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
