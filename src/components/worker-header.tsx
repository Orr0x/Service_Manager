'use client';

import { useAppConfig } from "@/components/providers/app-config-provider";
import { ClipboardList, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import LogoutButton from "@/components/item-logout-button";

interface WorkerHeaderProps {
    userInitials: string;
    fullName: string;
}

export function WorkerHeader({ userInitials, fullName }: WorkerHeaderProps) {
    const { config } = useAppConfig();
    const router = useRouter();
    const pathname = usePathname();

    // Ensure branding object exists to avoid crashes
    const branding = config?.branding || {};

    // Default values if not set
    const companyName = branding.company_name || 'RightFit Worker';
    const logoUrl = branding.logo_url;
    const primaryColor = branding.primary_color || '#4f46e5'; // Indigo-600 default

    const isDashboard = pathname === '/worker';

    return (
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
                {/* Back Button - Only show if not on dashboard */}
                {!isDashboard && (
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                )}

                {/* Logo */}
                {logoUrl ? (
                    <div className="h-10 w-10 relative bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                        <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                    </div>
                ) : (
                    <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {branding.company_name ? branding.company_name.charAt(0).toUpperCase() : <ClipboardList className="h-6 w-6" />}
                    </div>
                )}

                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{companyName}</h1>
                    <span className="text-xs text-gray-500">{fullName}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Home Button */}
                {!isDashboard && (
                    <Link href="/worker" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                        <Home className="h-5 w-5" />
                    </Link>
                )}

                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                    {userInitials}
                </div>
                <div className="flex items-center gap-1">
                    <LogoutButton />
                </div>
            </div>
        </header>
    );
}
