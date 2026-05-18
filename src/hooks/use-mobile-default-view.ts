'use client'

import { useState, useSyncExternalStore } from 'react'

type EntityView = 'list' | 'grid'

export function useMobileDefaultView(defaultView: EntityView = 'list') {
    const isMobile = useSyncExternalStore(subscribeToMobileViewport, getMobileViewportSnapshot, getServerSnapshot)
    const [manualView, setManualView] = useState<EntityView | null>(null)
    const view = manualView ?? (isMobile ? 'grid' : defaultView)

    return [view, setManualView] as const
}

function subscribeToMobileViewport(callback: () => void) {
    const mediaQuery = window.matchMedia('(max-width: 639px)')

    mediaQuery.addEventListener('change', callback)

    return () => mediaQuery.removeEventListener('change', callback)
}

function getMobileViewportSnapshot() {
    return window.matchMedia('(max-width: 639px)').matches
}

function getServerSnapshot() {
    return false
}
