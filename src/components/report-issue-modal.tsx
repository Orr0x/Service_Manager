'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Wrench, AlertTriangle, FileText } from 'lucide-react';
import { api } from '@/trpc/react';
import classNames from 'classnames';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
}

export function ReportIssueModal({ isOpen, onClose, jobId }: ReportIssueModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'maintenance' | 'damage' | 'incident' | 'other'>('maintenance');

    const utils = api.useUtils();
    const createReport = api.reports.create.useMutation({
        onSuccess: () => {
            utils.reports.getAll.invalidate();
            // Also invalidate job details if reports are shown there
            utils.worker.getJobDetails.invalidate({ jobId });
            onClose();
            setTitle('');
            setDescription('');
            setType('maintenance');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createReport.mutate({
            title,
            description,
            type,
            jobId
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                                        <Wrench className="h-5 w-5 text-orange-600" />
                                        Report Issue
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                                                { id: 'damage', label: 'Damage', icon: AlertTriangle },
                                                { id: 'incident', label: 'Incident', icon: AlertTriangle },
                                                { id: 'other', label: 'Other', icon: FileText },
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setType(item.id as any)}
                                                    className={classNames(
                                                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                                                        type === item.id
                                                            ? "bg-orange-50 border-orange-500 text-orange-700"
                                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                    )}
                                                >
                                                    <item.icon className={classNames("h-4 w-4", type === item.id ? "text-orange-600" : "text-gray-400")} />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            id="title"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            placeholder="e.g. Broken sprinkler head"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            id="description"
                                            required
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            placeholder="Describe the issue in detail..."
                                        />
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={createReport.isPending}
                                            className="w-full inline-flex justify-center rounded-lg border border-transparent bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                        >
                                            {createReport.isPending ? 'Submitting...' : 'Submit Report'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
