import { api, HydrateClient } from '@/trpc/server'
import { ContractDetail } from './contract-detail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    void api.contracts.getById.prefetch({ id })

    return (
        <HydrateClient>
            <ContractDetail id={id} />
        </HydrateClient>
    )
}
