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
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

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
            key: item.key,
            href: item.href,
            name: navSettings[item.key]?.label || terminology[item.key] || item.name
        }))

    return (
        <ThemeProvider branding={branding}>
            <DashboardLayoutClient
                branding={branding}
                navigation={navigation}
                user={user}
            >
                {children}
            </DashboardLayoutClient>
        </ThemeProvider>
    )
}
