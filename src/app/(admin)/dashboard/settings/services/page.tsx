'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ServiceSettingsPage() {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: settings, isLoading } = api.settings.getSettings.useQuery()

    const updateServiceSettings = api.settings.updateServiceSettings.useMutation({
        onSuccess: () => {
            utils.settings.getSettings.invalidate()
            router.refresh()
            alert('Service settings updated successfully!')
        },
    })

    // State
    const [defaultCurrency, setDefaultCurrency] = useState('GBP')
    const [defaultDuration, setDefaultDuration] = useState(60)
    const [enabledCategories, setEnabledCategories] = useState<string[]>(['general'])

    useEffect(() => {
        if (settings?.services_settings) {
            const services = settings.services_settings as any
            setDefaultCurrency(services.default_currency || 'GBP')
            setDefaultDuration(services.default_duration || 60)
            setEnabledCategories(services.enabled_categories || ['general'])
        }
    }, [settings])

    const handleSubmit = () => {
        updateServiceSettings.mutate({
            defaultCurrency,
            defaultDuration,
            enabledCategories,
        })
    }

    const availableCategories = [
        { id: 'general', label: 'General' },
        { id: 'cleaning', label: 'Cleaning' },
        { id: 'repairs', label: 'Repairs' },
        { id: 'maintenance', label: 'Maintenance' },
        { id: 'installation', label: 'Installation' },
        { id: 'inspection', label: 'Inspection' },
    ]

    const toggleCategory = (categoryId: string) => {
        setEnabledCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        )
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

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
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Service Configuration</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage defaults and options for your service catalog.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={updateServiceSettings.isPending}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                    {updateServiceSettings.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
                {/* Defaults Section */}
                <div className="p-6 space-y-6">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Defaults</h3>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="currency" className="block text-sm font-medium leading-6 text-gray-900">
                                Default Currency
                            </label>
                            <select
                                id="currency"
                                value={defaultCurrency}
                                onChange={(e) => setDefaultCurrency(e.target.value)}
                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            >
                                <option value="GBP">GBP (£)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="duration" className="block text-sm font-medium leading-6 text-gray-900">
                                Default Duration (minutes)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                value={defaultDuration}
                                onChange={(e) => setDefaultDuration(parseInt(e.target.value) || 0)}
                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Service Categories</h3>
                        <p className="mt-1 text-sm text-gray-500">Enable the categories relevant to your business.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableCategories.map((category) => (
                            <div
                                key={category.id}
                                onClick={() => toggleCategory(category.id)}
                                className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-all ${enabledCategories.includes(category.id)
                                        ? 'border-blue-200 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="min-w-0 flex-1 text-sm">
                                    <span className={`font-medium ${enabledCategories.includes(category.id) ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                        {category.label}
                                    </span>
                                </div>
                                <div className={`ml-3 flex h-5 w-5 items-center justify-center rounded-full border ${enabledCategories.includes(category.id)
                                        ? 'bg-blue-600 border-transparent text-white'
                                        : 'bg-white border-gray-300'
                                    }`}>
                                    {enabledCategories.includes(category.id) && (
                                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                            <path d="M3.75 6L5.25 7.5L8.25 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
