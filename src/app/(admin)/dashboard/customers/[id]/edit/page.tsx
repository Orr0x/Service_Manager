import { api } from '@/trpc/server'
import { EditCustomerForm } from './edit-customer-form'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const customer = await api.customers.getById({ id })

    if (!customer) {
        notFound()
    }

    // Cast the customer type to match the interface if needed, or rely on type inference
    // The query returns all columns, which should match

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Edit Customer
                    </h2>
                </div>
            </div>

            <EditCustomerForm customer={customer} />
        </div>
    )
}
