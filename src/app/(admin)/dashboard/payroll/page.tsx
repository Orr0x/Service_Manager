'use client'

import { api } from '@/trpc/react'
import { Fragment, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { format } from 'date-fns'
import { Calculator, Clock3, ExternalLink, PoundSterling } from 'lucide-react'
import Link from 'next/link'
import { DataViewControls } from '@/components/common/data-view-controls'
import { compareValues, groupRows, includesSearch } from '@/lib/data-view'

type RangeOption = 'week' | 'month' | 'all' | 'custom'

export default function PayrollPage() {
    const [range, setRange] = useState<RangeOption>('all')
    const [workerId, setWorkerId] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [refineSearch, setRefineSearch] = useState('')
    const [sortBy, setSortBy] = useState('scheduledStart')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [groupBy, setGroupBy] = useState('job')

    const workersQuery = api.workers.getAll.useQuery()
    const payrollQuery = api.payroll.getJobPayrollRows.useQuery({
        range,
        workerId: workerId || undefined,
        startDate: range === 'custom' ? startDate : undefined,
        endDate: range === 'custom' ? endDate : undefined,
    })

    const rows = payrollQuery.data?.rows || []
    const summary = payrollQuery.data?.summary
    const visibleRows = useMemo(() => {
        return [...rows]
            .filter((row) => includesSearch([
                row.title,
                row.customerName,
                row.siteName,
                row.assignedWorkers.join(', '),
                row.workerFunctions.join(', '),
                row.workerSkills.join(', '),
                row.hourlyRateLabel,
            ], refineSearch))
            .sort((a, b) => compareValues(getPayrollSortValue(a, sortBy), getPayrollSortValue(b, sortBy), sortDirection))
    }, [rows, refineSearch, sortBy, sortDirection])

    const groupedRows = useMemo(() => groupRows(visibleRows, groupBy, getPayrollGroup), [visibleRows, groupBy])

    const exportRows = visibleRows.map((row) => ({
        job: row.title,
        customer: row.customerName,
        site: row.siteName,
        scheduled_start: formatPayrollDateTime(row.scheduledStart),
        actual_start: formatPayrollDateTime(row.actualStart),
        scheduled_end: formatPayrollDateTime(row.scheduledEnd),
        actual_end: formatPayrollDateTime(row.actualEnd),
        payable_hours: row.payableHours.toFixed(2),
        worker: row.assignedWorkers.join(', '),
        function: row.workerFunctions.join(', '),
        skills: row.workerSkills.join(', '),
        hourly_rate: row.hourlyRateLabel,
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payroll Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">Worker-level payroll rows using scheduled, actual, and approved payable times.</p>
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
                <MetricCard label="Payable Worker Hours" value={summary ? summary.totalPayableHours.toFixed(2) : '0.00'} icon={Clock3} />
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

            <DataViewControls
                search={refineSearch}
                onSearchChange={setRefineSearch}
                searchPlaceholder="Refine payroll by worker, job, customer, or site..."
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOptions={[
                    { value: 'scheduledStart', label: 'Scheduled start' },
                    { value: 'worker', label: 'Worker' },
                    { value: 'job', label: 'Job' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'site', label: 'Job site' },
                    { value: 'payableHours', label: 'Payable hours' },
                    { value: 'estimatedPay', label: 'Estimated pay' },
                ]}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                groupOptions={[
                    { value: 'none', label: 'No grouping' },
                    { value: 'worker', label: 'Worker' },
                    { value: 'job', label: 'Job' },
                    { value: 'date', label: 'Date' },
                    { value: 'customer', label: 'Customer' },
                    { value: 'site', label: 'Job site' },
                ]}
                onReset={() => {
                    setRefineSearch('')
                    setSortBy('scheduledStart')
                    setSortDirection('desc')
                    setGroupBy('job')
                }}
            />

            <div className="space-y-3 md:hidden">
                {payrollQuery.isLoading && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">Loading payroll rows...</div>
                )}
                {!payrollQuery.isLoading && visibleRows.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">No jobs found for this filter.</div>
                )}
                {groupedRows.map((group) => (
                    <section key={group.key} className="space-y-3">
                        {groupBy !== 'none' && <PayrollGroupHeader label={group.label} />}
                        {group.rows.map((row) => (
                            <article key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold leading-6 text-gray-900">{row.title}</h2>
                                {formatPayrollContext(row.customerName, row.siteName) && (
                                    <p className="mt-1 text-xs leading-5 text-gray-500">{formatPayrollContext(row.customerName, row.siteName)}</p>
                                )}
                            </div>
                            <Link
                                href={`/dashboard/jobs/${row.jobId}?tab=payroll`}
                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            >
                                Review
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <MobileField label="Worker" value={row.assignedWorkers.join(', ') || '-'} />
                            <MobileField label="Function" value={row.workerFunctions.join(', ') || '-'} />
                            <MobileField label="Skill" value={row.workerSkills.join(', ') || '-'} />
                            <MobileField label="Rate" value={row.hourlyRateLabel} />
                            <MobileField label="Scheduled Start" value={formatPayrollDateTime(row.scheduledStart)} />
                            <MobileField label="Scheduled End" value={formatPayrollDateTime(row.scheduledEnd)} />
                            <MobileField label="Actual Start" value={formatPayrollDateTime(row.actualStart)} />
                            <MobileField label="Actual End" value={formatPayrollDateTime(row.actualEnd)} />
                            <MobileField label="Payable Hours" value={row.payableHours.toFixed(2)} strong />
                            <MobileField label="Estimated Pay" value={`£${row.estimatedPay.toFixed(2)}`} strong />
                        </dl>
                            </article>
                        ))}
                        {groupBy !== 'none' && <PayrollGroupTotal label={group.label} rows={group.rows} />}
                    </section>
                ))}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <HeaderCell>Job</HeaderCell>
                            <HeaderCell>Worker</HeaderCell>
                            <HeaderCell>Function</HeaderCell>
                            <HeaderCell>Skill(s)</HeaderCell>
                            <HeaderCell>Scheduled Start</HeaderCell>
                            <HeaderCell>Actual Start</HeaderCell>
                            <HeaderCell>Scheduled End</HeaderCell>
                            <HeaderCell>Actual End</HeaderCell>
                            <HeaderCell>Payable Hours</HeaderCell>
                            <HeaderCell>Rate</HeaderCell>
                            <HeaderCell>Estimated Pay</HeaderCell>
                            <HeaderCell>Review</HeaderCell>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payrollQuery.isLoading && (
                            <tr>
                                <td className="px-4 py-6 text-gray-500" colSpan={12}>Loading payroll rows...</td>
                            </tr>
                        )}
                        {!payrollQuery.isLoading && visibleRows.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-gray-500" colSpan={12}>No jobs found for this filter.</td>
                            </tr>
                        )}
                        {groupedRows.map((group) => (
                            <Fragment key={group.key}>
                                {groupBy !== 'none' && (
                                    <tr key={`${group.key}-header`} className="bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-semibold text-gray-900" colSpan={12}>
                                            {group.label}
                                        </td>
                                    </tr>
                                )}
                                {group.rows.map((row) => (
                                    <tr key={row.id} className="align-top">
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-900">{row.title}</p>
                                    {formatPayrollContext(row.customerName, row.siteName) && (
                                        <p className="text-xs text-gray-500">{formatPayrollContext(row.customerName, row.siteName)}</p>
                                    )}
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
                                <td className="whitespace-nowrap px-4 py-3 text-sm">
                                    <Link
                                        href={`/dashboard/jobs/${row.jobId}?tab=payroll`}
                                        className="font-semibold text-blue-600 hover:text-blue-500"
                                    >
                                        Payroll tab
                                    </Link>
                                </td>
                                    </tr>
                                ))}
                                {groupBy !== 'none' && (
                                    <tr key={`${group.key}-total`} className="bg-blue-50/60">
                                        <td className="px-4 py-2 text-sm font-semibold text-blue-950" colSpan={8}>
                                            {group.label} total
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-semibold text-blue-950">
                                            {getPayrollGroupTotals(group.rows).totalHours.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2" />
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-semibold text-blue-950">
                                            £{getPayrollGroupTotals(group.rows).totalPay.toFixed(2)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-xs font-medium text-blue-900">
                                            {group.rows.length} {group.rows.length === 1 ? 'row' : 'rows'}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
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

function MobileField({ label, value, strong = false }: { label: string; value: ReactNode; strong?: boolean }) {
    return (
        <div className="min-w-0 rounded-md bg-gray-50 px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase text-gray-500">{label}</dt>
            <dd className={`mt-1 break-words text-sm ${strong ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{value}</dd>
        </div>
    )
}

function formatPayrollContext(customerName?: string | null, siteName?: string | null) {
    return [customerName, siteName]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(' · ')
}

function getPayrollSortValue(row: any, sortBy: string) {
    switch (sortBy) {
        case 'worker':
            return row.assignedWorkers.join(', ')
        case 'job':
            return row.title
        case 'customer':
            return row.customerName
        case 'site':
            return row.siteName
        case 'payableHours':
            return row.payableHours
        case 'estimatedPay':
            return row.estimatedPay
        case 'scheduledStart':
        default:
            return row.scheduledStart
    }
}

function getPayrollGroup(row: any, groupBy: string) {
    switch (groupBy) {
        case 'worker': {
            const label = row.assignedWorkers.join(', ') || 'Unassigned'
            return { key: label, label }
        }
        case 'job':
            return { key: row.jobId || row.title, label: row.title || 'Untitled job' }
        case 'date': {
            const label = row.scheduledStart ? format(new Date(row.scheduledStart), 'dd MMM yyyy') : 'Unscheduled'
            return { key: label, label }
        }
        case 'customer':
            return { key: row.customerName || 'No customer', label: row.customerName || 'No customer' }
        case 'site':
            return { key: row.siteName || 'No site', label: row.siteName || 'No site' }
        default:
            return { key: 'all', label: 'All payroll rows' }
    }
}

function PayrollGroupHeader({ label }: { label: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900">
            {label}
        </div>
    )
}

function PayrollGroupTotal({ label, rows }: { label: string; rows: any[] }) {
    const totals = getPayrollGroupTotals(rows)

    return (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-blue-950">{label} total</span>
                <span className="text-sm font-semibold text-blue-950">
                    {totals.totalHours.toFixed(2)} hrs · £{totals.totalPay.toFixed(2)}
                </span>
                <span className="text-xs font-medium text-blue-800">
                    {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                </span>
            </div>
        </div>
    )
}

function getPayrollGroupTotals(rows: any[]) {
    const totalHours = rows.reduce((sum, row) => sum + row.payableHours, 0)
    const totalPay = rows.reduce((sum, row) => sum + row.estimatedPay, 0)

    return { totalHours, totalPay }
}

function formatPayrollDateTime(value?: string | null) {
    if (!value) return '-'
    return format(new Date(value), 'dd MMM yyyy HH:mm')
}
