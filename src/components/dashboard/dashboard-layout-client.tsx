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
    Award
} from 'lucide-react'

// Map keys to icon components
const iconMap: Record<string, any> = {
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
    certification: Award
}

interface DashboardLayoutClientProps {
    children: React.ReactNode
    branding: any
    navigation: { key: string; name: string; href: string }[]
    user: any
}

export function DashboardLayoutClient({
    children,
    branding,
    navigation,
    user
}: DashboardLayoutClientProps) {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 shadow-lg transform transition-all duration-300 ease-in-out bg-white flex flex-col",
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
                    {navigation.map((item) => {
                        const Icon = iconMap[item.key]
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/')) || (item.href !== '/dashboard' && pathname === item.href)

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                                    isActive
                                        ? "bg-black/5 text-[var(--primary-color)]"
                                        : "hover:bg-black/5",
                                    collapsed ? "justify-center" : ""
                                )}
                                style={{
                                    color: isActive ? undefined : (branding?.theme?.sidebarText || '#374151')
                                }}
                                title={collapsed ? item.name : undefined}
                            >
                                {Icon && (
                                    <Icon
                                        className={cn(
                                            "h-5 w-5 transition-colors",
                                            isActive
                                                ? "opacity-100 text-[var(--primary-color)]"
                                                : "opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary-color)]",
                                            collapsed ? "" : "mr-3"
                                        )}
                                        aria-hidden="true"
                                    />
                                )}
                                {!collapsed && (
                                    <span className={cn(
                                        "transition-opacity duration-300",
                                        isActive
                                            ? "text-[var(--primary-color)] font-semibold"
                                            : "group-hover:text-[var(--primary-color)] opacity-100"
                                    )}>
                                        {item.name}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Main Content Wrapper */}
            <div
                className={cn(
                    "flex flex-col min-h-screen flex-1 transition-all duration-300 ease-in-out",
                    collapsed ? "ml-20" : "md:ml-64 ml-0"
                    // Note: on mobile/small screens we might want different behavior, 
                    // but usually standard is sidebar pushes content or overlays.
                    // The original used md:pl-64 on a wrapper. 
                    // Let's stick to margin-left based on state for desktop.
                )}
            >
                {/* Top Header */}
                <header
                    className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
                    style={{ backgroundColor: branding?.theme?.headerBg || '#ffffff' }}
                >
                    <div className="flex items-center gap-x-4">
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
        </div>
    )
}
