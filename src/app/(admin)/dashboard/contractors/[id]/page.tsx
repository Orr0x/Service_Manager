import { api, HydrateClient } from '@/trpc/server'
import { ContractorDetail } from './contractor-detail'

export default async function ContractorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await api.contractors.getById.prefetch({ id })

    return (
        <HydrateClient>
            <ContractorDetail id={id} />
        </HydrateClient>
    )
}
