'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState } from 'react'

interface EditCustomerFormProps {
    customer: {
        id: string
        business_name: string | null
        contact_name: string
        email: string | null
        phone: string | null
        address: string | null
        city: string | null
        state: string | null
        postal_code: string | null
        country: string | null
        type: 'individual' | 'business'
        payment_terms: string | null
        engagement_type: 'contract' | 'pay_as_you_go' | null
        is_active: boolean | null
    }
}

export function EditCustomerForm({ customer }: EditCustomerFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [customerType, setCustomerType] = useState<'individual' | 'business'>(customer.type)

    const updateCustomer = api.customers.update.useMutation({
        onSuccess: () => {
            router.push(`/dashboard/customers/${customer.id}`)
            router.refresh()
        },
        onError: (e) => {
            setError(e.message)
        },
    })

    async function onSubmit(formData: FormData) {
        const businessName = formData.get('businessName') as string
        const contactName = formData.get('contactName') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const address = formData.get('address') as string
        const city = formData.get('city') as string
        const postalCode = formData.get('postalCode') as string
        const country = formData.get('country') as string
        const paymentTerms = formData.get('paymentTerms') as string
        const engagementType = formData.get('engagementType') as 'contract' | 'pay_as_you_go'
        const isActive = formData.get('isActive') === 'on'

        updateCustomer.mutate({
            id: customer.id,
            businessName: customerType === 'business' ? businessName : undefined,
            contactName,
            email,
            phone,
            address,
            city,
            postalCode,
            country,
            type: customerType,
            paymentTerms,
            engagementType,
            isActive
        })
    }

    return (
        <form action={onSubmit} className="space-y-8">
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error updating customer: {error}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Business Information */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Business Information</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">Basic details about the customer.</p>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="businessName" className="block text-sm font-medium leading-6 text-gray-900">
                            Business Name {customerType === 'individual' && <span className="text-gray-400 font-normal">(Optional)</span>}
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="businessName"
                                id="businessName"
                                defaultValue={customer.business_name || ''}
                                disabled={customerType === 'individual'}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm sm:leading-6"
                                placeholder="e.g., Acme Properties Ltd"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <label htmlFor="contactName" className="block text-sm font-medium leading-6 text-gray-900">
                            Contact Person Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="contactName"
                                id="contactName"
                                required
                                defaultValue={customer.contact_name}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="e.g., John Smith"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="customerType" className="block text-sm font-medium leading-6 text-gray-900">
                            Customer Type <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <select
                                id="customerType"
                                name="customerType"
                                value={customerType}
                                onChange={(e) => setCustomerType(e.target.value as 'individual' | 'business')}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="business">Business</option>
                                <option value="individual">Individual</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <div className="flex items-start">
                            <div className="flex h-6 items-center">
                                <input
                                    id="isActive"
                                    name="isActive"
                                    type="checkbox"
                                    defaultChecked={customer.is_active ?? true}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="isActive" className="font-medium text-gray-900">
                                    Active
                                </label>
                                <p className="text-gray-500">Inactive customers will not appear in some lists.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 border-t border-gray-900/10 pt-8">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            Email Address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={customer.email || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="e.g., john@acmeproperties.com"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                            Phone Number
                        </label>
                        <div className="mt-2">
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                defaultValue={customer.phone || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="e.g., 07123 456789"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                            Address Line 1
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="address"
                                id="address"
                                defaultValue={customer.address || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="e.g., 123 High Street"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2 sm:col-start-1">
                        <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                            City
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="city"
                                id="city"
                                defaultValue={customer.city || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="e.g., London"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="postalCode" className="block text-sm font-medium leading-6 text-gray-900">
                            Postcode
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="postalCode"
                                id="postalCode"
                                defaultValue={customer.postal_code || ''}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="e.g., SW1A 1AA"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="country" className="block text-sm font-medium leading-6 text-gray-900">
                            Country
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                name="country"
                                id="country"
                                defaultValue={customer.country || 'United Kingdom'}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Engagement Type */}
            <div className="space-y-6 border-t border-gray-900/10 pt-8">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Engagement Type</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">Select how you engage with this customer.</p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-x-3">
                        <input
                            id="contract"
                            name="engagementType"
                            type="radio"
                            value="contract"
                            defaultChecked={customer.engagement_type === 'contract'}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="contract" className="block text-sm font-medium leading-6 text-gray-900">
                            Contract
                        </label>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            id="pay-as-you-go"
                            name="engagementType"
                            type="radio"
                            value="pay_as_you_go"
                            defaultChecked={customer.engagement_type === 'pay_as_you_go'}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="pay-as-you-go" className="block text-sm font-medium leading-6 text-gray-900">
                            Pay as you Go
                        </label>
                    </div>
                </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-6 border-t border-gray-900/10 pt-8">
                <div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Payment Terms</h3>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="paymentTerms" className="block text-sm font-medium leading-6 text-gray-900">
                            Payment Terms
                        </label>
                        <div className="mt-2">
                            <select
                                id="paymentTerms"
                                name="paymentTerms"
                                defaultValue={customer.payment_terms || 'Net 14 Days'}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6"
                            >
                                <option value="Net 7 Days">Net 7 Days</option>
                                <option value="Net 14 Days">Net 14 Days</option>
                                <option value="Net 30 Days">Net 30 Days</option>
                                <option value="Net 60 Days">Net 60 Days</option>
                                <option value="Due on Receipt">Due on Receipt</option>
                            </select>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Defines when invoices are due for this customer</p>
                    </div>
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
                    disabled={updateCustomer.isPending}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                    {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}
