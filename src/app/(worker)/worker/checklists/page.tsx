'use client';

import { api } from '@/trpc/react';
import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, CheckCircle, Circle, Briefcase, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import classNames from 'classnames';

export default function ChecklistsPage() {
    const { data: checklists, isLoading } = api.worker.getChecklists.useQuery();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    return (
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">My Checklists</h1>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            ) : checklists && checklists.length > 0 ? (
                <div className="space-y-4">
                    {checklists.map((item, index) => {
                        const isNext = index === 0 && item.status !== 'completed';
                        const isExpanded = expandedIds.has(item.id);

                        return (
                            <div
                                key={item.id}
                                className={classNames(
                                    "block rounded-xl shadow-sm border transition-all relative overflow-hidden",
                                    isNext ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" : "bg-white border-gray-100"
                                )}
                            >
                                <div
                                    onClick={() => toggleExpand(item.id)}
                                    className="p-4 cursor-pointer hover:bg-black/5 transition-colors"
                                >
                                    {isNext && (
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                            Next Up
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={classNames(
                                            "p-2 rounded-lg shrink-0",
                                            item.status === 'completed' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                                        )}>
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-sm">{item.checklistName}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-2">{item.checklistDescription}</p>
                                        </div>
                                        <div className="text-gray-400">
                                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs border-t border-gray-200/50 pt-3">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="font-medium">{item.jobTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{item.jobStartTime ? new Date(item.jobStartTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                                        </div>
                                        <div className="ml-auto">
                                            {item.status === 'completed' ? (
                                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Completed
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <Circle className="h-3.5 w-3.5" />
                                                    Pending
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-3">
                                            {item.items && Array.isArray(item.items) && item.items.length > 0 ? (
                                                item.items.map((checklistItem: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                        <div className={classNames(
                                                            "mt-0.5",
                                                            checklistItem.completed ? "text-green-500" : "text-gray-300"
                                                        )}>
                                                            {checklistItem.completed ? (
                                                                <CheckCircle className="h-5 w-5" />
                                                            ) : (
                                                                <Circle className="h-5 w-5" />
                                                            )}
                                                        </div>
                                                        <span className={classNames(
                                                            "text-sm",
                                                            checklistItem.completed ? "text-gray-500 line-through" : "text-gray-700"
                                                        )}>
                                                            {checklistItem.text || checklistItem.label}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 italic text-center py-2">No items in this checklist.</p>
                                            )}

                                            <div className="mt-4 pt-2 flex justify-end">
                                                <Link
                                                    href={`/worker/jobs/${item.jobId}`}
                                                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Go to Job
                                                    <span aria-hidden="true">&rarr;</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No checklists found</p>
                    <p className="text-xs text-gray-400 mt-1">Checklists appear when jobs are assigned.</p>
                </div>
            )}
        </div>
    );
}
