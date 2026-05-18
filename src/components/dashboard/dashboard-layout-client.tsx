'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserNav } from '@/components/dashboard/user-nav'
import { cn } from '@/lib/utils'
import {
    ChevronLeft,
    ChevronRight,
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
    PlayCircle,
    Wrench,
    Award,
    Scale,
    Menu,
    X,
    type LucideIcon
} from 'lucide-react'

// Map keys to icon components
const iconMap: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    customers: Users,
    job_sites: Building2,
    contracts: FileText,
    quotes: FileCheck,
    invoices: Receipt,
    checklists: ClipboardCheck,
    workers: HardHat,
    contractors: Briefcase,
    jobs: PlayCircle,
    schedule: CalendarDays,
    services: Wrench,
    certification: Award,
    payroll: Scale,
}

const mobileNavLabels: Record<string, string> = {
    dashboard: 'Home',
    job_sites: 'Sites',
    jobs: 'Jobs',
    schedule: 'Schedule',
    workers: 'Workers',
}

interface DashboardLayoutClientProps {
    children: React.ReactNode
    branding: {
        company_name: string
        logo_url?: string | null
        primary_color?: string
        theme?: {
            sidebarBg?: string
            sidebarText?: string
            headerBg?: string
        }
    }
    navigation: { key: string; name: string; href: string }[]
    user: {
        email?: string | null
    }
}

export function DashboardLayoutClient({
    children,
    branding,
    navigation,
    user
}: DashboardLayoutClientProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const pathname = usePathname()

    const isNavigationItemActive = (item: { href: string }) => pathname === item.href
        || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'))
        || (item.href !== '/dashboard' && pathname === item.href)

    const mobilePrimaryNavigation = navigation.filter((item) => (
        ['dashboard', 'jobs', 'schedule', 'job_sites', 'workers'].includes(item.key)
    ))

    const renderNavigationLink = (
        item: { key: string; name: string; href: string },
        options: { collapsed?: boolean; mobile?: boolean; onClick?: () => void } = {}
    ) => {
        const Icon = iconMap[item.key]
        const isActive = isNavigationItemActive(item)

        return (
            <Link
                key={item.name}
                href={item.href}
                className={cn(
                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                        ? "bg-black/5 text-[var(--primary-color)]"
                        : "hover:bg-black/5",
                    options.collapsed ? "justify-center" : "",
                    options.mobile ? "whitespace-normal" : "whitespace-nowrap"
                )}
                style={{
                    color: isActive ? undefined : (branding?.theme?.sidebarText || '#374151')
                }}
                title={options.collapsed ? item.name : undefined}
                onClick={options.onClick}
            >
                {Icon && (
                    <Icon
                        className={cn(
                            "h-5 w-5 shrink-0 transition-colors",
                            isActive
                                ? "opacity-100 text-[var(--primary-color)]"
                                : "opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary-color)]",
                            options.collapsed ? "" : "mr-3"
                        )}
                        aria-hidden="true"
                    />
                )}
                {!options.collapsed && (
                    <span className={cn(
                        "min-w-0 truncate transition-opacity duration-300",
                        isActive
                            ? "font-semibold text-[var(--primary-color)]"
                            : "opacity-100 group-hover:text-[var(--primary-color)]"
                    )}>
                        {item.name}
                    </span>
                )}
            </Link>
        )
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 hidden transform flex-col bg-white shadow-lg transition-all duration-300 ease-in-out md:flex",
                    collapsed ? "w-20" : "w-64"
                )}
                style={{ backgroundColor: branding?.theme?.sidebarBg || '#ffffff' }}
            >
                {/* Toggle Button (Border Overlay) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-24 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-100 focus:outline-none"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="h-3 w-3 text-gray-500" /> : <ChevronLeft className="h-3 w-3 text-gray-500" />}
                </button>

                {/* Logo Area */}
                <div
                    className={cn(
                        "flex items-center justify-center border-b border-black/5 transition-all duration-300",
                        collapsed ? "h-20 p-4" : "h-64 p-8"
                    )}
                >
                    {branding.logo_url ? (
                        <img
                            src={branding.logo_url}
                            alt={branding.company_name}
                            className={cn(
                                "object-contain transition-all duration-300",
                                collapsed ? "h-10 w-10" : "w-full h-full"
                            )}
                        />
                    ) : (
                        <div
                            className={cn(
                                "flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 rounded-lg",
                                collapsed ? "w-10 h-10 text-xl" : "w-full h-full text-7xl rounded-2xl"
                            )}
                            style={{ backgroundColor: branding.primary_color }}
                        >
                            {branding.company_name.substring(0, 1).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className={cn(
                    "flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden",
                    // Custom scrollbar styling if needed, but 'overflow-y-auto' should be sufficient
                    // and removing the footer gives more space.
                )}>
                    {navigation.map((item) => renderNavigationLink(item, { collapsed }))}
                </nav>
            </div>

            {mobileNavOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        className="absolute inset-0 bg-gray-900/40"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <div
                        className="relative flex h-full w-[min(20rem,calc(100vw-3rem))] flex-col bg-white shadow-xl"
                        style={{ backgroundColor: branding?.theme?.sidebarBg || '#ffffff' }}
                    >
                        <div className="flex h-16 items-center justify-between border-b border-black/5 px-4">
                            <div className="flex min-w-0 items-center gap-3">
                                {branding.logo_url ? (
                                    <img
                                        src={branding.logo_url}
                                        alt={branding.company_name}
                                        className="h-10 w-10 shrink-0 object-contain"
                                    />
                                ) : (
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg font-bold text-white shadow-sm"
                                        style={{ backgroundColor: branding.primary_color }}
                                    >
                                        {branding.company_name.substring(0, 1).toUpperCase()}
                                    </div>
                                )}
                                <span className="truncate text-base font-semibold text-gray-900">
                                    {branding.company_name}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-black/5 hover:text-gray-900"
                                aria-label="Close navigation"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                            {navigation.map((item) => renderNavigationLink(item, {
                                mobile: true,
                                onClick: () => setMobileNavOpen(false),
                            }))}
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content Wrapper */}
            <div
                className={cn(
                    "flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out",
                    collapsed ? "md:ml-20" : "md:ml-64"
                    // Note: on mobile/small screens we might want different behavior, 
                    // but usually standard is sidebar pushes content or overlays.
                    // The original used md:pl-64 on a wrapper. 
                    // Let's stick to margin-left based on state for desktop.
                )}
            >
                {/* Top Header */}
                <header
                    className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-3 border-b border-gray-200 px-4 shadow-sm sm:gap-x-6 sm:px-6 md:h-20 lg:px-8"
                    style={{ backgroundColor: branding?.theme?.headerBg || '#ffffff' }}
                >
                    <div className="flex min-w-0 items-center gap-x-3">
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(true)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <span className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl md:text-2xl">
                            {branding.company_name}
                        </span>
                    </div>

                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        <UserNav user={user} />
                    </div>
                </header>

                <main className="flex-1 pb-24 pt-5 sm:py-8 md:pb-8">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-gray-200 bg-white px-1 py-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
                {mobilePrimaryNavigation.map((item) => {
                    const Icon = iconMap[item.key]
                    const isActive = isNavigationItemActive(item)

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium leading-tight",
                                isActive ? "bg-black/5 text-[var(--primary-color)]" : "text-gray-500"
                            )}
                        >
                            {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
                            <span className="max-w-full truncate">{mobileNavLabels[item.key] || item.name}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
