"use client";
import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, IndianRupee, ArrowRightLeft, Scale } from 'lucide-react';

// --- Type Definitions ---
interface DailyReport {
    report_date: string;
    total_bets_received: string;
    total_winnings_paid: string;
    net_betting_profit: string;
    total_deposits_approved: string;
    total_withdrawals_settled: string;
}

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    colorClass: string;
}

// --- Utility Functions ---
const INR = (v: string | number): string => {
    const n = Number(v);
    if (isNaN(n)) return "₹ 0.00";
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
};

// --- Sub-components ---
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
                {icon}
            </div>
        </div>
    </div>
);

// --- Main Page Component ---
export default function DailyPnlReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [date, setDate] = useState('');

    const fetchReport = useCallback(async (reportDate: string) => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem("token");
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`https://backend.gdmatka.site/api/reports/daily-pnl?date=${reportDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 404) {
                setError(`इस तारीख (${reportDate}) के लिए रिपोर्ट अभी तक नहीं बनी है।`);
                setReport(null);
            } else if (!res.ok) {
                throw new Error('Failed to fetch report');
            } else {
                const data: DailyReport = await res.json();
                setReport(data);
            }
        } catch (err) {
            setError('रिपोर्ट लाने में विफल। कृपया पुनः प्रयास करें।');
            setReport(null);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        setDate(yesterdayString);
        fetchReport(yesterdayString);
    }, [fetchReport]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);
        fetchReport(newDate);
    };
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"><ArrowLeft size={20} /></button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Daily Profit & Loss Report</h1>
                    </div>
                    <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="text-center py-10 text-gray-600">रिपोर्ट लोड हो रही है...</div>
                ) : error ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                        <p className="font-bold">एरर</p>
                        <p>{error}</p>
                    </div>
                ) : report && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                             <h2 className="text-xl font-semibold mb-4 text-gray-700">Betting Summary</h2>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard title="Total Bets Received" value={INR(report.total_bets_received)} icon={<TrendingUp size={24}/>} colorClass="text-sky-600" />
                                <StatCard title="Total Winnings Paid" value={INR(report.total_winnings_paid)} icon={<TrendingDown size={24}/>} colorClass="text-amber-600" />
                                <StatCard title="Net Betting Profit" value={INR(report.net_betting_profit)} icon={<Scale size={24}/>} colorClass={Number(report.net_betting_profit) >= 0 ? "text-green-600" : "text-red-600"} />
                             </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                             <h2 className="text-xl font-semibold mb-4 text-gray-700">Financial Flow</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StatCard title="Deposits Approved" value={INR(report.total_deposits_approved)} icon={<IndianRupee size={24}/>} colorClass="text-emerald-600" />
                                <StatCard title="Withdrawals Settled" value={INR(report.total_withdrawals_settled)} icon={<ArrowRightLeft size={24}/>} colorClass="text-rose-600" />
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
