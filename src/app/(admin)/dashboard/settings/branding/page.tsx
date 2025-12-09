'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Upload, Monitor, Palette, Building, LayoutDashboard, Search, Bell, ArrowLeft } from 'lucide-react'

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

    // State
    const [companyName, setCompanyName] = useState('')
    const [primaryColor, setPrimaryColor] = useState('#2563eb')
    const [secondaryColor, setSecondaryColor] = useState('#1e40af')
    const [logoUrl, setLogoUrl] = useState('')

    // Theme State
    const [sidebarBg, setSidebarBg] = useState('#ffffff')
    const [sidebarText, setSidebarText] = useState('#374151')
    const [headerBg, setHeaderBg] = useState('#ffffff')
    const [borderRadius, setBorderRadius] = useState('0.5rem')

    const [isUploading, setIsUploading] = useState(false)
    const [activeTab, setActiveTab] = useState<'identity' | 'colors' | 'appearance'>('identity')

    const supabase = createClient()

    useEffect(() => {
        if (settings?.branding) {
            const branding = settings.branding as any
            setCompanyName(branding.company_name || '')
            setPrimaryColor(branding.primary_color || '#2563eb')
            setSecondaryColor(branding.secondary_color || '#1e40af')
            setLogoUrl(branding.logo_url || '')

            if (branding.theme) {
                setSidebarBg(branding.theme.sidebarBg || '#ffffff')
                setSidebarText(branding.theme.sidebarText || '#374151')
                setHeaderBg(branding.theme.headerBg || '#ffffff')
                setBorderRadius(branding.theme.borderRadius || '0.5rem')
            }
        }
    }, [settings])

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `logo-${Math.random().toString(36).substring(2)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName)

            setLogoUrl(data.publicUrl)
        } catch (error) {
            console.error('Error uploading logo:', error)
            alert('Failed to upload logo')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = () => {
        updateBranding.mutate({
            companyName,
            primaryColor,
            secondaryColor,
            logoUrl,
            theme: {
                sidebarBg,
                sidebarText,
                headerBg,
                borderRadius
            }
        })
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <Link href="/dashboard/settings" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to System Settings
                </Link>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Branding & Customization</h2>
                    <p className="text-sm text-gray-500 mt-1">Customize the look and feel of your application.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={updateBranding.isPending}
                    className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {updateBranding.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Navigation Tabs */}
                    <nav className="flex space-x-2 rounded-lg bg-gray-100 p-1">
                        {[
                            { id: 'identity', label: 'Identity', icon: Building },
                            { id: 'colors', label: 'Colors', icon: Palette },
                            { id: 'appearance', label: 'Appearance', icon: Monitor },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="mr-2 h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 space-y-6">
                        {activeTab === 'identity' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                                        Logo
                                    </label>
                                    <div className="flex items-center gap-x-4">
                                        {logoUrl ? (
                                            <div className="relative h-16 w-16 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                                                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex gap-2">
                                                <label className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                                                    {isUploading ? 'Uploading...' : 'Change Logo'}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                                                </label>
                                                {logoUrl && (
                                                    <button onClick={() => setLogoUrl('')} className="text-sm font-semibold text-red-600 px-3 py-2 hover:bg-red-50 rounded-md">
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Or enter image URL..."
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        className="mt-3 block w-full rounded-md border-0 py-1.5 text-xs text-gray-500 shadow-sm ring-1 ring-inset ring-gray-200"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'colors' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Primary Color</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="h-10 w-10 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: primaryColor }} />
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="block w-full h-10 rounded-md border border-gray-300 p-1 cursor-pointer"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Used for buttons, links, and highlights.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Secondary Color</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="h-10 w-10 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: secondaryColor }} />
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="block w-full h-10 rounded-md border border-gray-300 p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Sidebar Background</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="h-10 w-10 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: sidebarBg }} />
                                        <input type="color" value={sidebarBg} onChange={(e) => setSidebarBg(e.target.value)} className="flex-1 h-10 rounded-md border border-gray-300 p-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Sidebar Text Color</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="h-10 w-10 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: sidebarText }} />
                                        <input type="color" value={sidebarText} onChange={(e) => setSidebarText(e.target.value)} className="flex-1 h-10 rounded-md border border-gray-300 p-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Header Background</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="h-10 w-10 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: headerBg }} />
                                        <input type="color" value={headerBg} onChange={(e) => setHeaderBg(e.target.value)} className="flex-1 h-10 rounded-md border border-gray-300 p-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Border Radius</label>
                                    <select
                                        value={borderRadius}
                                        onChange={(e) => setBorderRadius(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    >
                                        <option value="0px">None (0px)</option>
                                        <option value="0.25rem">Small (4px)</option>
                                        <option value="0.5rem">Medium (8px)</option>
                                        <option value="0.75rem">Large (12px)</option>
                                        <option value="1rem">Extra Large (16px)</option>
                                        <option value="9999px">Full</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-8">
                    <div className="sticky top-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Live Preview</h3>
                            <div className="flex gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                <div className="h-3 w-3 rounded-full bg-green-400" />
                            </div>
                        </div>

                        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50 flex h-[600px]">
                            {/* Preview Sidebar */}
                            <div className="w-64 flex-shrink-0 flex flex-col border-r border-black/5 transition-colors duration-200" style={{ backgroundColor: sidebarBg }}>
                                <div className="h-16 flex items-center px-6 border-b border-black/5">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
                                    ) : (
                                        <div className="h-8 w-8 rounded flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor, borderRadius }}>
                                            {(companyName || 'C').substring(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="ml-3 font-bold truncate" style={{ color: sidebarText }}>{companyName || 'Company'}</span>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium bg-black/5" style={{ color: sidebarText, borderRadius }}>
                                        <LayoutDashboard className="mr-3 h-5 w-5 opacity-70" />
                                        Dashboard
                                    </div>
                                    {['Customers', 'Jobs', 'Schedule', 'Settings'].map((item) => (
                                        <div key={item} className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-black/5 transition-colors" style={{ color: sidebarText, borderRadius }}>
                                            <div className="mr-3 h-5 w-5 bg-current opacity-20 rounded" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 transition-colors duration-200" style={{ backgroundColor: headerBg }}>
                                    <div className="w-64 h-8 bg-gray-100 rounded-md flex items-center px-3">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <span className="ml-2 text-xs text-gray-400">Search...</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Bell className="h-5 w-5 text-gray-400" />
                                        <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-300" />
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="h-32 rounded-xl bg-white border border-gray-200 shadow-sm p-6" style={{ borderRadius }}>
                                        <div className="h-6 w-1/3 bg-gray-100 rounded mb-4" />
                                        <div className="h-4 w-2/3 bg-gray-50 rounded" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="h-48 rounded-xl bg-white border border-gray-200 shadow-sm p-6 flex flex-col justify-between" style={{ borderRadius }}>
                                            <div className="h-8 w-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
                                                <div className="h-4 w-24 bg-gray-50 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-48 rounded-xl bg-white border border-gray-200 shadow-sm p-6 flex items-center justify-center border-dashed" style={{ borderRadius }}>
                                            <button className="px-4 py-2 text-white text-sm font-medium shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: secondaryColor, borderRadius }}>
                                                Secondary Action
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
