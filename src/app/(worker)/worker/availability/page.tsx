import { ArrowLeft, Edit2, Trash2, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Link from 'next/link';

export default function AvailabilityPage() {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    // Mocking November 2025 grid (starting roughly correctly based on screenshot)
    // Nov 1 2025 is Saturday.
    const calendarGrid = [
        [null, null, null, null, null, 1, 2],
        [3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16],
        [17, 18, 19, 20, 21, 22, 23],
        [24, 25, 26, 27, 28, 29, 30]
    ];

    return (
        <div className="bg-gray-50 min-h-screen p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/worker" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manage Availability</h1>
                    <p className="text-sm text-gray-500">Block dates when you're unavailable</p>
                </div>
                <button className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Block Dates</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-base font-bold text-gray-900">November 2025</span>
                        <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {days.map(day => (
                            <div key={day} className="text-[10px] font-bold text-gray-400 tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-4 text-center">
                        {calendarGrid.flat().map((day, idx) => {
                            const isBlocked = day === 8 || day === 9;
                            if (!day) return <div key={idx}></div>;

                            return (
                                <div key={idx} className="flex flex-col items-center justify-center h-10 w-full relative">
                                    {isBlocked && (
                                        <div className={`absolute inset-0 mx-1 rounded-md ${day === 8 ? 'bg-red-100 ml-auto w-full rounded-r-none' : ''} ${day === 9 ? 'bg-red-100 mr-auto w-full rounded-l-none' : ''}`}></div>
                                    )}
                                    <span className={`relative z-10 text-sm font-medium ${isBlocked ? 'text-red-600' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-8 pt-4 border-t border-gray-100 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                            <span className="text-gray-600">Blocked / Unavailable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-gray-300 rounded-sm"></div>
                            <span className="text-gray-600">Available</span>
                        </div>
                    </div>
                </div>

                {/* Blocked Dates List */}
                <div className="lg:w-80 space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm">Blocked Dates (1)</h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                        <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            Nov 8, 2025 - Nov 9, 2025
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-blue-600 p-1">
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600 p-1">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
