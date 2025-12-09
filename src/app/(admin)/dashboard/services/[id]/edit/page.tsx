import { api, HydrateClient } from '@/trpc/server'
import { EditServiceForm } from './edit-service-form'
import { redirect } from 'next/navigation'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const service = await api.services.getById({ id })

    if (!service) {
        redirect('/dashboard/services')
    }

    return (
        <HydrateClient>
            <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Edit Service
                        </h2>
                    </div>
                </div>

                <EditServiceForm service={service} />
            </div>
        </HydrateClient>
    )
}
