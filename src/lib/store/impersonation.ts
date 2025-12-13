import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ImpersonationState {
    impersonatedUserId: string | null
    impersonatedEntityId: string | null
    impersonatedRole: 'worker' | 'contractor' | 'customer' | null
    impersonatedName: string | null
    isDesignMode: boolean
    startImpersonation: (userId: string | null, role: 'worker' | 'contractor' | 'customer', name: string, entityId?: string) => void
    stopImpersonation: () => void
    toggleDesignMode: () => void
}

export const useImpersonationStore = create<ImpersonationState>()(
    persist(
        (set) => ({
            impersonatedUserId: null,
            impersonatedEntityId: null,
            impersonatedRole: null,
            impersonatedName: null,
            isDesignMode: false,
            startImpersonation: (userId, role, name, entityId) => set({
                impersonatedUserId: userId,
                impersonatedRole: role,
                impersonatedName: name,
                impersonatedEntityId: entityId || null,
                isDesignMode: false
            }),
            stopImpersonation: () => set({
                impersonatedUserId: null,
                impersonatedRole: null,
                impersonatedName: null,
                impersonatedEntityId: null,
                isDesignMode: false
            }),
            toggleDesignMode: () => set((state) => ({ isDesignMode: !state.isDesignMode })),
        }),
        {
            name: 'impersonation-storage',
            storage: createJSONStorage(() => sessionStorage), // Use session storage so it clears on browser close
        }
    )
)
