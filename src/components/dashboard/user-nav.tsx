'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { User, LogOut, Settings } from 'lucide-react'
import { signOut } from '@/actions/auth'
import Link from 'next/link'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export function UserNav({ user }: { user: any }) {
    const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U'

    return (
        <Menu as="div" className="relative">
            <div>
                <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors w-full">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {userInitials}
                        </div>
                        <div className="ml-3 text-left hidden sm:block">
                            <p className="text-sm font-medium text-gray-700">Admin</p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                        </div>
                    </div>
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute bottom-full left-0 mb-2 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                        {({ active }) => (
                            <Link
                                href="/dashboard/settings"
                                className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700 flex items-center'
                                )}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={() => signOut()}
                                className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center'
                                )}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </button>
                        )}
                    </Menu.Item>
                </Menu.Items>
            </Transition>
        </Menu>
    )
}
