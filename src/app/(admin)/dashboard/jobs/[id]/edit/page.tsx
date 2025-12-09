'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const jobSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
})

type JobFormValues = z.infer<typeof jobSchema>

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const [jobId, setJobId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        params.then(p => setJobId(p.id))
    }, [params])

    const { data: job, isLoading } = api.jobs.getById.useQuery(jobId!, {
        enabled: !!jobId
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
    })

    useEffect(() => {
        if (job) {
            reset({
                title: job.title,
                description: job.description || '',
                status: job.status,
                priority: (job.priority as any) || 'normal',
                startTime: job.start_time ? format(new Date(job.start_time), "yyyy-MM-dd'T'HH:mm") : '',
                endTime: job.end_time ? format(new Date(job.end_time), "yyyy-MM-dd'T'HH:mm") : '',
            })
        }
    }, [job, reset])

    const { data: checklistTemplates } = api.checklists.getAll.useQuery()

    const utils = api.useUtils()

    const addChecklist = api.jobs.addChecklist.useMutation({
        onSuccess: () => {
            utils.jobs.getById.invalidate(jobId!)
        }
    })

    const removeChecklist = api.jobs.removeChecklist.useMutation({
        onSuccess: () => {
            utils.jobs.getById.invalidate(jobId!)
        }
    })

    const updateJob = api.jobs.update.useMutation({
        onSuccess: () => {
            router.push(`/dashboard/jobs/${jobId}`)
            router.refresh()
        }
    })

    const onSubmit = (data: JobFormValues) => {
        if (!jobId) return
        updateJob.mutate({
            id: jobId,
            ...data,
            startTime: data.startTime || undefined,
            endTime: data.endTime || undefined,
        })
    }

    if (isLoading || !job) return <div>Loading...</div>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href={`/dashboard/jobs/${jobId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-4">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Job
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">

                <div className="space-y-6">
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
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                                Status
                            </label>
                            <div className="mt-2">
                                <select
                                    {...register('status')}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
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

                {/* Checklists */}
                <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Checklists</h2>

                    <div className="space-y-4">
                        {job.job_checklists && job.job_checklists.length > 0 ? (
                            <ul className="divide-y divide-gray-100 border rounded-md">
                                {job.job_checklists.map((cl: any) => (
                                    <li key={cl.id} className="flex items-center justify-between p-4">
                                        <span className="text-sm font-medium text-gray-900">{cl.checklists?.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeChecklist.mutate({ jobChecklistId: cl.id })}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No checklists added.</p>
                        )}

                        <div className="flex gap-2">
                            <select
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        addChecklist.mutate({
                                            jobId: jobId!,
                                            checklistTemplateId: e.target.value
                                        })
                                        e.target.value = "" // Reset select
                                    }
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Add a checklist...</option>
                                {checklistTemplates?.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 pt-6 border-t">
                    <Link href={`/dashboard/jobs/${jobId}`} className="text-sm font-semibold leading-6 text-gray-900">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={updateJob.isPending}
                        className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        <Save className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        {updateJob.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
