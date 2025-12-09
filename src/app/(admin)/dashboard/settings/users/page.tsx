'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import { Users, UserPlus, Search, Lock, Unlock, Key, MoreHorizontal, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Menu } from '@headlessui/react'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function UsersPage() {
    const utils = api.useUtils()
    const { data: users, isLoading } = api.admin.listUsers.useQuery()
    const { data: unlinkedEntities } = api.admin.getUnlinkedEntities.useQuery()

    // Mutations
    const inviteUser = api.admin.inviteUser.useMutation({
        onSuccess: () => {
            utils.admin.listUsers.invalidate()
            utils.admin.getUnlinkedEntities.invalidate()
            setInviteModalOpen(false)
            alert('User invited successfully!')
        },
        onError: (err) => alert(`Error: ${err.message}`)
    })

    const toggleStatus = api.admin.toggleUserStatus.useMutation({
        onSuccess: () => utils.admin.listUsers.invalidate(),
        onError: (err) => alert(`Error: ${err.message}`)
    })

    const resetPassword = api.admin.resetPassword.useMutation({
        onSuccess: () => alert('Password reset link sent (simulated).'),
        onError: (err) => alert(`Error: ${err.message}`)
    })

    // State
    const [searchTerm, setSearchTerm] = useState('')
    const [inviteModalOpen, setInviteModalOpen] = useState(false)

    // Invite Form State
    const [selectedEntityId, setSelectedEntityId] = useState('')
    const [selectedEntityType, setSelectedEntityType] = useState<'worker' | 'contractor' | 'customer'>('worker')
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('provider')

    // Filtered Users
    const filteredUsers = users?.filter(item =>
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Handlers
    const handleEntitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [type, id] = e.target.value.split(':')
        setSelectedEntityType(type as 'worker' | 'contractor' | 'customer')
        setSelectedEntityId(id)

        // Pre-fill email/role
        if (type === 'worker') {
            const worker = unlinkedEntities?.workers.find(w => w.id === id)
            if (worker) {
                setInviteEmail(worker.email || '')
                setInviteRole(worker.role === 'Manager' || worker.role === 'Admin' ? 'admin' : 'provider') // Map roles roughly
            }
        } else if (type === 'contractor') {
            const contractor = unlinkedEntities?.contractors.find(c => c.id === id)
            if (contractor) {
                setInviteEmail(contractor.email || '')
                setInviteRole('provider')
            }
        } else if (type === 'customer') {
            const customer = unlinkedEntities?.customers?.find(c => c.id === id)
            if (customer) {
                setInviteEmail(customer.email || '')
                setInviteRole('customer')
            }
        }
    }

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEntityId) return

        inviteUser.mutate({
            email: inviteEmail,
            role: inviteRole,
            workerId: selectedEntityType === 'worker' ? selectedEntityId : undefined,
            contractorId: selectedEntityType === 'contractor' ? selectedEntityId : undefined,
            customerId: selectedEntityType === 'customer' ? selectedEntityId : undefined
        })
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link href="/dashboard/settings" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                </Link>
            </div>

            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage system access for your workers, contractors, and customers.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setInviteModalOpen(true)}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <UserPlus className="h-4 w-4 inline-block mr-2" />
                        Grant Access
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mt-6 flex max-w-md gap-x-4">
                <div className="relative flex-grow focus-within:z-10">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Linked Entity</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {isLoading ? (
                                        <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
                                    ) : filteredUsers?.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-4">No users found</td></tr>
                                    ) : (
                                        filteredUsers?.map((item) => (
                                            <tr key={`${item.type}-${item.id}`}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {item.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset 
                                                        ${item.type === 'user' ? 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' :
                                                            item.type === 'worker' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                item.type === 'contractor' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                                                    'bg-purple-50 text-purple-700 ring-purple-700/10'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.email || '—'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{item.role || '—'}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {item.linkedEntity ? (
                                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                            {item.linkedEntity.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Unlinked</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {item.type === 'user' ? (
                                                        <Menu as="div" className="relative inline-block text-left">
                                                            <Menu.Button className="-m-2 flex items-center rounded-full p-2 text-gray-400 hover:text-gray-600">
                                                                <span className="sr-only">Open options</span>
                                                                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                                                            </Menu.Button>
                                                            <Transition
                                                                as={Fragment}
                                                                enter="transition ease-out duration-100"
                                                                enterFrom="transform opacity-0 scale-95"
                                                                enterTo="transform opacity-100 scale-100"
                                                                leave="transition ease-in duration-75"
                                                                leaveFrom="transform opacity-100 scale-100"
                                                                leaveTo="transform opacity-0 scale-95"
                                                            >
                                                                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                    <div className="py-1">
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => toggleStatus.mutate({ userId: item.id, isActive: item.status !== 'Active' })}
                                                                                    className={classNames(
                                                                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                                                        'block w-full px-4 py-2 text-left text-sm'
                                                                                    )}
                                                                                >
                                                                                    {item.status === 'Active' ? (
                                                                                        <><Lock className="inline-block h-4 w-4 mr-2" /> Block Access</>
                                                                                    ) : (
                                                                                        <><Unlock className="inline-block h-4 w-4 mr-2" /> Unblock Access</>
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (confirm(`Send password reset link to ${item.email}?`)) {
                                                                                            resetPassword.mutate({ email: item.email! })
                                                                                        }
                                                                                    }}
                                                                                    className={classNames(
                                                                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                                                        'block w-full px-4 py-2 text-left text-sm'
                                                                                    )}
                                                                                >
                                                                                    <Key className="inline-block h-4 w-4 mr-2" /> Reset Password
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                    </div>
                                                                </Menu.Items>
                                                            </Transition>
                                                        </Menu>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="text-indigo-600 hover:text-indigo-900 items-center hidden" // Hidden for now, or 'Invite' if we want to wire it up
                                                            onClick={() => {
                                                                // Future: Pre-fill invite modal
                                                                setInviteModalOpen(true);
                                                                if (item.type === 'worker') { setSelectedEntityType('worker'); setSelectedEntityId(item.id); }
                                                                if (item.type === 'contractor') { setSelectedEntityType('contractor'); setSelectedEntityId(item.id); }
                                                                if (item.type === 'customer') { setSelectedEntityType('customer'); setSelectedEntityId(item.id); }
                                                            }}
                                                        >
                                                            Invite
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            <Transition.Root show={inviteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setInviteModalOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div>
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                                            <UserPlus className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-5">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                Grant Access
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Grant access to an existing Worker, Contractor, or Customer. This will create a user account for them.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <form onSubmit={handleInviteSubmit} className="mt-5 sm:mt-6">
                                        <div className="grid grid-cols-1 gap-y-4">
                                            <div>
                                                <label htmlFor="user-select" className="block text-sm font-medium leading-6 text-gray-900">
                                                    Select Member
                                                </label>
                                                <select
                                                    id="user-select"
                                                    className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                    onChange={handleEntitySelect}
                                                    required
                                                >
                                                    <option value="">Select a member...</option>
                                                    <optgroup label="Workers">
                                                        {unlinkedEntities?.workers.map(w => (
                                                            <option key={w.id} value={`worker:${w.id}`}>
                                                                {w.first_name} {w.last_name} ({w.role})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Contractors">
                                                        {unlinkedEntities?.contractors.map(c => (
                                                            <option key={c.id} value={`contractor:${c.id}`}>
                                                                {c.company_name} ({c.contact_name})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Customers">
                                                        {unlinkedEntities?.customers?.map(c => (
                                                            <option key={c.id} value={`customer:${c.id}`}>
                                                                {c.business_name} ({c.contact_name})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    required
                                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 border p-2"
                                                    value={inviteEmail}
                                                    onChange={e => setInviteEmail(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">
                                                    Role
                                                </label>
                                                <select
                                                    id="role"
                                                    className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                    value={inviteRole}
                                                    onChange={e => setInviteRole(e.target.value)}
                                                >
                                                    <option value="provider">Site Worker App (Provider)</option>
                                                    <option value="admin">Admin App (Admin)</option>
                                                    <option value="customer">Customer App (Customer)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                            <button
                                                type="submit"
                                                disabled={inviteUser.isPending}
                                                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                                            >
                                                {inviteUser.isPending ? 'Sending...' : 'Invite User'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                                onClick={() => setInviteModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    )
}
