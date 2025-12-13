import { Inter } from "next/font/google";
import Link from "next/link";
import { User, FileText, Home } from "lucide-react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: "My Portal | Service Manager",
    description: "Customer portal for tracking jobs and invoices",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

import LogoutButton from "@/components/item-logout-button";
import { ImpersonationBanner } from "@/components/impersonation-banner";

import { AppConfigProvider } from "@/components/providers/app-config-provider";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ... existing imports

export default async function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    return (
        <AppConfigProvider entityType="customer" entityId={customer?.id}>
            <div className={`font-sans ${inter.variable} min-h-screen bg-slate-50 flex flex-col`}>
                {/* Customer Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                            C
                        </div>
                        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Customer Portal</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex text-sm text-slate-500">
                            Need help? <a href="#" className="ml-1 text-emerald-600 hover:underline">Contact Support</a>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <User className="h-4 w-4" />
                            </div>
                            <LogoutButton />
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                    <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
                        <p>&copy; 2024 Service Manager. All rights reserved.</p>
                        <div className="flex gap-4 mt-2 md:mt-0">
                            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-600">Terms of Service</a>
                        </div>
                    </div>
                </footer>
                <ImpersonationBanner />
            </div>
        </AppConfigProvider>
    );
}
