'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'

const jobSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    customerId: z.string().min(1, 'Customer is required'),
    jobSiteId: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    assignments: z.array(z.string()).optional(), // Array of userIds or contractorIds
})

type JobFormValues = z.infer<typeof jobSchema>

export default function NewJobPage() {
    const router = useRouter()
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            priority: 'normal',
            assignments: []
        }
    })

    // Fetch Data
    const { data: customers } = api.customers.getAll.useQuery()
    const { data: jobSites } = api.jobSites.getByCustomerId.useQuery({ customerId: selectedCustomer! }, {
        enabled: !!selectedCustomer
    })
    const { data: workers } = api.workers.getAll.useQuery()
    const { data: contractors } = api.contractors.getAll.useQuery()

    const createJob = api.jobs.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/jobs')
            router.refresh()
        }
    })

    const onSubmit = (data: JobFormValues) => {
        // Separate assignments into workers and contractors
        const assignments = data.assignments?.map(id => {
            const isWorker = workers?.some(w => w.id === id)
            return {
                workerId: isWorker ? id : undefined,
                contractorId: !isWorker ? id : undefined
            }
        }) || []

        createJob.mutate({
            ...data,
            assignments
        })
    }

    // Watch customer change to fetch sites
    const customerId = watch('customerId')
    if (customerId !== selectedCustomer) {
        setSelectedCustomer(customerId)
        setValue('jobSiteId', '') // Reset site when customer changes
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard/jobs" className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-4">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Jobs
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create New Job</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Schedule a new job, assign workers, and set priorities.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">

                {/* Basic Info */}
                <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Job Details</h2>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                                Job Title
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    {...register('title')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                    placeholder="e.g. Kitchen Renovation"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">
                                Priority
                            </label>
                            <div className="mt-2">
                                <select
                                    {...register('priority')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                Description
                            </label>
                            <div className="mt-2">
                                <textarea
                                    rows={3}
                                    {...register('description')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer & Site */}
                <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Customer & Location</h2>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="customer" className="block text-sm font-medium leading-6 text-gray-900">
                                Customer
                            </label>
                            <div className="mt-2">
                                <select
                                    {...register('customerId')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select a customer</option>
                                    {customers?.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.business_name || `${customer.first_name} ${customer.last_name}`}
                                        </option>
                                    ))}
                                </select>
                                {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>}
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="jobSite" className="block text-sm font-medium leading-6 text-gray-900">
                                Job Site
                            </label>
                            <div className="mt-2">
                                <select
                                    {...register('jobSiteId')}
                                    disabled={!selectedCustomer}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Select a job site</option>
                                    {jobSites?.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Schedule</h2>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="startTime" className="block text-sm font-medium leading-6 text-gray-900">
                                Start Time
                            </label>
                            <div className="mt-2">
                                <input
                                    type="datetime-local"
                                    {...register('startTime')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="endTime" className="block text-sm font-medium leading-6 text-gray-900">
                                End Time
                            </label>
                            <div className="mt-2">
                                <input
                                    type="datetime-local"
                                    {...register('endTime')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignments */}
                <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Assignments</h2>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                                Assign Workers & Contractors
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Internal Workers */}
                                <div className="border rounded-md p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Internal Workers</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {workers?.map(worker => (
                                            <div key={worker.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    value={worker.id}
                                                    {...register('assignments')}
                                                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                />
                                                <label className="ml-3 text-sm text-gray-600">
                                                    {worker.first_name} {worker.last_name}
                                                </label>
                                            </div>
                                        ))}
                                        {(!workers || workers.length === 0) && <p className="text-xs text-gray-400">No workers found.</p>}
                                    </div>
                                </div>

                                {/* External Contractors */}
                                <div className="border rounded-md p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">External Contractors</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {contractors?.map(contractor => (
                                            <div key={contractor.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    value={contractor.id}
                                                    {...register('assignments')}
                                                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                />
                                                <label className="ml-3 text-sm text-gray-600">
                                                    {contractor.company_name} ({contractor.contact_name})
                                                </label>
                                            </div>
                                        ))}
                                        {(!contractors || contractors.length === 0) && <p className="text-xs text-gray-400">No contractors found.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 pt-6 border-t">
                    <Link href="/dashboard/jobs" className="text-sm font-semibold leading-6 text-gray-900">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={createJob.isPending}
                        className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        <Save className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        {createJob.isPending ? 'Creating...' : 'Create Job'}
                    </button>
                </div>
            </form>
        </div>
    )
}
