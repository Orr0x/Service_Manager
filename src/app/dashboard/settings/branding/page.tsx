'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

export default function BrandingSettingsPage() {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: settings, isLoading } = api.settings.getSettings.useQuery()

    const updateBranding = api.settings.updateBranding.useMutation({
        onSuccess: () => {
            utils.settings.getSettings.invalidate()
            router.refresh()
            alert('Branding updated successfully!')
        },
    })

    const [companyName, setCompanyName] = useState('')
    const [primaryColor, setPrimaryColor] = useState('#2563eb')
    const [secondaryColor, setSecondaryColor] = useState('#1e40af')
    const [logoUrl, setLogoUrl] = useState('')

    useEffect(() => {
        if (settings?.branding) {
            const branding = settings.branding as any
            setCompanyName(branding.company_name || '')
            setPrimaryColor(branding.primary_color || '#2563eb')
            setSecondaryColor(branding.secondary_color || '#1e40af')
            setLogoUrl(branding.logo_url || '')
        }
    }, [settings])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateBranding.mutate({
            companyName,
            primaryColor,
            secondaryColor,
            logoUrl,
        })
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Branding & Appearance
                    </h2>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium leading-6 text-gray-900">
                            Company Name
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="companyName"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="logoUrl" className="block text-sm font-medium leading-6 text-gray-900">
                            Logo URL
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="logoUrl"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Primary Color</label>
                        <div className="mt-2 flex gap-4">
                            <div className="h-10 w-10 rounded border border-gray-300" style={{ backgroundColor: primaryColor }} />
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="h-10 w-20 p-1 rounded border border-gray-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">Secondary Color</label>
                        <div className="mt-2 flex gap-4">
                            <div className="h-10 w-10 rounded border border-gray-300" style={{ backgroundColor: secondaryColor }} />
                            <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="h-10 w-20 p-1 rounded border border-gray-300"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={updateBranding.isPending}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {updateBranding.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {/* Preview */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Live Preview</h3>

                    <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                        {/* Fake Header */}
                        <div className="border-b border-gray-200 px-4 py-4 sm:px-6" style={{ backgroundColor: 'white' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
                                    ) : (
                                        <div className="h-8 w-8 rounded bg-gray-200" />
                                    )}
                                    <span className="font-bold text-gray-900">{companyName || 'Company Name'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gray-100" />
                                </div>
                            </div>
                        </div>

                        {/* Fake Sidebar & Content */}
                        <div className="flex h-64">
                            <div className="w-48 border-r border-gray-200 bg-gray-50 p-4 space-y-2">
                                <div className="h-8 w-full rounded text-white flex items-center px-2 text-sm font-medium" style={{ backgroundColor: primaryColor }}>
                                    Dashboard
                                </div>
                                <div className="h-8 w-full rounded text-gray-700 hover:bg-gray-100 flex items-center px-2 text-sm font-medium">
                                    Customers
                                </div>
                                <div className="h-8 w-full rounded text-gray-700 hover:bg-gray-100 flex items-center px-2 text-sm font-medium">
                                    Jobs
                                </div>
                            </div>
                            <div className="flex-1 p-6">
                                <div className="h-8 w-1/3 rounded bg-gray-100 mb-4" />
                                <div className="h-32 w-full rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                                    Content Area
                                </div>
                                <button className="mt-4 px-4 py-2 rounded text-white text-sm font-medium" style={{ backgroundColor: secondaryColor }}>
                                    Secondary Action
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
