'use client'

import { api } from '@/trpc/react'
import { useState, type ComponentType, type ReactNode } from 'react'
import { format } from 'date-fns'
import { Calculator, Clock3, PoundSterling } from 'lucide-react'

type RangeOption = 'week' | 'month' | 'all' | 'custom'

export default function PayrollPage() {
    const [range, setRange] = useState<RangeOption>('week')
    const [workerId, setWorkerId] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    const workersQuery = api.workers.getAll.useQuery()
    const payrollQuery = api.payroll.getJobPayrollRows.useQuery({
        range,
        workerId: workerId || undefined,
        startDate: range === 'custom' ? startDate : undefined,
        endDate: range === 'custom' ? endDate : undefined,
    })

    const rows = payrollQuery.data?.rows || []
    const summary = payrollQuery.data?.summary

    const exportRows = rows.map((row) => ({
        job: row.title,
        customer: row.customerName,
        site: row.siteName,
        scheduled_start: formatPayrollDateTime(row.scheduledStart),
        actual_start: formatPayrollDateTime(row.actualStart),
        scheduled_end: formatPayrollDateTime(row.scheduledEnd),
        actual_end: formatPayrollDateTime(row.actualEnd),
        payable_hours: row.payableHours.toFixed(2),
        workers: row.assignedWorkers.join(', '),
        functions: row.workerFunctions.join(', '),
        skills: row.workerSkills.join(', '),
        hourly_rates: row.hourlyRateLabel,
        estimated_pay: row.estimatedPay.toFixed(2),
    }))

    const downloadCsv = () => {
        const headers = Object.keys(exportRows[0] || {
            job: '',
            customer: '',
            site: '',
            scheduled_start: '',
            actual_start: '',
            scheduled_end: '',
            actual_end: '',
            payable_hours: '',
            workers: '',
            functions: '',
            skills: '',
            hourly_rates: '',
            estimated_pay: '',
        })
        const csvLines = [headers.join(',')].concat(
            exportRows.map((row) => headers.map((key) => `"${String((row as Record<string, string>)[key] || '').replaceAll('"', '""')}"`).join(','))
        )

        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `payroll-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payroll Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">Per-job payroll table using scheduled and actual attendance times.</p>
                </div>
                <button
                    type="button"
                    onClick={downloadCsv}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard label="Jobs in View" value={summary?.totalJobs?.toString() || '0'} icon={Calculator} />
                <MetricCard label="Payable Hours" value={summary ? summary.totalPayableHours.toFixed(2) : '0.00'} icon={Clock3} />
                <MetricCard label="Estimated Gross Pay" value={`£${summary ? summary.totalEstimatedPay.toFixed(2) : '0.00'}`} icon={PoundSterling} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Range</span>
                        <select
                            value={range}
                            onChange={(event) => setRange(event.target.value as RangeOption)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All</option>
                            <option value="custom">Custom</option>
                        </select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Worker</span>
                        <select
                            value={workerId}
                            onChange={(event) => setWorkerId(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="">All Workers</option>
                            {(workersQuery.data || []).map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.first_name} {worker.last_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">From</span>
                        <input
                            type="date"
                            disabled={range !== 'custom'}
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                        />
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">To</span>
                        <input
                            type="date"
                            disabled={range !== 'custom'}
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                        />
                    </label>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <HeaderCell>Job</HeaderCell>
                            <HeaderCell>Worker(s)</HeaderCell>
                            <HeaderCell>Function(s)</HeaderCell>
                            <HeaderCell>Skill(s)</HeaderCell>
                            <HeaderCell>Scheduled Start</HeaderCell>
                            <HeaderCell>Actual Start</HeaderCell>
                            <HeaderCell>Scheduled End</HeaderCell>
                            <HeaderCell>Actual End</HeaderCell>
                            <HeaderCell>Payable Hours</HeaderCell>
                            <HeaderCell>Rate(s)</HeaderCell>
                            <HeaderCell>Estimated Pay</HeaderCell>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payrollQuery.isLoading && (
                            <tr>
                                <td className="px-4 py-6 text-gray-500" colSpan={11}>Loading payroll rows...</td>
                            </tr>
                        )}
                        {!payrollQuery.isLoading && rows.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-gray-500" colSpan={11}>No jobs found for this filter.</td>
                            </tr>
                        )}
                        {rows.map((row) => (
                            <tr key={row.id} className="align-top">
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-900">{row.title}</p>
                                    <p className="text-xs text-gray-500">{row.customerName} · {row.siteName}</p>
                                </td>
                                <DataCell>{row.assignedWorkers.join(', ') || '-'}</DataCell>
                                <DataCell>{row.workerFunctions.join(', ') || '-'}</DataCell>
                                <DataCell>{row.workerSkills.join(', ') || '-'}</DataCell>
                                <DataCell>{formatPayrollDateTime(row.scheduledStart)}</DataCell>
                                <DataCell>{formatPayrollDateTime(row.actualStart)}</DataCell>
                                <DataCell>{formatPayrollDateTime(row.scheduledEnd)}</DataCell>
                                <DataCell>{formatPayrollDateTime(row.actualEnd)}</DataCell>
                                <DataCell>{row.payableHours.toFixed(2)}</DataCell>
                                <DataCell>{row.hourlyRateLabel}</DataCell>
                                <DataCell>£{row.estimatedPay.toFixed(2)}</DataCell>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <Icon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
    )
}

function HeaderCell({ children }: { children: ReactNode }) {
    return (
        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            {children}
        </th>
    )
}

function DataCell({ children }: { children: ReactNode }) {
    return (
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{children}</td>
    )
}

function formatPayrollDateTime(value?: string | null) {
    if (!value) return '-'
    return format(new Date(value), 'dd MMM yyyy HH:mm')
}
