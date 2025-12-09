import { ArrowLeft, Calendar, Clock, MapPin, Filter } from "lucide-react";
import Link from 'next/link';

export default function WorkerJobsPage() {
    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Page Header (Custom for this view) */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
                <Link href="/worker" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">My Jobs</h1>
                    <p className="text-xs text-gray-500">4 jobs</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white px-4 border-b border-gray-200 flex items-center">
                <button className="flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Upcoming</button>
                <button className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-900">Completed</button>
                <button className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-900">All</button>
            </div>

            {/* List Content */}
            <div className="p-4 space-y-6">

                {/* Date Group 1 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Mon, Nov 10, 2025</span>
                        <span className="font-normal text-gray-400">(1 job)</span>
                    </div>

                    {/* Job Card */}
                    <Link href="/worker/jobs/1" className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>20:00 - 21:30</span>
                            </div>
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                                SCHEDULED
                            </span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-500 text-sm">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>123 Main Street, Suite 500, Manchester M1 1AA</span>
                        </div>
                    </Link>
                </div>

                {/* Date Group 2 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Thu, Nov 13, 2025</span>
                        <span className="font-normal text-gray-400">(1 job)</span>
                    </div>

                    {/* Job Card */}
                    <Link href="/worker/jobs/2" className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>08:00 - 11:00</span>
                            </div>
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                                SCHEDULED
                            </span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-500 text-sm">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>456 Oak Avenue, London SW1A 1AA</span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
