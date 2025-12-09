
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CustomerDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    const { data: customer } = await supabase
        .from('customers')
        .select('business_name, contact_name')
        .eq('user_id', user.id)
        .single();

    const displayName = customer ? (customer.business_name || customer.contact_name) : 'Customer';

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <section>
                <h2 className="text-3xl font-bold text-slate-800">Welcome home, {displayName}.</h2>
                <p className="text-slate-500 mt-2">Manage your scheduled services, view invoices, and request new jobs.</p>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Upcoming Service</div>
                    <div className="text-2xl font-bold text-slate-900">Dec 14</div>
                    <div className="text-emerald-600 text-sm mt-2 font-medium">HVAC Maintenance &rarr;</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Open Invoices</div>
                    <div className="text-2xl font-bold text-slate-900">$0.00</div>
                    <div className="text-slate-400 text-sm mt-2">You're all caught up!</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-200 transition-colors">
                        <span className="text-xl font-bold">+</span>
                    </div>
                    <div className="font-semibold text-slate-900">Request Service</div>
                    <div className="text-slate-500 text-sm">Book a new job online</div>
                </div>
            </div>

            {/* Recent Activity / Jobs List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Recent Services</h3>
                    <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                    {[1, 2].map((i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                                <div className="font-medium text-slate-900">Plumbing Repair</div>
                                <div className="text-sm text-slate-500">Completed on Nov 2{i}, 2024</div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                Completed
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
