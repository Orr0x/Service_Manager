import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOut } from '@/actions/auth'
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
    PlayCircle
} from 'lucide-react'
import { ThemeProvider } from '@/components/theme-provider'

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
    const { data: tenantData } = await supabase
        .from('tenants')
        .select(`
            name,
            tenant_settings (
                branding,
                terminology,
                navigation
            )
        `)
        .eq('id', user.user_metadata.tenant_id)
        .single()

    const settings = (tenantData?.tenant_settings?.[0] || {}) as any
    const branding = (settings.branding as any) || {
        primary_color: '#2563eb',
        secondary_color: '#1e40af',
        company_name: tenantData?.name || 'Service Manager',
        logo_url: null
    }
    const terminology = (settings.terminology as Record<string, string>) || {}
    const navSettings = (settings.navigation as Record<string, { enabled: boolean, label: string }>) || {}

    const defaultNavigation = [
        { key: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { key: 'customers', name: 'Customers', href: '/dashboard/customers', icon: Users },
        { key: 'job_sites', name: 'Job Sites', href: '/dashboard/job-sites', icon: Building2 },
        { key: 'contracts', name: 'Contracts', href: '/dashboard/contracts', icon: FileText },
        { key: 'quotes', name: 'Quotes', href: '/dashboard/quotes', icon: FileCheck },
        { key: 'checklists', name: 'Checklists', href: '/dashboard/checklists', icon: ClipboardCheck },
        { key: 'workers', name: 'Internal Workers', href: '/dashboard/workers', icon: HardHat },
        { key: 'contractors', name: 'External Contractors', href: '/dashboard/contractors', icon: Briefcase },
        { key: 'jobs', name: 'Jobs', href: '/dashboard/jobs', icon: PlayCircle },
        { key: 'schedule', name: 'Scheduling', href: '/dashboard/schedule', icon: CalendarDays },
        { key: 'financials', name: 'Financials', href: '/dashboard/financials', icon: CreditCard },
        { key: 'legals', name: 'Legals', href: '/dashboard/legals', icon: Scale },
        { key: 'settings', name: 'Settings', href: '/dashboard/settings', icon: Settings },
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



    // ... (imports)

    // ... (inside DashboardLayout)

    return (
        <ThemeProvider branding={branding}>
            <div className="min-h-screen bg-gray-50">
                {/* Sidebar */}
                <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0">
                    <div className="flex h-16 items-center px-6 border-b">
                        {branding.logo_url ? (
                            <img src={branding.logo_url} alt={branding.company_name} className="h-8 w-auto" />
                        ) : (
                            <div className="h-8 w-8 rounded flex items-center justify-center text-white font-bold" style={{ backgroundColor: branding.primary_color }}>
                                {branding.company_name.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                        <span className="ml-3 text-xl font-bold" style={{ color: branding.primary_color }}>
                            {branding.company_name}
                        </span>
                    </div>

                    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-blue-50 transition-colors"
                            >
                                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[var(--primary-color)]" aria-hidden="true" />
                                <span className="group-hover:text-[var(--primary-color)]">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="border-t p-4">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">Admin</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:pl-64 flex flex-col min-h-screen">
                    {/* Top Header */}
                    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <form className="relative flex flex-1" action="#" method="GET">
                                <label htmlFor="search-field" className="sr-only">
                                    Search...
                                </label>
                                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                        <Search className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="search-field"
                                        className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                        placeholder="Search..."
                                        type="search"
                                        name="search"
                                    />
                                </div>
                            </form>
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">View notifications</span>
                                    <Bell className="h-6 w-6" aria-hidden="true" />
                                </button>
                                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                                {/* Profile dropdown */}
                                <div className="relative">
                                    <form action={signOut}>
                                        <button type="submit" className="text-sm font-semibold leading-6 text-gray-900 hover:text-[var(--primary-color)]">
                                            Sign out
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 py-8">
                        <div className="px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
