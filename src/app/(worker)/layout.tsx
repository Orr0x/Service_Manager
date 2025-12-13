import { Inter } from "next/font/google";
import Link from "next/link";
import { WorkerHeader } from "@/components/worker-header";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppConfigProvider } from "@/components/providers/app-config-provider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: "Worker App | Service Manager",
    description: "Mobile app for field workers",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

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
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

    const fullName = worker ? `${worker.first_name} ${worker.last_name}` : 'Worker';
    const initals = worker ? `${worker.first_name[0]}${worker.last_name[0]}` : 'W';

    return (
        <AppConfigProvider entityType="worker" entityId={worker?.id}>
            <div className={`font-sans ${inter.variable} min-h-screen bg-gray-50 flex flex-col`}>
                <WorkerHeader fullName={fullName} userInitials={initals} />

                {/* Main Content Area */}
                <main className="flex-1">
                    {children}
                </main>

                <ImpersonationBanner />
            </div>
        </AppConfigProvider>
    );
}
