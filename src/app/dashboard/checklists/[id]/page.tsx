import { api, HydrateClient } from '@/trpc/server'
import { ChecklistDetail } from './checklist-detail'

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    void api.checklists.getById.prefetch({ id })

    return (
        <HydrateClient>
            <ChecklistDetail id={id} />
        </HydrateClient>
    )
}
