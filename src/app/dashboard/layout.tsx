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

    // Fetch tenant info
    const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', user.user_metadata.tenant_id)
        .single()

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Customers', href: '/dashboard/customers', icon: Users },
        { name: 'Job Sites', href: '/dashboard/job-sites', icon: Building2 },
        { name: 'Contracts', href: '/dashboard/contracts', icon: FileText },
        { name: 'Quotes', href: '/dashboard/quotes', icon: FileCheck },
        { name: 'Checklists', href: '/dashboard/checklists', icon: ClipboardCheck },
        { name: 'Internal Workers', href: '/dashboard/workers', icon: HardHat },
        { name: 'External Contractors', href: '/dashboard/contractors', icon: Briefcase },
        { name: 'Jobs', href: '/dashboard/jobs', icon: PlayCircle },
        { name: 'Scheduling', href: '/dashboard/schedule', icon: CalendarDays },
        { name: 'Financials', href: '/dashboard/financials', icon: CreditCard },
        { name: 'Legals', href: '/dashboard/legals', icon: Scale },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0">
                <div className="flex h-16 items-center px-6 border-b">
                    <div className="h-8 w-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold">
                        R
                    </div>
                    <span className="ml-3 text-xl font-bold text-blue-500">
                        RightFit
                    </span>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500" aria-hidden="true" />
                            {item.name}
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
                            <p className="text-xs text-gray-500">admin@rightfit.com</p>
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
                                Search jobs, properties, workers...
                            </label>
                            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <Search className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <input
                                    id="search-field"
                                    className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder="Search jobs, properties, workers..."
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
                                    <button type="submit" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600">
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
    )
}
