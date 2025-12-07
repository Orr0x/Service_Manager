import Link from 'next/link'
import { Palette, Layout, Type, Settings, Users } from 'lucide-react'

const settingsSections = [
    {
        title: 'Branding & Appearance',
        description: 'Customize your company logo, colors, and theme.',
        href: '/dashboard/settings/branding',
        icon: Palette,
    },
    {
        title: 'Modules & Navigation',
        description: 'Enable/disable modules and rename navigation items.',
        href: '/dashboard/settings/modules',
        icon: Layout,
    },
    {
        title: 'Form Field Names',
        description: 'Customize field labels for your data entry forms.',
        href: '/dashboard/settings/forms',
        icon: Type,
    },
    {
        title: 'User Management',
        description: 'Manage access for workers and contractors.',
        href: '/dashboard/settings/users',
        icon: Users,
    },
]

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        System Settings
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Configure your Service Manager instance to suit your business needs.
                    </p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {settingsSections.map((section) => (
                    <Link
                        key={section.title}
                        href={section.href}
                        className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
                    >
                        <div className="flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                                <section.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="absolute inset-0" aria-hidden="true" />
                            <p className="text-sm font-medium text-gray-900">{section.title}</p>
                            <p className="truncate text-sm text-gray-500">{section.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
