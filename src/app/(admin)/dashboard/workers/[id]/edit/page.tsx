import { api } from '@/trpc/server'
import { EditWorkerForm } from './edit-worker-form'
import { notFound } from 'next/navigation'

export default async function EditWorkerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const worker = await api.workers.getById({ id })

    if (!worker) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Edit Internal Worker
                    </h2>
                </div>
            </div>

            <EditWorkerForm worker={worker} />
        </div>
    )
}
