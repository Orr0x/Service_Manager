
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DateFilter = 'today' | 'week' | 'month' | 'next-week' | 'next-month';

interface WorkerAppState {
    dateFilter: DateFilter;
    setDateFilter: (filter: DateFilter) => void;
}

export const useWorkerAppStore = create<WorkerAppState>()(
    persist(
        (set) => ({
            dateFilter: 'today',
            setDateFilter: (filter) => set({ dateFilter: filter }),
        }),
        {
            name: 'worker-app-storage',
        }
    )
);
