import { api, HydrateClient } from '@/trpc/server'
import { ContractDetail } from './contract-detail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await api.contracts.getById.prefetch({ id })

    return (
        <HydrateClient>
            <ContractDetail id={id} />
        </HydrateClient>
    )
}
