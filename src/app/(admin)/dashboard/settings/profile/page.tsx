'use client'

import { useState, useEffect } from 'react'
import { api } from '@/trpc/react'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Building, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UserProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const utils = api.useUtils()

    // Data Fetching
    const { data: user, isLoading: isUserLoading } = api.users.me.useQuery()
    const { data: settings } = api.settings.getSettings.useQuery()

    // Mutations
    const updateUser = api.users.update.useMutation({
        onSuccess: () => {
            utils.users.me.invalidate()
            alert('Profile updated successfully!')
        }
    })

    const updateBranding = api.settings.updateBranding.useMutation({
        onSuccess: () => {
            utils.settings.getSettings.invalidate()
            alert('Business information updated successfully!')
        }
    })

    // Tabs
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'business'>('profile')

    // State - Profile
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

    // State - Security
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // State - Business
    const [companyName, setCompanyName] = useState('')
    const [primaryColor, setPrimaryColor] = useState('#2563eb')
    const [secondaryColor, setSecondaryColor] = useState('#1e40af')

    // Initialize state when data loads
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '')
            setLastName(user.last_name || '')
        }
    }, [user])

    useEffect(() => {
        if (settings?.branding) {
            const branding = settings.branding as any
            setCompanyName(branding.company_name || '')
            setPrimaryColor(branding.primary_color || '#2563eb')
            setSecondaryColor(branding.secondary_color || '#1e40af')
        }
    }, [settings])

    // Handlers
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateUser.mutate({ firstName, lastName })
    }

    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match')
            return
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (error) {
            alert(`Error updating password: ${error.message}`)
        } else {
            alert('Password updated successfully!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        }
    }

    const handleBusinessSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // We preserve existing theme settings, only updating basic info here. 
        // For full branding, user should go to Branding page.
        const branding = settings?.branding as any || {}
        updateBranding.mutate({
            companyName,
            primaryColor,
            secondaryColor,
            logoUrl: branding.logo_url,
            theme: branding.theme
        })
    }

    if (isUserLoading) return <div className="p-8">Loading profile...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link href="/dashboard" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    User Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Manage your personal profile, security, and business details.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'profile'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <User className="mr-3 h-5 w-5 flex-shrink-0" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'security'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Lock className="mr-3 h-5 w-5 flex-shrink-0" />
                        Security
                    </button>
                    {(user?.role === 'admin') && (
                        <button
                            onClick={() => setActiveTab('business')}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'business'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Building className="mr-3 h-5 w-5 flex-shrink-0" />
                            Business Info
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    {activeTab === 'profile' && (
                        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                            <div className="md:grid md:grid-cols-3 md:gap-6">
                                <div className="md:col-span-1">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Update your personal details.
                                    </p>
                                </div>
                                <div className="mt-5 md:mt-0 md:col-span-2">
                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        <div className="grid grid-cols-6 gap-6">
                                            <div className="col-span-6 sm:col-span-3">
                                                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
                                                <input
                                                    type="text"
                                                    name="first-name"
                                                    id="first-name"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                />
                                            </div>

                                            <div className="col-span-6 sm:col-span-3">
                                                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
                                                <input
                                                    type="text"
                                                    name="last-name"
                                                    id="last-name"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                />
                                            </div>

                                            <div className="col-span-6">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                                <input
                                                    type="text"
                                                    name="email"
                                                    id="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                />
                                            </div>

                                            <div className="col-span-6">
                                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                                <div className="mt-1 flex items-center">
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 capitalize">
                                                        {user?.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={updateUser.isPending}
                                                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                            >
                                                {updateUser.isPending ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                            <div className="md:grid md:grid-cols-3 md:gap-6">
                                <div className="md:col-span-1">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Ensure your account is using a long, random password to stay secure.
                                    </p>
                                </div>
                                <div className="mt-5 md:mt-0 md:col-span-2">
                                    <form onSubmit={handleSecuritySubmit} className="space-y-6">
                                        <div>
                                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                                            <input
                                                type="password"
                                                id="new-password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                            <input
                                                type="password"
                                                id="confirm-password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'business' && (
                        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                            <div className="md:grid md:grid-cols-3 md:gap-6">
                                <div className="md:col-span-1">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Business Information</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Manage your business details visible on documents.
                                    </p>
                                </div>
                                <div className="mt-5 md:mt-0 md:col-span-2">
                                    <form onSubmit={handleBusinessSubmit} className="space-y-6">
                                        <div>
                                            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">Company Name</label>
                                            <input
                                                type="text"
                                                id="company-name"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700">Primary Brand Color</label>
                                            <div className="flex items-center mt-1">
                                                <input
                                                    type="color"
                                                    id="primary-color"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="h-9 w-9 border border-gray-300 rounded-md p-0.5 cursor-pointer"
                                                />
                                                <span className="ml-2 text-sm text-gray-500">{primaryColor}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={updateBranding.isPending}
                                                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                            >
                                                {updateBranding.isPending ? 'Saving...' : 'Save Business Info'}
                                            </button>
                                        </div>
                                        <div className="mt-4 rounded-md bg-blue-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <Building className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-blue-800">Need more customization?</h3>
                                                    <div className="mt-2 text-sm text-blue-700">
                                                        <p>
                                                            For advanced branding options like logo uploads and improved themes, visit the{' '}
                                                            <Link href="/dashboard/settings/branding" className="font-medium underline hover:text-blue-600">
                                                                Branding Settings
                                                            </Link>{' '}
                                                            page.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
