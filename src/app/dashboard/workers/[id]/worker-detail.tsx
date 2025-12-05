'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Briefcase, DollarSign, User, Pencil, Trash2 } from 'lucide-react'

export function WorkerDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: worker, isLoading } = api.workers.getById.useQuery({ id })
    const deleteWorker = api.workers.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/workers')
            router.refresh()
        },
    })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading worker details...</div>
    }

    if (!worker) {
        return <div className="p-8 text-center text-gray-500">Worker not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this worker?')) {
            deleteWorker.mutate({ id })
        }
    }

    const skills = (typeof worker.skills === 'string' ? JSON.parse(worker.skills) : worker.skills) as string[]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                    <Link
                        href="/dashboard/workers"
                        className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{worker.first_name} {worker.last_name}</h1>
                        <div className="mt-1 flex items-center gap-x-3 text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${worker.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                worker.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                                }`}>
                                {worker.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                            <span>•</span>
                            <span>{worker.role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-x-3">
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                    >
                        <Trash2 className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Delete
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Edit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Profile Information</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {worker.email ? (
                                            <a href={`mailto:${worker.email}`} className="hover:underline text-blue-600">
                                                {worker.email}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        {worker.phone ? (
                                            <a href={`tel:${worker.phone}`} className="hover:underline text-blue-600">
                                                {worker.phone}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <Briefcase className="h-4 w-4 text-gray-400" />
                                        {worker.role}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                        {worker.hourly_rate ? `£${worker.hourly_rate.toFixed(2)}/hr` : 'N/A'}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Skills</dt>
                                    <dd className="mt-2 flex flex-wrap gap-2">
                                        {skills && skills.length > 0 ? (
                                            skills.map((skill, index) => (
                                                <span key={index} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-sm">No skills listed.</span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-900/5 bg-gray-50 px-4 py-3 sm:px-6">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Activity</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6 text-center text-sm text-gray-500">
                            Worker added on {new Date(worker.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
