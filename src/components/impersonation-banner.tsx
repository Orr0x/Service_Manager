'use client'

import { useImpersonationStore } from '@/lib/store/impersonation'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ImpersonationBanner() {
    const { impersonatedUserId, impersonatedEntityId, impersonatedName, impersonatedRole, stopImpersonation, isDesignMode, toggleDesignMode } = useImpersonationStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || (!impersonatedUserId && !impersonatedEntityId)) return null

    const handleExit = () => {
        stopImpersonation()
        router.push('/dashboard/settings/users')
        router.refresh() // Refresh to clear any cached data from the impersonated user
    }

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full bg-red-600 px-4 py-3 text-white shadow-lg sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="rounded-full bg-red-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-100">
                        View As
                    </span>
                    <span>
                        You are viewing as <span className="font-bold underline">{impersonatedName || 'Unknown User'}</span> ({impersonatedRole})
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium opacity-80">Design Mode</span>
                        <button
                            onClick={toggleDesignMode}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600 ${isDesignMode ? 'bg-green-400' : 'bg-red-800'
                                }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDesignMode ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    <button
                        onClick={handleExit}
                        className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Exit View
                    </button>
                </div>
            </div>
        </div>
    )
}
