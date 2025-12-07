'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'

interface QuoteItem {
    description: string
    quantity: number
    unitPrice: number
    amount: number
}

export default function NewQuotePage() {
    const router = useRouter()
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }])
    const [totalAmount, setTotalAmount] = useState<number>(0)

    const { data: customers, isLoading: isLoadingCustomers } = api.customers.getAll.useQuery()

    // Fetch job sites only when a customer is selected
    const { data: jobSites, isLoading: isLoadingJobSites } = api.jobSites.getByCustomerId.useQuery(
        { customerId: selectedCustomerId },
        { enabled: !!selectedCustomerId }
    )

    const createQuote = api.quotes.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/quotes')
            router.refresh()
        },
    })

    const { data: settings } = api.settings.getSettings.useQuery()
    const terminology = (settings?.terminology as Record<string, string>) || {}
    const getLabel = (key: string, defaultLabel: string) => terminology[key] || defaultLabel

    // Update item amount when quantity or unit price changes
    const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
        const newItems = [...items]
        const item = newItems[index]

        if (field === 'description') {
            item.description = value as string
        } else {
            const numValue = parseFloat(value as string) || 0
            if (field === 'quantity') item.quantity = numValue
            if (field === 'unitPrice') item.unitPrice = numValue
            item.amount = item.quantity * item.unitPrice
        }

        setItems(newItems)
    }

    // Add new item row
    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])
    }

    // Remove item row
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index)
            setItems(newItems)
        }
    }

    // Calculate total amount whenever items change
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.amount, 0)
        setTotalAmount(total)
    }, [items])

    async function onSubmit(formData: FormData) {
        const customerId = formData.get('customerId') as string
        const jobSiteId = formData.get('jobSiteId') as string
        const title = formData.get('title') as string
        const status = formData.get('status') as string
        const issuedDate = formData.get('issuedDate') as string
        const expiryDate = formData.get('expiryDate') as string
        const description = formData.get('description') as string

        createQuote.mutate({
            customerId,
            jobSiteId: jobSiteId || undefined,
            title,
            status,
            issuedDate: issuedDate || undefined,
            expiryDate: expiryDate || undefined,
            totalAmount,
            description: description || undefined,
            items,
        })
    }

    if (isLoadingCustomers) {
        return <div className="p-8 text-center text-gray-500">Loading customers...</div>
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="p-12 text-center">
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">You need to create a customer before adding a quote.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/customers/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Create Customer
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        New Quote
                    </h2>
                </div>
            </div>

            <form action={onSubmit} className="mt-8 space-y-8">
                {createQuote.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating quote: {createQuote.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quote Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Quote Details</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">General information about the estimate.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="customerId" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.customerId', 'Customer')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="customerId"
                                    name="customerId"
                                    required
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.business_name || customer.contact_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="jobSiteId" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.jobSiteId', 'Job Site')}
                            </label>
                            <div className="mt-2">
                                <select
                                    id="jobSiteId"
                                    name="jobSiteId"
                                    disabled={!selectedCustomerId || isLoadingJobSites}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">Select a job site (optional)</option>
                                    {jobSites?.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.title', 'Quote Title')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g., Office Renovation Estimate"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.status', 'Status')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="status"
                                    name="status"
                                    required
                                    defaultValue="draft"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="issuedDate" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.issuedDate', 'Issued Date')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="issuedDate"
                                    id="issuedDate"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="expiryDate" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.expiryDate', 'Expiry Date')}
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="expiryDate"
                                    id="expiryDate"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('quotes.description', 'Description')}
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    defaultValue={''}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Line Items</h3>
                            <p className="mt-1 text-sm leading-6 text-gray-600">Add services or products to this quote.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add Item
                        </button>
                    </div>

                    <div className="rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Qty</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Unit Price</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Amount</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                placeholder="Item description"
                                                required
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">£</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                    className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            £{item.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">Total</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">£{totalAmount.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createQuote.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {createQuote.isPending ? 'Creating...' : 'Create Quote'}
                    </button>
                </div>
            </form>
        </div>
    )
}
