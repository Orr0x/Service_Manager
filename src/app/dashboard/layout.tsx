import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOut } from '@/actions/auth'
import { UserNav } from '@/components/dashboard/user-nav'
import {
    LayoutDashboard,
    Briefcase,
    Building2,
    Users,
    HardHat,
    FileText,
    FileCheck,
    Receipt,
    CalendarDays,
    ClipboardCheck,
    CreditCard,
    Award,
    Search,
    Bell,
    Settings,
    Scale,
    PlayCircle,
    Wrench
} from 'lucide-react'
import { ThemeProvider } from '@/components/theme-provider'
import { SearchInput } from '@/components/common/search-input'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/sign-in')
    }

    // Fetch tenant info and settings
    // We fetch tenant_settings directly to ensure we get the latest data
    const { data: settingsData } = await supabase
        .from('tenant_settings')
        .select('branding, terminology, navigation')
        .eq('tenant_id', user.user_metadata.tenant_id)
        .single()

    // Also fetch tenant name for fallback
    const { data: tenantData } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', user.user_metadata.tenant_id)
        .single()

    const branding = (settingsData?.branding as any) || {
        primary_color: '#2563eb',
        secondary_color: '#1e40af',
        company_name: tenantData?.name || 'Service Manager',
        logo_url: null,
        theme: {
            sidebarBg: '#ffffff',
            sidebarText: '#374151',
            headerBg: '#ffffff',
            borderRadius: '0.5rem'
        }
    }
    const terminology = (settingsData?.terminology as Record<string, string>) || {}
    const navSettings = (settingsData?.navigation as Record<string, { enabled: boolean, label: string }>) || {}

    const defaultNavigation = [
        { key: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { key: 'customers', name: 'Customers', href: '/dashboard/customers', icon: Users },
        { key: 'job_sites', name: 'Job Sites', href: '/dashboard/job-sites', icon: Building2 },
        { key: 'contracts', name: 'Contracts', href: '/dashboard/contracts', icon: FileText },
        { key: 'quotes', name: 'Quotes', href: '/dashboard/quotes', icon: FileCheck },
        { key: 'invoices', name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
        { key: 'checklists', name: 'Checklists', href: '/dashboard/checklists', icon: ClipboardCheck },
        { key: 'workers', name: 'Internal Workers', href: '/dashboard/workers', icon: HardHat },
        { key: 'contractors', name: 'External Contractors', href: '/dashboard/contractors', icon: Briefcase },
        { key: 'jobs', name: 'Jobs', href: '/dashboard/jobs', icon: PlayCircle },
        { key: 'schedule', name: 'Scheduling', href: '/dashboard/schedule', icon: CalendarDays },
        { key: 'services', name: 'Services', href: '/dashboard/services', icon: Wrench },
        { key: 'certification', name: 'Certification', href: '/dashboard/certification', icon: Award },

    ]

    const navigation = defaultNavigation
        .filter(item => {
            if (item.key === 'dashboard' || item.key === 'settings') return true
            return navSettings[item.key]?.enabled ?? true
        })
        .map(item => ({
            ...item,
            name: navSettings[item.key]?.label || terminology[item.key] || item.name
        }))

    return (
        <ThemeProvider branding={branding}>
            <div className="min-h-screen bg-gray-50">
                {/* Sidebar */}
                <div
                    className="fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0"
                    style={{ backgroundColor: 'var(--sidebar-bg, #ffffff)' }}
                >
                    <div className="flex h-16 items-center px-4 border-b border-black/5">
                        {/* Search removed as per user request */}
                    </div>

                    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors hover:bg-black/5"
                                style={{ color: 'var(--sidebar-text, #374151)' }}
                            >
                                <item.icon
                                    className="mr-3 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary-color)]"
                                    aria-hidden="true"
                                />
                                <span className="group-hover:text-[var(--primary-color)]">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="border-t border-black/5 p-4">
                        {/* UserNav moved to header */}
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:pl-64 flex flex-col min-h-screen">
                    {/* Top Header */}
                    <header
                        className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
                        style={{ backgroundColor: 'var(--header-bg, #ffffff)' }}
                    >
                        <div className="flex items-center gap-x-4">
                            {branding.logo_url ? (
                                <img src={branding.logo_url} alt={branding.company_name} className="h-10 w-auto" />
                            ) : (
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: branding.primary_color }}>
                                    {branding.company_name.substring(0, 1).toUpperCase()}
                                </div>
                            )}
                            <span className="text-2xl font-bold tracking-tight text-gray-900">
                                {branding.company_name}
                            </span>
                        </div>

                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <UserNav user={user} />
                        </div>
                    </header>

                    <main className="flex-1 py-8">
                        <div className="px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div >
        </ThemeProvider >
    )
}
