'use client'

import { api } from '@/trpc/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Building2, User, Pencil, Trash2 } from 'lucide-react'

export function ContractorDetail({ id }: { id: string }) {
    const router = useRouter()
    const { data: contractor, isLoading } = api.contractors.getById.useQuery({ id })
    const deleteContractor = api.contractors.delete.useMutation({
        onSuccess: () => {
            router.push('/dashboard/contractors')
            router.refresh()
        },
    })

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading contractor details...</div>
    }

    if (!contractor) {
        return <div className="p-8 text-center text-gray-500">Contractor not found</div>
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this contractor?')) {
            deleteContractor.mutate({ id })
        }
    }

    const specialties = (typeof contractor.specialties === 'string' ? JSON.parse(contractor.specialties) : contractor.specialties) as string[]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                    <Link
                        href="/dashboard/contractors"
                        className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{contractor.company_name}</h1>
                        <div className="mt-1 flex items-center gap-x-3 text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${contractor.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    contractor.status === 'blacklisted' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                }`}>
                                {contractor.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                            <span>•</span>
                            <span>{contractor.contact_name}</span>
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
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Company Information</h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        {contractor.contact_name}
                                    </dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-x-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {contractor.email ? (
                                            <a href={`mailto:${contractor.email}`} className="hover:underline text-blue-600">
                                                {contractor.email}
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
                                        {contractor.phone ? (
                                            <a href={`tel:${contractor.phone}`} className="hover:underline text-blue-600">
                                                {contractor.phone}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Specialties</dt>
                                    <dd className="mt-2 flex flex-wrap gap-2">
                                        {specialties && specialties.length > 0 ? (
                                            specialties.map((specialty, index) => (
                                                <span key={index} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {specialty}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-sm">No specialties listed.</span>
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
                            Contractor added on {new Date(contractor.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
