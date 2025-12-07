import { api, HydrateClient } from '@/trpc/server'
import { EditContractorForm } from './edit-contractor-form'

export default async function EditContractorPage({ params }: { params: { id: string } }) {
    const contractor = await api.contractors.getById({ id: params.id })

    return (
        <HydrateClient>
            <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Edit Contractor
                        </h2>
                    </div>
                </div>

                <EditContractorForm contractor={contractor} />
            </div>
        </HydrateClient>
    )
}
