import { Inter } from "next/font/google";
import Link from "next/link";
import { Home, ClipboardList, User } from "lucide-react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: "Worker App | Service Manager",
    description: "Mobile app for field workers",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

import LogoutButton from "@/components/item-logout-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ... existing imports

export default async function WorkerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    const { data: worker } = await supabase
        .from('workers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

    const fullName = worker ? `${worker.first_name} ${worker.last_name}` : 'Worker';
    const initals = worker ? `${worker.first_name[0]}${worker.last_name[0]}` : 'W';

    return (
        <div className={`font-sans ${inter.variable} min-h-screen bg-gray-50 flex flex-col`}>
            {/* POC Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">RightFit Worker</h1>
                        <span className="text-xs text-gray-500">{fullName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                        {initals}
                    </div>
                    <div className="flex items-center gap-1">
                        <LogoutButton />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1">
                {children}
            </main>

            {/* Bottom Nav removed to match POC Dashboard style (Grid Links) */}
        </div>
    );
}
