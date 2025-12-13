'use client'

import React, { createContext, useContext } from 'react'
import { api } from '@/trpc/react'
import { useImpersonationStore } from '@/lib/store/impersonation'

interface AppConfigContextType {
    config: Record<string, any>
    isVisible: (key: string, defaultVal?: boolean) => boolean
    toggleConfig: (key: string) => Promise<void>
    isLoading: boolean
    isDesignMode: boolean
    toggleDesignMode: () => void
}

const AppConfigContext = createContext<AppConfigContextType | null>(null)

export function AppConfigProvider({
    children,
    entityType,
    entityId
}: {
    children: React.ReactNode,
    entityType: 'worker' | 'contractor' | 'customer',
    entityId?: string | null
}) {
    // Determine effective ID based on impersonation
    const { impersonatedEntityId, impersonatedRole, isDesignMode, toggleDesignMode } = useImpersonationStore()

    // If active impersonation matches the current app context (e.g. Worker App), use impersonated ID.
    const isImpersonatingThisType = impersonatedRole === entityType
    // Prioritize impersonatedEntityId. If not impersonating or different type, use entityId passed from layout (logged in user).
    const effectiveEntityId = (isImpersonatingThisType && impersonatedEntityId) ? impersonatedEntityId : entityId

    const { data: configData, isLoading } = api.config.getAppConfig.useQuery(
        { entityType, entityId: effectiveEntityId || undefined },
        {
            // Only enabled if we have an ID (or if we want to support defaults when ID is missing? Yes)
            enabled: true
        }
    )

    const utils = api.useUtils()
    const updateMutation = api.config.updateAppConfig.useMutation({
        onSuccess: () => {
            utils.config.getAppConfig.invalidate()
        }
    })

    const isVisible = (key: string, defaultVal = true) => {
        if (configData && typeof configData[key] === 'boolean') {
            return configData[key]
        }
        return defaultVal
    }

    const toggleConfig = async (key: string) => {
        if (!isDesignMode) return

        const currentValue = isVisible(key)
        const newValue = !currentValue

        try {
            await updateMutation.mutateAsync({
                entityType,
                entityId: effectiveEntityId || null,
                config: {
                    ...(configData || {}),
                    [key]: newValue
                }
            })
        } catch (err) {
            console.error('Failed to toggle config:', err)
        }
    }

    return (
        <AppConfigContext.Provider value={{
            config: configData || {},
            isVisible,
            toggleConfig,
            isLoading,
            isDesignMode,
            toggleDesignMode
        }}>
            {children}
        </AppConfigContext.Provider>
    )
}

export const useAppConfig = () => {
    const context = useContext(AppConfigContext)
    if (!context) throw new Error('useAppConfig must be used within AppConfigProvider')
    return context
}
