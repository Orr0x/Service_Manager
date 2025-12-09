import { ArrowLeft, Clock, MapPin, Home, Key, User, Wrench, FileText, ChevronDown, Navigation, AlertTriangle, Play } from "lucide-react";
import Link from 'next/link';

export default function JobDetailPage() {
    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Page Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/worker/jobs" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Monday, November 10, 2025</h1>
                    </div>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                    SCHEDULED
                </span>
            </div>

            <div className="p-4 space-y-3">

                {/* Schedule Accordion (Collapsed by default in POC but we'll leave logic for open/close to user interactive if using Summary/Details or just hardcode for demo) */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Schedule
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                        <p>20:00 - 21:30</p>
                        <p>Duration: 1h 30m</p>
                    </div>
                </details>

                {/* Property Info Accordion (Expanded) */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" open>
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Home className="h-5 w-5 text-gray-500" />
                            Property Information
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                        <div className="flex items-start gap-2 text-gray-900 text-sm">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                            123 Main Street, Suite 500, Manchester M1 1AA
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors">
                            <Navigation className="h-4 w-4" />
                            Navigate Here
                        </button>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Type</span>
                                <span className="text-xs font-bold text-gray-900">COMMERCIAL</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Beds</span>
                                <span className="text-xs font-bold text-gray-900">0</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Baths</span>
                                <span className="text-xs font-bold text-gray-900">0</span>
                            </div>
                        </div>
                    </div>
                </details>

                {/* Access Info */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Key className="h-5 w-5 text-gray-500" />
                            Access Information
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                </details>

                {/* Customer Info */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <User className="h-5 w-5 text-gray-500" />
                            Customer Information
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                </details>

                {/* Maintenance Issues */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Wrench className="h-5 w-5 text-gray-500" />
                            Property Maintenance Issues
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">4</span>
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                </details>

                {/* Job Notes */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <FileText className="h-5 w-5 text-gray-500" />
                            Job Notes & Photos
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                </details>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
                    <Wrench className="h-5 w-5" />
                    Report Maintenance Issue
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
                    <Play className="h-5 w-5 fill-current" />
                    Start Job
                </button>
            </div>
        </div>
    );
}
