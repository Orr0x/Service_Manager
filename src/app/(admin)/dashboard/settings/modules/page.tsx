'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const defaultModules = [
    { key: 'customers', label: 'Customers' },
    { key: 'job_sites', label: 'Job Sites' },
    { key: 'contracts', label: 'Contracts' },
    { key: 'quotes', label: 'Quotes' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'checklists', label: 'Checklists' },
    { key: 'workers', label: 'Internal Workers' },
    { key: 'contractors', label: 'External Contractors' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'schedule', label: 'Scheduling' },
    { key: 'services', label: 'Services' },
    { key: 'certification', label: 'Certification' },
]

export default function ModulesSettingsPage() {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: settings, isLoading } = api.settings.getSettings.useQuery()

    const updateNavigation = api.settings.updateNavigation.useMutation({
        onSuccess: () => {
            utils.settings.getSettings.invalidate()
            router.refresh()
            alert('Modules updated successfully!')
        },
    })

    const [modules, setModules] = useState<Record<string, { enabled: boolean, label: string }>>({})

    useEffect(() => {
        if (settings) {
            const nav = (settings.navigation as Record<string, any>) || {}
            const initialModules: Record<string, { enabled: boolean, label: string }> = {}

            defaultModules.forEach(m => {
                initialModules[m.key] = {
                    enabled: nav[m.key]?.enabled ?? true,
                    label: nav[m.key]?.label || m.label,
                }
            })
            setModules(initialModules)
        }
    }, [settings])

    const handleToggle = (key: string) => {
        setModules(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }))
    }

    const handleLabelChange = (key: string, newLabel: string) => {
        setModules(prev => ({
            ...prev,
            [key]: { ...prev[key], label: newLabel }
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateNavigation.mutate(modules)
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link href="/dashboard/settings" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to System Settings
                </Link>
            </div>
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Modules & Navigation
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Enable, disable, or rename modules to match your business terminology.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Module</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Display Name</th>
                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:pr-6">Enabled</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {defaultModules.map((module) => (
                                <tr key={module.key}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        {module.label}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <input
                                            type="text"
                                            value={modules[module.key]?.label || ''}
                                            onChange={(e) => handleLabelChange(module.key, e.target.value)}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500 sm:pr-6">
                                        <Switch
                                            checked={modules[module.key]?.enabled ?? true}
                                            onChange={() => handleToggle(module.key)}
                                            className={`${modules[module.key]?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                                        >
                                            <span className="sr-only">Use setting</span>
                                            <span
                                                aria-hidden="true"
                                                className={`${modules[module.key]?.enabled ? 'translate-x-5' : 'translate-x-0'
                                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                            />
                                        </Switch>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={updateNavigation.isPending}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {updateNavigation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
