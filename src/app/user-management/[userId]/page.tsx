"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
    Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
    Power, PowerOff, Trash2, Eye, EyeOff, MessageSquare, Gift, Loader2, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ----------------------------- Types ----------------------------- */
interface UserData {
    full_name: string; email: string; phone_number: string; password: string;
    creation_date: string; last_login: string; wallet_balance: number;
    total_deposit: number; total_withdraw: number; total_bid: number; total_winning: number;
    status?: "active" | "inactive" | string; bank_name?: string; account_holder_name?: string;
    account_number?: string; ifsc_code?: string; phonepe_number?: string; gpay_number?: string; paytm_number?: string;
}

interface FundHistoryItem {
    amount: string; remark: string; date: string; time: string; status: string; source?: string;
}

interface FundHistory {
    credits: FundHistoryItem[]; debits: FundHistoryItem[]; requests: FundHistoryItem[]; withdrawals: FundHistoryItem[];
}

interface BidHistoryItem {
    id: number; game_name: string; game_type: string; session: string;
    open_digit: string | null; close_digit: string | null; open_panna: string | null; close_panna: string | null;
    first_number: string; second_number: string | null;
    points: string; status: 'won' | 'pending' | 'lost' | string;
    date: string; time: string;
}

interface WinningHistoryItem {
    game_name: string; game_type: string; session: string; open_digit: string | null;
    close_digit: string | null; open_panna: string | null; close_panna: string | null;
    added_point: string; won_point: string; date: string; time: string;
}

/* ----------------------------- Edit Modal Component ----------------------------- */
function EditBetModal({ bet, token, onClose, onSave }: { bet: BidHistoryItem, token: string, onClose: () => void, onSave: (updatedBet: BidHistoryItem) => void }) {
    const [currentBet, setCurrentBet] = useState(bet);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`https://backend.gdmatka.site/api/bets/${bet.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    first_number: currentBet.first_number,
                    second_number: currentBet.second_number,
                    points: currentBet.points,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.details || "Failed to update bet.");
            }
            onSave(currentBet);
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isCompoundGame = bet.game_type?.toLowerCase().includes('jodi') || bet.game_type?.toLowerCase().includes('sangam');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">Edit Bet ID #{bet.id}</h2>
                <p className="text-sm text-gray-600 mb-4">You can only edit pending bets. This will adjust the user's wallet balance.</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">{isCompoundGame ? 'Open Number / Pana' : 'Bet Number'}</label>
                        <input type="text" value={currentBet.first_number} onChange={(e) => setCurrentBet({ ...currentBet, first_number: e.target.value })} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" />
                    </div>
                    {isCompoundGame && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Close Number / Digit</label>
                            <input type="text" value={currentBet.second_number || ''} onChange={(e) => setCurrentBet({ ...currentBet, second_number: e.target.value })} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Points</label>
                        <input type="number" value={currentBet.points} onChange={(e) => setCurrentBet({ ...currentBet, points: e.target.value })} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------- Utils ----------------------------- */
const INR = (v: number | string) => {
    const n = typeof v === "string" ? Number(v) : v;
    if (isNaN(n)) return "₹0.00";
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
};
const chip = (ok?: string) => ok === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200";
const formatDateIST = (rawDate: string | number) => {
    if (!rawDate) return { date: "-", time: "-" };
    try {
        let dateInput = String(rawDate).trim();
        if (!dateInput.includes(' ') && dateInput.endsWith('Z')) {} 
        else if (dateInput.includes(' ') && !dateInput.endsWith('Z')) { dateInput = dateInput.replace(' ', 'T') + 'Z'; } 
        else if (!dateInput.includes('T')) { dateInput = dateInput + 'T00:00:00Z'; }
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            const parts = String(rawDate).split(/[\s,T]/);
            return { date: parts[0] || "-", time: parts[1] || "-" };
        }
        const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const datePart = new Intl.DateTimeFormat('en-CA', dateOptions).format(date);
        const timePart = new Intl.DateTimeFormat('en-GB', timeOptions).format(date);
        return { date: datePart, time: timePart };
    } catch (e) { return { date: "-", time: "-" }; }
};
const formatPhoneNumberForWhatsApp = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 ? `91${cleaned}` : cleaned;
};

/* ---------------------------- Main Component ---------------------------- */
export default function UserDetailsPage({ params }: { params: { userId: string } }) {
    const router = useRouter();
    const { userId } = params;

    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [userData, setUserData] = useState<UserData | null>(null);
    const [fundHistory, setFundHistory] = useState<FundHistory>({ credits: [], debits: [], requests: [], withdrawals: [] });
    const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
    const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
    const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");
    const [amount, setAmount] = useState<string>("");

    const [editingBet, setEditingBet] = useState<BidHistoryItem | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    // पेजिनेशन के लिए नया स्टेट
    const [currentPage, setCurrentPage] = useState(1);
    const BIDS_PER_PAGE = 250;
    

    const fetchAllData = useCallback(async () => {
        if (!token || !userId) return;
        setLoading(true);
        try {
            const responses = await Promise.all([
                fetch(`https://backend.gdmatka.site/api/user/${userId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
                fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
            ]);

            const safeJsonParse = async (res: Response, defaultReturn: any = []) => {
                if (res.status === 204) return defaultReturn;
                if (!res.ok) throw new Error(`API call failed with status ${res.status}`);
                return res.json();
            };
            
            const [userData, fundHistory, bidHistory, winningHistory] = await Promise.all([
                safeJsonParse(responses[0], null),
                safeJsonParse(responses[1], { credits: [], debits: [], withdrawals: [] }),
                safeJsonParse(responses[2], []),
                safeJsonParse(responses[3], [])
            ]);

            if (!userData) throw new Error('Failed to fetch user data');
            
            setUserData(userData);
            setFundHistory(fundHistory);
            setBidHistory(bidHistory);
            setWinningHistory(winningHistory);
        } catch (error) {
            console.error("Failed to fetch all data:", error);
            alert("Could not load user data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [token, userId]);
    
    useEffect(() => {
        const t = localStorage.getItem("token");
        if (!t || t === "undefined" || t === "null") { router.push("/login"); return; }
        setToken(t);
    }, [router]);
    
    useEffect(() => {
        if(token) fetchAllData();
    }, [token, fetchAllData]);

    const fundAction = async (amountValue: number, endpoint: string, body: object, successMessage: string, errorMessage: string) => {
        if (isNaN(amountValue) || amountValue <= 0) { alert("कृपया एक वैध राशि दर्ज करें।"); return; }
        setBusy(true);
        try {
            const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/${endpoint}`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
            });
            if (!res.ok) { throw new Error((await res.json()).error || errorMessage); }
            setAmount("");
            await fetchAllData();
            alert(successMessage);
        } catch (e: any) {
            console.error(e); alert(e.message || errorMessage);
        } finally {
            setBusy(false);
        }
    };
    
    const handleAddFunds = () => fundAction(parseFloat(amount), 'addfunds', { amount: parseFloat(amount), source: 'admin' }, "फंड सफलतापूर्वक जोड़ दिया गया।", "फंड जोड़ने में विफल रहा।");
    const handleAddBonus = () => fundAction(parseFloat(amount), 'addfunds', { amount: parseFloat(amount), source: 'bonus' }, "बोनस सफलतापूर्वक जोड़ दिया गया।", "बोनस जोड़ने में विफल रहा।");
    const handleWithdrawFunds = () => {
        const n = parseFloat(amount);
        if ((userData?.wallet_balance ?? 0) < n) { alert("अपर्याप्त शेष राशि।"); return; }
        fundAction(n, 'withdrawfunds', { amount: n, remark: "Admin Debit" }, "फंड सफलतापूर्वक निकाल लिया गया।", "फंड निकालने में विफल रहा।");
    };
    
    const handleStatusChange = async () => {
        if (!token || !userData?.status || !userId) return;
        const newStatus = userData.status === 'active' ? 'inactive' : 'active';
        if (!window.confirm(`क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`)) return;
        setBusy(true);
        try {
            await fetch(`https://backend.gdmatka.site/api/changestatus`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, status: newStatus }),
            });
            alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
            setUserData(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) { alert("स्टेटस अपडेट करने में विफल रहा।"); } 
        finally { setBusy(false); }
    };
    
    const handleDeleteUser = async () => {
        if (!token || !userId || !userData) return;
        if (!window.confirm(`क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`)) return;
        setBusy(true);
        try {
            await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ user_id: userId }),
            });
            alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
            router.push('/dashboard');
        } catch (error) { alert('उपयोगकर्ता को हटाने में विफल रहा।'); } 
        finally { setBusy(false); }
    };
    
    const handleGoBack = () => router.push("/user-management");
    
    const handleRefresh = () => {
        setCurrentPage(1);
        fetchAllData();
    };
    
    const handleDeleteBet = async (betId: number) => {
        if (!window.confirm(`Are you sure you want to permanently delete Bet ID #${betId}? This will adjust the user's wallet.`)) return;
        setDeletingId(betId);
        try {
            const response = await fetch(`https://backend.gdmatka.site/api/bets/${betId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) { throw new Error((await response.json()).details || "Failed to delete bet."); }
            await fetchAllData();
            alert(`Bet ID #${betId} deleted successfully.`);
        } catch (err: any) { alert(`Error: ${err.message}`); } 
        finally { setDeletingId(null); }
    };
    
    const handleSaveEdit = async (updatedBet: BidHistoryItem) => {
        setEditingBet(null);
        await fetchAllData();
        alert(`Bet ID #${updatedBet.id} updated successfully.`);
    };

    // ▼▼▼ नया लॉजिक: डिपॉजिट को विभाजित करना और टोटल की गणना करना ▼▼▼
    const { adminCredits, userApprovedDeposits, totalAdminCreditsAmount, totalUserDepositAmount } = useMemo(() => {
        const credits = fundHistory.credits || [];
        
        const adminCredits = credits.filter(c => c.source === 'admin' || c.source === 'bonus');
        const userApprovedDeposits = credits.filter(c => !c.source || (c.source !== 'admin' && c.source !== 'bonus'));
        
        const totalAdminCreditsAmount = adminCredits.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const totalUserDepositAmount = userApprovedDeposits.reduce((sum, c) => sum + Number(c.amount || 0), 0);

        return { adminCredits, userApprovedDeposits, totalAdminCreditsAmount, totalUserDepositAmount };
    }, [fundHistory.credits]);
    
    // केवल Approved Deposits को दिखाने के लिए modifiedUserData
    const modifiedUserData = useMemo(() => {
        if (!userData) return null;
        return {
            ...userData,
            // Total Deposit को Approved Deposits के टोटल से बदलें
            total_deposit: totalUserDepositAmount 
        };
    }, [userData, totalUserDepositAmount]);
    
    
    // पेजिनेशन लॉजिक: वर्तमान पेज के लिए बिड्स और कुल पेज की गणना
    const currentBids = useMemo(() => {
        const startIndex = (currentPage - 1) * BIDS_PER_PAGE;
        const endIndex = startIndex + BIDS_PER_PAGE;
        return bidHistory.slice(startIndex, endIndex);
    }, [bidHistory, currentPage]);
    
    const totalPages = useMemo(() => {
        return Math.ceil(bidHistory.length / BIDS_PER_PAGE);
    }, [bidHistory]);
    // ▲▲▲ पेजिनेशन लॉजिक: वर्तमान पेज के लिए बिड्स और कुल पेज की गणना ▲▲▲


    if (loading || !userData || !modifiedUserData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-600">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p>उपयोगकर्ता का विवरण लोड हो रहा है...</p>
            </div>
        );
    }
    
    const whatsappMessage = encodeURIComponent(`Hello ${userData.full_name}, GD Matka से संपर्क करने के लिए धन्यवाद।`);

    return (
        <div className="min-h-screen bg-slate-100 p-3 md:p-6">
            {editingBet && token && (<EditBetModal bet={editingBet} token={token} onClose={() => setEditingBet(null)} onSave={handleSaveEdit}/>)}
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/80 px-3 py-2 shadow-sm backdrop-blur md:px-4 md:py-3">
                    <div className="flex items-center gap-2 md:gap-3">
                        <button onClick={handleGoBack} className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200" title="Back"><ArrowLeft className="h-4 w-4" /></button>
                        <h2 className="text-lg font-semibold md:text-2xl">User Details - ID: {userId}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleStatusChange} disabled={busy} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60 ${userData.status === 'active' ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (userData.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />)}
                            {userData.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={handleDeleteUser} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                        </button>
                        <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60" title="Refresh">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm md:col-span-2">
                        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                            <div className="flex items-center gap-4">
                                <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100"><User2 className="h-9 w-9 text-slate-600" /></div>
                                <div>
                                    <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <span className="font-medium text-slate-600">Password:</span>
                                        <div className="flex items-center rounded-md bg-slate-100 px-2 py-1">
                                            <span className="font-mono text-slate-800">{showPassword ? userData.password : "••••••••"}</span>
                                            <button onClick={() => setShowPassword(!showPassword)} className="ml-2 rounded-full p-1 text-slate-500 hover:bg-slate-200" title={showPassword ? "Hide" : "Show"}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm md:text-right">
                                <div className="flex items-center justify-start gap-2 md:justify-end">
                                    {userData.status === "active" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
                                    <span className="font-medium">Status:</span>
                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${chip(userData.status)}`}>{userData.status || "active"}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {userData.email || "-"}</span>
                                    <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {userData.phone_number || "-"}</span>
                                    <div className="flex items-center gap-1">
                                        <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(userData.phone_number)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-1 text-green-600 transition hover:bg-green-100" title="Send WhatsApp"><MessageSquare className="h-5 w-5" /></a>
                                        <a href={`tel:${userData.phone_number}`} className="rounded-full p-1 text-blue-600 transition hover:bg-blue-100" title="Call User"><Phone className="h-5 w-5" /></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Creation Date</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.creation_date).date || "-"}</div></div>
                            <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Last Login</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.last_login).date || "-"}</div></div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-600" /><h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4></div><ShieldCheck className="h-5 w-5 text-emerald-600/70" /></div>
                        <div className="mt-2 text-3xl font-bold text-emerald-700">{INR(userData.wallet_balance || 0)}</div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="grid grid-cols-2 gap-4">
                        {/* total_deposit में modifiedUserData का उपयोग करें */}
                        <Stat title="Total Deposit" value={INR(modifiedUserData.total_deposit || 0)} tone="emerald" /> 
                        <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
                        <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
                        <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <h3 className="text-lg font-semibold">Fund Management</h3>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-2">
                            <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center"><IndianRupee className="h-4 w-4 text-slate-400" /></span><input type="number" inputMode="decimal" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm outline-none ring-0 focus:border-blue-300" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                            <button onClick={handleAddFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Plus className="mr-1 h-4 w-4" /> Add</button>
                            <button onClick={handleAddBonus} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"><Gift className="mr-1 h-4 w-4" /> Bonus</button>
                            <button onClick={handleWithdrawFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Minus className="mr-1 h-4 w-4" /> Withdraw</button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
                        <InfoRow label="Bank Name" value={userData.bank_name} />
                        <InfoRow label="A/C Holder" value={userData.account_holder_name} />
                        <InfoRow label="A/C Number" value={userData.account_number} />
                        <InfoRow label="IFSC Code" value={userData.ifsc_code} />
                        <InfoRow label="PhonePe" value={userData.phonepe_number} />
                        <InfoRow label="GPay" value={userData.gpay_number} />
                        <InfoRow label="Paytm" value={userData.paytm_number} />
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                        <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
                        <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
                        <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
                    </div>

                    {tab === "funds" && (
                        <div className="space-y-6">
                            {/* Admin Credits टेबल */}
                            <SectionTable title="Admin Credits (Manual Add & Bonus)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={adminCredits.map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})}>
                                <div className="p-3 text-right font-semibold text-base border-t border-slate-200">
                                    <span className="text-slate-600">Total Admin Credit/Bonus: </span>
                                    <span className="text-emerald-700">{INR(totalAdminCreditsAmount)}</span>
                                </div>
                            </SectionTable>
                            {/* Approved Deposits टेबल */}
                            <SectionTable title="Approved Deposits (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={userApprovedDeposits.map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})}>
                                <div className="p-3 text-right font-semibold text-base border-t border-slate-200">
                                    <span className="text-slate-600">Total User Deposit: </span>
                                    <span className="text-emerald-700">{INR(totalUserDepositAmount)}</span>
                                </div>
                            </SectionTable>
                            <SectionTable title="Admin Debits (Manual Withdrawal)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={(fundHistory.debits || []).map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
                            <SectionTable title="Withdrawal History (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={(fundHistory.withdrawals || []).map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
                        </div>
                    )}

                    
                    {tab === "bids" && (
                        <div className="space-y-4">
                            <SectionTable
                                title={`Bid History (Page ${currentPage} of ${totalPages})`}
                                headers={["#", "Game", "Type", "Session", "Jodi", "Open Digit", "Open Panna", "Close Digit", "Close Panna", "Points", "Status", "Date", "Time", "Actions"]}
                                // currentBids का उपयोग करें
                                rows={currentBids.map((r, i) => {
                                    const { date, time } = formatDateIST(r.time);
                                    // सही क्रम संख्या (Serial Number) दिखाने के लिए
                                    const serialNumber = (currentPage - 1) * BIDS_PER_PAGE + i + 1;
                                    return [
                                        serialNumber, r.game_name, r.game_type, r.session,
                                        // Jodi Column
                                        r.game_type?.toLowerCase().includes('jodi') ? r.first_number : '-',
                                        // Digit/Panna Columns
                                        r.open_digit || '-', r.open_panna || '-',
                                        r.close_digit || '-', r.close_panna || '-',
                                        r.points, r.status, date, time,
                                        <div className="flex items-center gap-1" key={`actions-${r.id}`}>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingBet(r)} disabled={r.status !== 'pending'} className="text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed" title="Edit Bet">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBet(r.id)} disabled={deletingId === r.id} className="text-red-600 hover:text-red-800" title="Delete Bet">
                                                {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>,
                                    ];
                                })}
                            />
                            {/* पेजिनेशन कंट्रोल्स */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-4 pt-4">
                                    <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                                    </Button>
                                    <span className="text-sm font-medium text-slate-700">Page {currentPage} of {totalPages}</span>
                                    <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                        Next <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "winnings" && (
                           <SectionTable
                                title="Winning History Report"
                                headers={["#", "Game", "Type", "Session", "Open Digit", "Open Panna", "Close Digit", "Close Panna", "Bet Points", "Won Points", "Date", "Time"]}
                                rows={winningHistory.map((r, i) => {
                                    const { date, time } = formatDateIST(r.date + ' ' + r.time);
                                    return [
                                        i + 1, r.game_name, r.game_type, r.session,
                                        r.open_digit || '-', r.open_panna || '-',
                                        r.close_digit || '-', r.close_panna || '-',
                                        r.added_point, r.won_point, date, time,
                                    ];
                                })}
                            />
                    )}
                </div>
            </div>
        </div>
    );
}

/* --------------------------- UI Sub-components --------------------------- */
function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
    const tones: Record<string, string> = {
        emerald: "from-emerald-50 to-white text-emerald-800", rose: "from-rose-50 to-white text-rose-800",
        sky: "from-sky-50 to-white text-sky-800", amber: "from-amber-50 to-white text-amber-800",
        slate: "from-slate-50 to-white text-slate-800",
    };
    return (<div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}><div className="text-sm font-medium text-slate-500">{title}</div><div className="mt-2 text-xl font-bold">{value}</div></div>);
}
function InfoRow({ label, value }: { label: string; value?: string }) {
    return (<div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div></div>);
}
function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (<button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>);
}
// SectionTable कंपोनेंट को बदल दिया गया है ताकि यह footer content (total) को children के रूप में ले सके।
function SectionTable({ title, headers, rows, children }: { title: string; headers: (string | JSX.Element)[]; rows?: (string | number | JSX.Element)[][]; children?: React.ReactNode }) {
    const hasRows = rows && rows.length > 0;
    const isNumericColumn = (header: string | JSX.Element) => {
        if (typeof header !== 'string') return false;
        return ['Amount', 'Points', 'Digit', 'Panna'].some(keyword => header.includes(keyword));
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h4 className="text-base font-semibold">{title}</h4>
                <span className="text-xs text-slate-500">{hasRows ? `${rows.length} items` : "0 items"}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left text-slate-600">
                            {headers.map((h, i) => (
                                <th key={i} className="border-b border-slate-200 px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {hasRows ? (
                            rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    {row.map((cell, i) => (
                                        <td key={i} className={`border-b border-slate-100 px-3 py-2 whitespace-nowrap ${isNumericColumn(headers[i]) ? 'font-mono' : ''}`}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-3 py-8 text-center text-slate-500" colSpan={headers.length}>
                                    इस सेक्शन में कोई डेटा उपलब्ध नहीं है
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* नया: टेबल के नीचे कुल राशि दिखाने के लिए */}
            {children && <div className="p-0">{children}</div>} 
        </div>
    );
}


// "use client";

// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//     ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//     Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//     Power, PowerOff, Trash2, Eye, EyeOff, MessageSquare, Gift, Loader2, Pencil
// } from "lucide-react";
// import { Button } from "@/components/ui/button";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//     full_name: string; email: string; phone_number: string; password: string;
//     creation_date: string; last_login: string; wallet_balance: number;
//     total_deposit: number; total_withdraw: number; total_bid: number; total_winning: number;
//     status?: "active" | "inactive" | string; bank_name?: string; account_holder_name?: string;
//     account_number?: string; ifsc_code?: string; phonepe_number?: string; gpay_number?: string; paytm_number?: string;
// }

// interface FundHistoryItem {
//     amount: string; remark: string; date: string; time: string; status: string; source?: string;
// }

// interface FundHistory {
//     credits: FundHistoryItem[]; debits: FundHistoryItem[]; requests: FundHistoryItem[]; withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//     id: number; game_name: string; game_type: string; session: string;
//     open_digit: string | null; close_digit: string | null; open_panna: string | null; close_panna: string | null;
//     first_number: string; second_number: string | null;
//     points: string; status: 'won' | 'pending' | 'lost' | string;
//     date: string; time: string;
// }

// interface WinningHistoryItem {
//     game_name: string; game_type: string; session: string; open_digit: string | null;
//     close_digit: string | null; open_panna: string | null; close_panna: string | null;
//     added_point: string; won_point: string; date: string; time: string;
// }

// /* ----------------------------- Edit Modal Component ----------------------------- */
// function EditBetModal({ bet, token, onClose, onSave }: { bet: BidHistoryItem, token: string, onClose: () => void, onSave: (updatedBet: BidHistoryItem) => void }) {
//     const [currentBet, setCurrentBet] = useState(bet);
//     const [isSaving, setIsSaving] = useState(false);

//     const handleSave = async () => {
//         setIsSaving(true);
//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/bets/${bet.id}`, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({
//                     first_number: currentBet.first_number,
//                     second_number: currentBet.second_number,
//                     points: currentBet.points,
//                 }),
//             });
//             if (!response.ok) {
//                 const err = await response.json();
//                 throw new Error(err.details || "Failed to update bet.");
//             }
//             onSave(currentBet);
//         } catch (error: any) {
//             alert(`Error: ${error.message}`);
//         } finally {
//             setIsSaving(false);
//         }
//     };
    
//     const isCompoundGame = bet.game_type?.toLowerCase().includes('jodi') || bet.game_type?.toLowerCase().includes('sangam');

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
//                 <h2 className="text-lg font-bold mb-4">Edit Bet ID #{bet.id}</h2>
//                 <p className="text-sm text-gray-600 mb-4">You can only edit pending bets. This will adjust the user's wallet balance.</p>
//                 <div className="space-y-4">
//                     <div>
//                         <label className="text-sm font-medium text-gray-700">{isCompoundGame ? 'Open Number / Pana' : 'Bet Number'}</label>
//                         <input type="text" value={currentBet.first_number} onChange={(e) => setCurrentBet({ ...currentBet, first_number: e.target.value })} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" />
//                     </div>
//                     {isCompoundGame && (
//                         <div>
//                             <label className="text-sm font-medium text-gray-700">Close Number / Digit</label>
//                             <input type="text" value={currentBet.second_number || ''} onChange={(e) => setCurrentBet({ ...currentBet, second_number: e.target.value })} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" />
//                         </div>
//                     )}
//                     <div>
//                         <label className="text-sm font-medium text-gray-700">Points</label>
//                         <input type="number" value={currentBet.points} onChange={(e) => setCurrentBet({ ...currentBet, points: e.target.value })} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono" />
//                     </div>
//                 </div>
//                 <div className="mt-6 flex justify-end space-x-2">
//                     <Button variant="ghost" onClick={onClose}>Cancel</Button>
//                     <Button onClick={handleSave} disabled={isSaving}>
//                         {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//     const n = typeof v === "string" ? Number(v) : v;
//     if (isNaN(n)) return "₹0.00";
//     return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };
// const chip = (ok?: string) => ok === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200";
// const formatDateIST = (rawDate: string | number) => {
//     if (!rawDate) return { date: "-", time: "-" };
//     try {
//         let dateInput = String(rawDate).trim();
//         if (!dateInput.includes(' ') && dateInput.endsWith('Z')) {} 
//         else if (dateInput.includes(' ') && !dateInput.endsWith('Z')) { dateInput = dateInput.replace(' ', 'T') + 'Z'; } 
//         else if (!dateInput.includes('T')) { dateInput = dateInput + 'T00:00:00Z'; }
//         const date = new Date(dateInput);
//         if (isNaN(date.getTime())) {
//             const parts = String(rawDate).split(/[\s,T]/);
//             return { date: parts[0] || "-", time: parts[1] || "-" };
//         }
//         const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
//         const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
//         const datePart = new Intl.DateTimeFormat('en-CA', dateOptions).format(date);
//         const timePart = new Intl.DateTimeFormat('en-GB', timeOptions).format(date);
//         return { date: datePart, time: timePart };
//     } catch (e) { return { date: "-", time: "-" }; }
// };
// const formatPhoneNumberForWhatsApp = (phone: string) => {
//     if (!phone) return "";
//     const cleaned = phone.replace(/\D/g, "");
//     return cleaned.length === 10 ? `91${cleaned}` : cleaned;
// };

// /* ---------------------------- Main Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//     const router = useRouter();
//     const { userId } = params;

//     const [token, setToken] = useState<string | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [busy, setBusy] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     const [userData, setUserData] = useState<UserData | null>(null);
//     const [fundHistory, setFundHistory] = useState<FundHistory>({ credits: [], debits: [], requests: [], withdrawals: [] });
//     const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//     const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//     const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");
//     const [amount, setAmount] = useState<string>("");

//     const [editingBet, setEditingBet] = useState<BidHistoryItem | null>(null);
//     const [deletingId, setDeletingId] = useState<number | null>(null);

//     const fetchAllData = useCallback(async () => {
//         if (!token || !userId) return;
//         setLoading(true);
//         try {
//             const responses = await Promise.all([
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
//             ]);

//             const safeJsonParse = async (res: Response, defaultReturn: any = []) => {
//                 if (res.status === 204) return defaultReturn;
//                 if (!res.ok) throw new Error(`API call failed with status ${res.status}`);
//                 return res.json();
//             };
            
//             const [userData, fundHistory, bidHistory, winningHistory] = await Promise.all([
//                 safeJsonParse(responses[0], null),
//                 safeJsonParse(responses[1], { credits: [], debits: [], withdrawals: [] }),
//                 safeJsonParse(responses[2], []),
//                 safeJsonParse(responses[3], [])
//             ]);

//             if (!userData) throw new Error('Failed to fetch user data');
            
//             setUserData(userData);
//             setFundHistory(fundHistory);
//             setBidHistory(bidHistory);
//             setWinningHistory(winningHistory);
//         } catch (error) {
//             console.error("Failed to fetch all data:", error);
//             alert("Could not load user data. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     }, [token, userId]);
    
//     useEffect(() => {
//         const t = localStorage.getItem("token");
//         if (!t || t === "undefined" || t === "null") { router.push("/login"); return; }
//         setToken(t);
//     }, [router]);
    
//     useEffect(() => {
//         if(token) fetchAllData();
//     }, [token, fetchAllData]);

//     const fundAction = async (amountValue: number, endpoint: string, body: object, successMessage: string, errorMessage: string) => {
//         if (isNaN(amountValue) || amountValue <= 0) { alert("कृपया एक वैध राशि दर्ज करें।"); return; }
//         setBusy(true);
//         try {
//             const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/${endpoint}`, {
//                 method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
//             });
//             if (!res.ok) { throw new Error((await res.json()).error || errorMessage); }
//             setAmount("");
//             await fetchAllData();
//             alert(successMessage);
//         } catch (e: any) {
//             console.error(e); alert(e.message || errorMessage);
//         } finally {
//             setBusy(false);
//         }
//     };
    
//     const handleAddFunds = () => fundAction(parseFloat(amount), 'addfunds', { amount: parseFloat(amount), source: 'admin' }, "फंड सफलतापूर्वक जोड़ दिया गया।", "फंड जोड़ने में विफल रहा।");
//     const handleAddBonus = () => fundAction(parseFloat(amount), 'addfunds', { amount: parseFloat(amount), source: 'bonus' }, "बोनस सफलतापूर्वक जोड़ दिया गया।", "बोनस जोड़ने में विफल रहा।");
//     const handleWithdrawFunds = () => {
//         const n = parseFloat(amount);
//         if ((userData?.wallet_balance ?? 0) < n) { alert("अपर्याप्त शेष राशि।"); return; }
//         fundAction(n, 'withdrawfunds', { amount: n, remark: "Admin Debit" }, "फंड सफलतापूर्वक निकाल लिया गया।", "फंड निकालने में विफल रहा।");
//     };
    
//     const handleStatusChange = async () => {
//         if (!token || !userData?.status || !userId) return;
//         const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//         if (!window.confirm(`क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`)) return;
//         setBusy(true);
//         try {
//             await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//                 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, status: newStatus }),
//             });
//             alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//             setUserData(prev => prev ? { ...prev, status: newStatus } : null);
//         } catch (error) { alert("स्टेटस अपडेट करने में विफल रहा।"); } 
//         finally { setBusy(false); }
//     };
    
//     const handleDeleteUser = async () => {
//         if (!token || !userId || !userData) return;
//         if (!window.confirm(`क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`)) return;
//         setBusy(true);
//         try {
//             await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//                 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ user_id: userId }),
//             });
//             alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//             router.push('/dashboard');
//         } catch (error) { alert('उपयोगकर्ता को हटाने में विफल रहा।'); } 
//         finally { setBusy(false); }
//     };
    
//     const handleGoBack = () => router.push("/user-management");
//     const handleRefresh = () => fetchAllData();

//     const handleDeleteBet = async (betId: number) => {
//         if (!window.confirm(`Are you sure you want to permanently delete Bet ID #${betId}? This will adjust the user's wallet.`)) return;
//         setDeletingId(betId);
//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/bets/${betId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
//             if (!response.ok) { throw new Error((await response.json()).details || "Failed to delete bet."); }
//             await fetchAllData();
//             alert(`Bet ID #${betId} deleted successfully.`);
//         } catch (err: any) { alert(`Error: ${err.message}`); } 
//         finally { setDeletingId(null); }
//     };
    
//     const handleSaveEdit = async (updatedBet: BidHistoryItem) => {
//         setEditingBet(null);
//         await fetchAllData();
//         alert(`Bet ID #${updatedBet.id} updated successfully.`);
//     };

//     const { adminCredits, userApprovedDeposits } = useMemo(() => {
//         const credits = fundHistory.credits || [];
//         const adminCredits = credits.filter(c => c.source === 'admin' || c.source === 'bonus');
//         const userApprovedDeposits = credits.filter(c => !c.source || (c.source !== 'admin' && c.source !== 'bonus'));
//         return { adminCredits, userApprovedDeposits };
//     }, [fundHistory.credits]);

//     if (loading || !userData) {
//         return (
//             <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-600">
//                 <Loader2 className="h-10 w-10 animate-spin mb-4" />
//                 <p>उपयोगकर्ता का विवरण लोड हो रहा है...</p>
//             </div>
//         );
//     }
    
//     const whatsappMessage = encodeURIComponent(`Hello ${userData.full_name}, GD Matka से संपर्क करने के लिए धन्यवाद।`);

//     return (
//         <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//             {editingBet && token && (<EditBetModal bet={editingBet} token={token} onClose={() => setEditingBet(null)} onSave={handleSaveEdit}/>)}
//             <div className="mx-auto max-w-7xl space-y-6">
//                 <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/80 px-3 py-2 shadow-sm backdrop-blur md:px-4 md:py-3">
//                     <div className="flex items-center gap-2 md:gap-3">
//                         <button onClick={handleGoBack} className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200" title="Back"><ArrowLeft className="h-4 w-4" /></button>
//                         <h2 className="text-lg font-semibold md:text-2xl">User Details - ID: {userId}</h2>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button onClick={handleStatusChange} disabled={busy} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60 ${userData.status === 'active' ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
//                             {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (userData.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />)}
//                             {userData.status === 'active' ? 'Deactivate' : 'Activate'}
//                         </button>
//                         <button onClick={handleDeleteUser} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
//                             {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
//                         </button>
//                         <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60" title="Refresh">
//                             {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
//                             <span className="hidden md:inline">Refresh</span>
//                         </button>
//                     </div>
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-3">
//                     <div className="rounded-2xl border bg-white p-4 shadow-sm md:col-span-2">
//                         <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//                             <div className="flex items-center gap-4">
//                                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100"><User2 className="h-9 w-9 text-slate-600" /></div>
//                                 <div>
//                                     <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                                     <div className="mt-1 flex items-center gap-2 text-sm">
//                                         <span className="font-medium text-slate-600">Password:</span>
//                                         <div className="flex items-center rounded-md bg-slate-100 px-2 py-1">
//                                             <span className="font-mono text-slate-800">{showPassword ? userData.password : "••••••••"}</span>
//                                             <button onClick={() => setShowPassword(!showPassword)} className="ml-2 rounded-full p-1 text-slate-500 hover:bg-slate-200" title={showPassword ? "Hide" : "Show"}>
//                                                 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="space-y-2 text-sm md:text-right">
//                                 <div className="flex items-center justify-start gap-2 md:justify-end">
//                                     {userData.status === "active" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
//                                     <span className="font-medium">Status:</span>
//                                     <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${chip(userData.status)}`}>{userData.status || "active"}</span>
//                                 </div>
//                                 <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                                     <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {userData.email || "-"}</span>
//                                     <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {userData.phone_number || "-"}</span>
//                                     <div className="flex items-center gap-1">
//                                         <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(userData.phone_number)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-1 text-green-600 transition hover:bg-green-100" title="Send WhatsApp"><MessageSquare className="h-5 w-5" /></a>
//                                         <a href={`tel:${userData.phone_number}`} className="rounded-full p-1 text-blue-600 transition hover:bg-blue-100" title="Call User"><Phone className="h-5 w-5" /></a>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="mt-4 grid gap-4 sm:grid-cols-2">
//                             <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Creation Date</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.creation_date).date || "-"}</div></div>
//                             <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Last Login</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.last_login).date || "-"}</div></div>
//                         </div>
//                     </div>
//                     <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//                         <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-600" /><h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4></div><ShieldCheck className="h-5 w-5 text-emerald-600/70" /></div>
//                         <div className="mt-2 text-3xl font-bold text-emerald-700">{INR(userData.wallet_balance || 0)}</div>
//                     </div>
//                 </div>

//                 <div className="grid gap-4 lg:grid-cols-2">
//                     <div className="grid grid-cols-2 gap-4">
//                         <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//                         <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//                         <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//                         <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//                     </div>
//                     <div className="rounded-2xl border bg-white p-4 shadow-sm">
//                         <h3 className="text-lg font-semibold">Fund Management</h3>
//                         <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-2">
//                             <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center"><IndianRupee className="h-4 w-4 text-slate-400" /></span><input type="number" inputMode="decimal" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm outline-none ring-0 focus:border-blue-300" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
//                             <button onClick={handleAddFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Plus className="mr-1 h-4 w-4" /> Add</button>
//                             <button onClick={handleAddBonus} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"><Gift className="mr-1 h-4 w-4" /> Bonus</button>
//                             <button onClick={handleWithdrawFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Minus className="mr-1 h-4 w-4" /> Withdraw</button>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="rounded-2xl border bg-white p-4 shadow-sm">
//                     <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//                     <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
//                         <InfoRow label="Bank Name" value={userData.bank_name} />
//                         <InfoRow label="A/C Holder" value={userData.account_holder_name} />
//                         <InfoRow label="A/C Number" value={userData.account_number} />
//                         <InfoRow label="IFSC Code" value={userData.ifsc_code} />
//                         <InfoRow label="PhonePe" value={userData.phonepe_number} />
//                         <InfoRow label="GPay" value={userData.gpay_number} />
//                         <InfoRow label="Paytm" value={userData.paytm_number} />
//                     </div>
//                 </div>

//                 <div className="rounded-2xl border bg-white p-4 shadow-sm">
//                     <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
//                         <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//                         <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//                         <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//                     </div>

//                     {tab === "funds" && (
//                         <div className="space-y-6">
//                             <SectionTable title="Admin Credits (Manual Add & Bonus)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={adminCredits.map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                             <SectionTable title="Approved Deposits (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={userApprovedDeposits.map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                             <SectionTable title="Admin Debits (Manual Withdrawal)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={(fundHistory.debits || []).map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                             <SectionTable title="Withdrawal History (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={(fundHistory.withdrawals || []).map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                         </div>
//                     )}

                   
//                     {tab === "bids" && (
//                         // ▼▼▼ यह बदला हुआ हिस्सा है ▼▼▼
//                         <SectionTable
//                             title="Bid History"
//                             headers={["#", "Game", "Type", "Session", "Jodi", "Open Digit", "Open Panna", "Close Digit", "Close Panna", "Points", "Status", "Date", "Time", "Actions"]}
//                             rows={bidHistory.map((r, i) => {
//                                 const { date, time } = formatDateIST(r.time);
//                                 return [
//                                     i + 1, r.game_name, r.game_type, r.session,
//                                     // Jodi Column
//                                     r.game_type?.toLowerCase().includes('jodi') ? r.first_number : '-',
//                                     // Digit/Panna Columns
//                                     r.open_digit || '-', r.open_panna || '-',
//                                     r.close_digit || '-', r.close_panna || '-',
//                                     r.points, r.status, date, time,
//                                     <div className="flex items-center gap-1" key={`actions-${r.id}`}>
//                                         <Button variant="ghost" size="icon" onClick={() => setEditingBet(r)} disabled={r.status !== 'pending'} className="text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed" title="Edit Bet">
//                                             <Pencil className="h-4 w-4" />
//                                         </Button>
//                                         <Button variant="ghost" size="icon" onClick={() => handleDeleteBet(r.id)} disabled={deletingId === r.id} className="text-red-600 hover:text-red-800" title="Delete Bet">
//                                             {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
//                                         </Button>
//                                     </div>
//                                 ];
//                             })}
//                         />
//                         // ▲▲▲ बदलाव यहाँ समाप्त ▲▲▲
//                     )}

//                     {tab === "winnings" && (
//                          <SectionTable
//                             title="Winning History Report"
//                             headers={["#", "Game", "Type", "Session", "Open Digit", "Open Panna", "Close Digit", "Close Panna", "Bet Points", "Won Points", "Date", "Time"]}
//                             rows={winningHistory.map((r, i) => {
//                                 const { date, time } = formatDateIST(r.date + ' ' + r.time);
//                                 return [
//                                     i + 1, r.game_name, r.game_type, r.session,
//                                     r.open_digit || '-', r.open_panna || '-',
//                                     r.close_digit || '-', r.close_panna || '-',
//                                     r.added_point, r.won_point, date, time,
//                                 ];
//                             })}
//                         />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// /* --------------------------- UI Sub-components --------------------------- */
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//     const tones: Record<string, string> = {
//         emerald: "from-emerald-50 to-white text-emerald-800", rose: "from-rose-50 to-white text-rose-800",
//         sky: "from-sky-50 to-white text-sky-800", amber: "from-amber-50 to-white text-amber-800",
//         slate: "from-slate-50 to-white text-slate-800",
//     };
//     return (<div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}><div className="text-sm font-medium text-slate-500">{title}</div><div className="mt-2 text-xl font-bold">{value}</div></div>);
// }
// function InfoRow({ label, value }: { label: string; value?: string }) {
//     return (<div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div></div>);
// }
// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//     return (<button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>);
// }
// function SectionTable({ title, headers, rows }: { title: string; headers: (string | JSX.Element)[]; rows?: (string | number | JSX.Element)[][] }) {
//     const hasRows = rows && rows.length > 0;
//     const isNumericColumn = (header: string | JSX.Element) => {
//         if (typeof header !== 'string') return false;
//         return ['Amount', 'Points', 'Digit', 'Panna'].some(keyword => header.includes(keyword));
//     }

//     return (
//         <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//                 <h4 className="text-base font-semibold">{title}</h4>
//                 <span className="text-xs text-slate-500">{hasRows ? `${rows.length} items` : "0 items"}</span>
//             </div>
//             <div className="overflow-x-auto">
//                 <table className="w-full min-w-[720px] border-collapse text-sm">
//                     <thead>
//                         <tr className="bg-slate-50 text-left text-slate-600">
//                             {headers.map((h, i) => (
//                                 <th key={i} className="border-b border-slate-200 px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
//                             ))}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {hasRows ? (
//                             rows.map((row, idx) => (
//                                 <tr key={idx} className="hover:bg-slate-50 transition-colors">
//                                     {row.map((cell, i) => (
//                                         <td key={i} className={`border-b border-slate-100 px-3 py-2 whitespace-nowrap ${isNumericColumn(headers[i]) ? 'font-mono' : ''}`}>
//                                             {cell}
//                                         </td>
//                                     ))}
//                                 </tr>
//                             ))
//                         ) : (
//                             <tr>
//                                 <td className="px-3 py-8 text-center text-slate-500" colSpan={headers.length}>
//                                     इस सेक्शन में कोई डेटा उपलब्ध नहीं है
//                                 </td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }
// "use client";

// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//     ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//     Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//     Power, PowerOff, Trash2, Eye, EyeOff, MessageSquare, Gift, Loader2
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//     full_name: string;
//     email: string;
//     phone_number: string;
//     password: string;
//     creation_date: string;
//     last_login: string;
//     wallet_balance: number;
//     total_deposit: number;
//     total_withdraw: number;
//     total_bid: number;
//     total_winning: number;
//     status?: "active" | "inactive" | string;
//     bank_name?: string;
//     account_holder_name?: string;
//     account_number?: string;
//     ifsc_code?: string;
//     phonepe_number?: string;
//     gpay_number?: string;
//     paytm_number?: string;
// }

// interface FundHistoryItem {
//     amount: string;
//     remark: string;
//     date: string;
//     time: string;
//     status: string;
//     source?: string;
// }

// interface FundHistory {
//     credits: FundHistoryItem[];
//     debits: FundHistoryItem[];
//     requests: FundHistoryItem[];
//     withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//     game_name: string;
//     game_type: string;
//     session: string;
//     open_digit: string | null;
//     close_digit: string | null;
//     open_panna: string | null;
//     close_panna: string | null;
//     points: string;
//     status: string;
//     date: string;
//     time: string;
// }

// interface WinningHistoryItem {
//     game_name: string;
//     game_type: string;
//     session: string;
//     open_digit: string | null;
//     close_digit: string | null;
//     open_panna: string | null;
//     close_panna: string | null;
//     added_point: string;
//     won_point: string;
//     date: string;
//     time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//     const n = typeof v === "string" ? Number(v) : v;
//     if (isNaN(n)) return "₹0.00";
//     return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };

// const chip = (ok?: string) =>
//     ok === "active"
//         ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//         : "bg-rose-100 text-rose-700 border-rose-200";

// const formatDateIST = (rawDate: string | number) => {
//     if (!rawDate) return { date: "-", time: "-" };
//     try {
//         let dateInput = String(rawDate).trim();
//         if (!dateInput.includes(' ') && dateInput.endsWith('Z')) {
//             // Already a valid ISO string
//         } else if (dateInput.includes(' ') && !dateInput.endsWith('Z')) {
//             dateInput = dateInput.replace(' ', 'T') + 'Z';
//         } else if (!dateInput.includes('T')) {
//             dateInput = dateInput + 'T00:00:00Z';
//         }
        
//         const date = new Date(dateInput);
//         if (isNaN(date.getTime())) {
//             const parts = String(rawDate).split(/[\s,T]/);
//             return { date: parts[0] || "-", time: parts[1] || "-" };
//         }

//         const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
//         const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

//         const datePart = new Intl.DateTimeFormat('en-CA', dateOptions).format(date);
//         const timePart = new Intl.DateTimeFormat('en-GB', timeOptions).format(date);
        
//         return { date: datePart, time: timePart };
//     } catch (e) {
//         return { date: "-", time: "-" };
//     }
// };

// const formatPhoneNumberForWhatsApp = (phone: string) => {
//     if (!phone) return "";
//     const cleaned = phone.replace(/\D/g, "");
//     return cleaned.length === 10 ? `91${cleaned}` : cleaned;
// };

// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//     const router = useRouter();
//     const userId = params.userId;

//     const [token, setToken] = useState<string | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [busy, setBusy] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     const [userData, setUserData] = useState<UserData | null>(null);
//     const [fundHistory, setFundHistory] = useState<FundHistory>({ credits: [], debits: [], requests: [], withdrawals: [] });
//     const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//     const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//     const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");
//     const [amount, setAmount] = useState<string>("");

//     const fetchAllData = useCallback(async () => {
//         if (!token || !userId) return;
//         setLoading(true);
//         try {
//             const [userDataRes, fundHistoryRes, bidHistoryRes, winningHistoryRes] = await Promise.all([
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
//             ]);

//             if (!userDataRes.ok) throw new Error('Failed to fetch user data');
            
//             setUserData(await userDataRes.json());
//             setFundHistory(await fundHistoryRes.json());
//             setBidHistory(await bidHistoryRes.json());
//             setWinningHistory(await winningHistoryRes.json());
            
//         } catch (error) {
//             console.error("Failed to fetch all data:", error);
//             alert("Could not load user data. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     }, [token, userId]);
    
//     useEffect(() => {
//         const t = localStorage.getItem("token");
//         if (!t || t === "undefined" || t === "null") {
//             router.push("/login");
//             return;
//         }
//         setToken(t);
//     }, [router]);
    
//     useEffect(() => {
//         if(token) fetchAllData();
//     }, [token, fetchAllData]);

//     const fundAction = async (amountValue: number, endpoint: string, body: object, successMessage: string, errorMessage: string) => {
//         if (isNaN(amountValue) || amountValue <= 0) {
//             alert("कृपया एक वैध राशि दर्ज करें।");
//             return;
//         }
//         setBusy(true);
//         try {
//             const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/${endpoint}`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                 body: JSON.stringify(body),
//             });
//             if (!res.ok) {
//                 const errData = await res.json();
//                 throw new Error(errData.error || errorMessage);
//             }
//             setAmount("");
//             // Refetch only the necessary data
//             const [newUserData, newFundHistory] = await Promise.all([
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}`, { headers: { Authorization: `Bearer ${token}` }}).then(res => res.json()),
//                 fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, { headers: { Authorization: `Bearer ${token}` }}).then(res => res.json())
//             ]);
//             setUserData(newUserData);
//             setFundHistory(newFundHistory);
//             alert(successMessage);
//         } catch (e: any) {
//             console.error(e);
//             alert(e.message || errorMessage);
//         } finally {
//             setBusy(false);
//         }
//     };
    
//     const handleAddFunds = () => fundAction(parseFloat(amount), 'addfunds', { amount: parseFloat(amount), source: 'admin' }, "फंड सफलतापूर्वक जोड़ दिया गया।", "फंड जोड़ने में विफल रहा।");
//     const handleAddBonus = () => fundAction(parseFloat(amount), 'addfunds', { amount: parseFloat(amount), source: 'bonus' }, "बोनस सफलतापूर्वक जोड़ दिया गया।", "बोनस जोड़ने में विफल रहा।");
//     const handleWithdrawFunds = () => {
//         const n = parseFloat(amount);
//         if ((userData?.wallet_balance ?? 0) < n) {
//             alert("अपर्याप्त शेष राशि।");
//             return;
//         }
//         fundAction(n, 'withdrawfunds', { amount: n, remark: "Admin Debit" }, "फंड सफलतापूर्वक निकाल लिया गया।", "फंड निकालने में विफल रहा।");
//     };
    
//     const handleStatusChange = async () => {
//         if (!token || !userData?.status || !userId) return;
//         const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//         if (!window.confirm(`क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`)) return;
//         setBusy(true);
//         try {
//             await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//                 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({ userId, status: newStatus }),
//             });
//             alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//             setUserData(prev => prev ? { ...prev, status: newStatus } : null);
//         } catch (error) {
//             alert("स्टेटस अपडेट करने में विफल रहा।");
//         } finally {
//             setBusy(false);
//         }
//     };
    
//     const handleDeleteUser = async () => {
//         if (!token || !userId || !userData) return;
//         if (!window.confirm(`क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`)) return;
//         setBusy(true);
//         try {
//             await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//                 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({ user_id: userId }),
//             });
//             alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//             router.push('/dashboard');
//         } catch (error) {
//             alert('उपयोगकर्ता को हटाने में विफल रहा।');
//         } finally {
//             setBusy(false);
//         }
//     };
    
//     const handleGoBack = () => router.push("/user-management");
//     const handleRefresh = () => fetchAllData();

//     const { adminCredits, userApprovedDeposits } = useMemo(() => {
//         const credits = fundHistory.credits || [];
//         const adminCredits = credits.filter(c => c.source === 'admin' || c.source === 'bonus');
//         const userApprovedDeposits = credits.filter(c => !c.source || (c.source !== 'admin' && c.source !== 'bonus'));
//         return { adminCredits, userApprovedDeposits };
//     }, [fundHistory.credits]);

//     if (loading || !userData) {
//         return (
//             <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-600">
//                 <Loader2 className="h-10 w-10 animate-spin mb-4" />
//                 <p>उपयोगकर्ता का विवरण लोड हो रहा है...</p>
//             </div>
//         );
//     }
    
//     const whatsappMessage = encodeURIComponent(`Hello ${userData.full_name}, GD Matka से संपर्क करने के लिए धन्यवाद।`);

//     return (
//         <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//             <div className="mx-auto max-w-7xl space-y-6">
//                 {/* Sticky Header */}
//                 <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/80 px-3 py-2 shadow-sm backdrop-blur md:px-4 md:py-3">
//                     <div className="flex items-center gap-2 md:gap-3">
//                         <button onClick={handleGoBack} className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200" title="Back"><ArrowLeft className="h-4 w-4" /></button>
//                         <h2 className="text-lg font-semibold md:text-2xl">User Details - ID: {userId}</h2>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button onClick={handleStatusChange} disabled={busy} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60 ${userData.status === 'active' ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
//                             {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (userData.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />)}
//                             {userData.status === 'active' ? 'Deactivate' : 'Activate'}
//                         </button>
//                         <button onClick={handleDeleteUser} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
//                             {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
//                         </button>
//                         <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60" title="Refresh">
//                             {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
//                             <span className="hidden md:inline">Refresh</span>
//                         </button>
//                     </div>
//                 </div>

//                 {/* Profile, Balance & Password Card */}
//                 <div className="grid gap-4 md:grid-cols-3">
//                     <div className="rounded-2xl border bg-white p-4 shadow-sm md:col-span-2">
//                         <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//                             <div className="flex items-center gap-4">
//                                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100"><User2 className="h-9 w-9 text-slate-600" /></div>
//                                 <div>
//                                     <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                                     <div className="mt-1 flex items-center gap-2 text-sm">
//                                         <span className="font-medium text-slate-600">Password:</span>
//                                         <div className="flex items-center rounded-md bg-slate-100 px-2 py-1">
//                                             <span className="font-mono text-slate-800">{showPassword ? userData.password : "••••••••"}</span>
//                                             <button onClick={() => setShowPassword(!showPassword)} className="ml-2 rounded-full p-1 text-slate-500 hover:bg-slate-200" title={showPassword ? "Hide" : "Show"}>
//                                                 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="space-y-2 text-sm md:text-right">
//                                 <div className="flex items-center justify-start gap-2 md:justify-end">
//                                     {userData.status === "active" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
//                                     <span className="font-medium">Status:</span>
//                                     <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${chip(userData.status)}`}>{userData.status || "active"}</span>
//                                 </div>
//                                 <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                                     <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {userData.email || "-"}</span>
//                                     <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {userData.phone_number || "-"}</span>
//                                     <div className="flex items-center gap-1">
//                                         <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(userData.phone_number)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-1 text-green-600 transition hover:bg-green-100" title="Send WhatsApp"><MessageSquare className="h-5 w-5" /></a>
//                                         <a href={`tel:${userData.phone_number}`} className="rounded-full p-1 text-blue-600 transition hover:bg-blue-100" title="Call User"><Phone className="h-5 w-5" /></a>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="mt-4 grid gap-4 sm:grid-cols-2">
//                             <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Creation Date</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.creation_date).date || "-"}</div></div>
//                             <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Last Login</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.last_login).date || "-"}</div></div>
//                         </div>
//                     </div>
//                     <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//                         <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-600" /><h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4></div><ShieldCheck className="h-5 w-5 text-emerald-600/70" /></div>
//                         <div className="mt-2 text-3xl font-bold text-emerald-700">{INR(userData.wallet_balance || 0)}</div>
//                     </div>
//                 </div>

//                 {/* KPI Pills & Fund Management */}
//                 <div className="grid gap-4 lg:grid-cols-2">
//                     <div className="grid grid-cols-2 gap-4">
//                         <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//                         <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//                         <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//                         <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//                     </div>
//                     <div className="rounded-2xl border bg-white p-4 shadow-sm">
//                         <h3 className="text-lg font-semibold">Fund Management</h3>
//                         <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-2">
//                             <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center"><IndianRupee className="h-4 w-4 text-slate-400" /></span><input type="number" inputMode="decimal" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm outline-none ring-0 focus:border-blue-300" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
//                             <button onClick={handleAddFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Plus className="mr-1 h-4 w-4" /> Add</button>
//                             <button onClick={handleAddBonus} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"><Gift className="mr-1 h-4 w-4" /> Bonus</button>
//                             <button onClick={handleWithdrawFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Minus className="mr-1 h-4 w-4" /> Withdraw</button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Payment Info */}
//                 <div className="rounded-2xl border bg-white p-4 shadow-sm">
//                     <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//                     <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
//                         <InfoRow label="Bank Name" value={userData.bank_name} />
//                         <InfoRow label="A/C Holder" value={userData.account_holder_name} />
//                         <InfoRow label="A/C Number" value={userData.account_number} />
//                         <InfoRow label="IFSC Code" value={userData.ifsc_code} />
//                         <InfoRow label="PhonePe" value={userData.phonepe_number} />
//                         <InfoRow label="GPay" value={userData.gpay_number} />
//                         <InfoRow label="Paytm" value={userData.paytm_number} />
//                     </div>
//                 </div>

//                 {/* History Tabs */}
//                 <div className="rounded-2xl border bg-white p-4 shadow-sm">
//                     <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
//                         <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//                         <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//                         <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//                     </div>

//                     {tab === "funds" && (
//                         <div className="space-y-6">
//                             <SectionTable title="Admin Credits (Manual Add & Bonus)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={adminCredits.map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                             <SectionTable title="Approved Deposits (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={userApprovedDeposits.map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                             <SectionTable title="Admin Debits (Manual Withdrawal)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={(fundHistory.debits || []).map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                             <SectionTable title="Withdrawal History (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={(fundHistory.withdrawals || []).map((r, i) => { const {date, time} = formatDateIST(r.date + ' ' + r.time); return [i + 1, INR(r.amount), r.remark, date, time, r.status]})} />
//                         </div>
//                     )}

//                     {tab === "bids" && (
//                         <SectionTable
//                             title="Bid History"
//                             headers={["#", "Game", "Type", "Session", "Open Digit", "Open Panna", "Close Digit", "Close Panna", "Points", "Status", "Date", "Time"]}
//                             rows={bidHistory.map((r, i) => {
//                                 const { date, time } = formatDateIST(r.time); // Use r.time as it's a full timestamp
//                                 return [
//                                     i + 1, r.game_name, r.game_type, r.session,
//                                     r.open_digit || '-', r.open_panna || '-',
//                                     r.close_digit || '-', r.close_panna || '-',
//                                     r.points, r.status, date, time,
//                                 ];
//                             })}
//                         />
//                     )}

//                     {tab === "winnings" && (
//                          <SectionTable
//                             title="Winning History Report"
//                             headers={["#", "Game", "Type", "Session", "Open Digit", "Open Panna", "Close Digit", "Close Panna", "Bet Points", "Won Points", "Date", "Time"]}
//                             rows={winningHistory.map((r, i) => {
//                                 const { date, time } = formatDateIST(r.date + ' ' + r.time);
//                                 return [
//                                     i + 1, r.game_name, r.game_type, r.session,
//                                     r.open_digit || '-', r.open_panna || '-',
//                                     r.close_digit || '-', r.close_panna || '-',
//                                     r.added_point, r.won_point, date, time,
//                                 ];
//                             })}
//                         />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// /* --------------------------- UI Sub-components --------------------------- */
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//     const tones: Record<string, string> = {
//         emerald: "from-emerald-50 to-white text-emerald-800", rose: "from-rose-50 to-white text-rose-800",
//         sky: "from-sky-50 to-white text-sky-800", amber: "from-amber-50 to-white text-amber-800",
//         slate: "from-slate-50 to-white text-slate-800",
//     };
//     return (<div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}><div className="text-sm font-medium text-slate-500">{title}</div><div className="mt-2 text-xl font-bold">{value}</div></div>);
// }
// function InfoRow({ label, value }: { label: string; value?: string }) {
//     return (<div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div></div>);
// }
// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//     return (<button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>);
// }
// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//     const hasRows = rows && rows.length > 0;
//     const isNumericColumn = (header: string) => ['Amount', 'Points', 'Digit', 'Panna'].some(keyword => header.includes(keyword));

//     return (
//         <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//                 <h4 className="text-base font-semibold">{title}</h4>
//                 <span className="text-xs text-slate-500">{hasRows ? `${rows.length} items` : "0 items"}</span>
//             </div>
//             <div className="overflow-x-auto">
//                 <table className="w-full min-w-[720px] border-collapse text-sm">
//                     <thead>
//                         <tr className="bg-slate-50 text-left text-slate-600">
//                             {headers.map((h) => (
//                                 <th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
//                             ))}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {hasRows ? (
//                             rows.map((row, idx) => (
//                                 <tr key={idx} className="hover:bg-slate-50 transition-colors">
//                                     {row.map((cell, i) => (
//                                         <td key={i} className={`border-b border-slate-100 px-3 py-2 whitespace-nowrap ${isNumericColumn(headers[i]) ? 'font-mono' : ''}`}>
//                                             {cell}
//                                         </td>
//                                     ))}
//                                 </tr>
//                             ))
//                         ) : (
//                             <tr>
//                                 <td className="px-3 py-8 text-center text-slate-500" colSpan={headers.length}>
//                                     इस सेक्शन में कोई डेटा उपलब्ध नहीं है
//                                 </td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }



// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import {
//     ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//     Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//     Power, PowerOff, Trash2, Eye, EyeOff, MessageSquare, Gift
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//     full_name: string;
//     email: string;
//     phone_number: string;
//     password: string;
//     creation_date: string;
//     last_login: string;
//     wallet_balance: number;
//     total_deposit: number;
//     total_withdraw: number;
//     total_bid: number;
//     total_winning: number;
//     status?: "active" | "inactive" | string;
//     bank_name?: string;
//     account_holder_name?: string;
//     account_number?: string;
//     ifsc_code?: string;
//     phonepe_number?: string;
//     gpay_number?: string;
//     paytm_number?: string;
// }

// interface FundHistoryItem {
//     amount: string;
//     remark: string;
//     date: string;
//     time: string;
//     status: string;
//     source?: string;
// }

// interface FundHistory {
//     credits: FundHistoryItem[];
//     debits: FundHistoryItem[];
//     requests: FundHistoryItem[];
//     withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//     game_name: string;
//     game_type: string;
//     session: string;
//     open_digit: string;
//     close_digit: string;
//     open_panna: string;
//     close_panna: string;
//     points: string;
//     status: string;
//     date: string;
//     time: string;
// }

// interface WinningHistoryItem {
//     game_name: string;
//     game_type: string;
//     session: string;
//     open_digit: string;
//     close_digit: string;
//     open_panna: string;
//     close_panna: string;
//     added_point: string;
//     won_point: string;
//     date: string;
//     time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//     const n = typeof v === "string" ? Number(v) : v;
//     if (isNaN(n)) return "₹0";
//     return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };

// const chip = (ok?: string) =>
//     ok === "active"
//         ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//         : "bg-rose-100 text-rose-700 border-rose-200";

// const formatDateIST = (rawDate: string | number) => {
//     if (!rawDate) return { date: "-", time: "-" };
//     try {
//         let formattedDate = String(rawDate);
//         if (formattedDate.includes(' ') && !formattedDate.endsWith('Z')) {
//             formattedDate = formattedDate.replace(' ', 'T') + 'Z';
//         } else if (!formattedDate.includes('T')) {
//             formattedDate = formattedDate + 'T00:00:00Z';
//         }
//         const date = new Date(formattedDate);
//         if (isNaN(date.getTime())) {
//             const parts = String(rawDate).split(' ');
//             return { date: parts[0] || "-", time: parts[1] || "-" };
//         }
//         const options: Intl.DateTimeFormatOptions = {
//             timeZone: 'Asia/Kolkata',
//             year: 'numeric', month: '2-digit', day: '2-digit',
//             hour: '2-digit', minute: '2-digit', second: '2-digit',
//             hour12: false
//         };
//         const formatter = new Intl.DateTimeFormat('en-CA', options);
//         const [datePart, timePart] = formatter.format(date).split(', ');
//         return { date: datePart, time: timePart };
//     } catch (e) {
//         return { date: "-", time: "-" };
//     }
// };

// const formatPhoneNumberForWhatsApp = (phone: string) => {
//     if (!phone) return "";
//     const cleaned = phone.replace(/\D/g, "");
//     if (cleaned.length === 10) {
//         return `91${cleaned}`;
//     }
//     return cleaned;
// };

// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//     const router = useRouter();
//     const userId = params.userId;

//     const [token, setToken] = useState<string | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [busy, setBusy] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     const [userData, setUserData] = useState<UserData | null>(null);
//     const [fundHistory, setFundHistory] = useState<FundHistory>({
//         credits: [], debits: [], requests: [], withdrawals: [],
//     });
//     const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//     const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//     const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");
//     const [amount, setAmount] = useState<string>("");

//     useEffect(() => {
//         const t = localStorage.getItem("token");
//         if (!t || t === "undefined" || t === "null") {
//             router.push("/login");
//             return;
//         }
//         setToken(t);
//     }, [router]);
    
//     const fetchAllData = async () => {
//         if (!token || !userId) return;
//         setLoading(true);
//         try {
//             await Promise.all([
//                 fetchUserData(),
//                 fetchFundHistory(),
//                 fetchBidHistory(),
//                 fetchWinningHistory(),
//             ]);
//         } catch (error) {
//             console.error("Failed to fetch all data", error);
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     useEffect(() => {
//         fetchAllData();
//     }, [token, userId]);

//     const fetchUserData = async () => {
//         if (!token) return;
//         const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//             headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
//         });
//         if (!res.ok) throw new Error("User fetch failed");
//         const data = await res.json();
//         setUserData(data);
//     };

//     const fetchFundHistory = async () => {
//         if (!token) return;
//         const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//             headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
//         });
//         if (!res.ok) throw new Error("Funds fetch failed");
//         const data = await res.json();
//         setFundHistory(data);
//     };

//     const fetchBidHistory = async () => {
//         if (!token) return;
//         const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//             headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
//         });
//         if (!res.ok) throw new Error("Bids fetch failed");
//         const data = await res.json();
//         setBidHistory(data);
//     };

//     const fetchWinningHistory = async () => {
//         if (!token) return;
//         const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//             headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
//         });
//         if (!res.ok) throw new Error("Winnings fetch failed");
//         const data = await res.json();
//         setWinningHistory(data);
//     };
    
//     const fundAction = async (amount: number, endpoint: string, body: object, successMessage: string, errorMessage: string) => {
//         if (isNaN(amount) || amount <= 0) {
//             alert("कृपया एक वैध राशि दर्ज करें।");
//             return;
//         }
//         try {
//             setBusy(true);
//             const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/${endpoint}`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                 body: JSON.stringify(body),
//             });
//             if (!res.ok) {
//                 const errData = await res.json();
//                 throw new Error(errData.error || errorMessage);
//             }
//             setAmount("");
//             await Promise.all([fetchUserData(), fetchFundHistory()]);
//             alert(successMessage);
//         } catch (e: any) {
//             console.error(e);
//             alert(e.message || errorMessage);
//         } finally {
//             setBusy(false);
//         }
//     };
    
//     const handleAddFunds = () => {
//         const n = parseFloat(amount);
//         fundAction(n, 'addfunds', { amount: n, source: 'admin' }, "फंड सफलतापूर्वक जोड़ दिया गया।", "फंड जोड़ने में विफल रहा।");
//     };
    
//     const handleAddBonus = () => {
//         const n = parseFloat(amount);
//         fundAction(n, 'addfunds', { amount: n, source: 'bonus' }, "बोनस सफलतापूर्वक जोड़ दिया गया।", "बोनस जोड़ने में विफल रहा।");
//     };

//     const handleWithdrawFunds = () => {
//         const n = parseFloat(amount);
//         if ((userData?.wallet_balance ?? 0) < n) {
//             alert("अपर्याप्त शेष राशि।");
//             return;
//         }
//         fundAction(n, 'withdrawfunds', { amount: n, remark: "Admin Debit" }, "फंड सफलतापूर्वक निकाल लिया गया।", "फंड निकालने में विफल रहा।");
//     };
    
//     const handleStatusChange = async () => {
//         if (!token || !userData?.status || !userId) return;
//         const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//         if (!window.confirm(`क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`)) return;
//         try {
//             setBusy(true);
//             await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//                 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({ userId, status: newStatus }),
//             });
//             alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//             await fetchUserData();
//         } catch (error) {
//             alert("स्टेटस अपडेट करने में विफल रहा।");
//         } finally {
//             setBusy(false);
//         }
//     };

//     const handleDeleteUser = async () => {
//         if (!token || !userId || !userData) return;
//         if (!window.confirm(`क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`)) return;
//         try {
//             setBusy(true);
//             await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//                 method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({ user_id: userId }),
//             });
//             alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//             router.push('/dashboard');
//         } catch (error) {
//             alert('उपयोगकर्ता को हटाने में विफल रहा।');
//         } finally {
//             setBusy(false);
//         }
//     };
    
//     const handleGoBack = () => router.push("/user-management");
//     const handleRefresh = () => fetchAllData();

//     const { adminCredits, userApprovedDeposits } = useMemo(() => {
//         const adminCredits = fundHistory.credits?.filter(c => c.source === 'admin' || c.source === 'bonus') || [];
//         const userApprovedDeposits = fundHistory.credits?.filter(c => c.source !== 'admin' && c.source !== 'bonus') || [];
//         return { adminCredits, userApprovedDeposits };
//     }, [fundHistory.credits]);

//     if (loading || !userData) {
//         return <div className="min-h-screen flex items-center justify-center bg-slate-100">...लोड हो रहा है</div>;
//     }
    
//     const whatsappMessage = encodeURIComponent(`Hello ${userData.full_name}, GD Matka से संपर्क करने के लिए धन्यवाद।`);

//     return (
//         <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//             <div className="mx-auto max-w-7xl space-y-6">
//                 {/* Sticky Header */}
//                 <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow backdrop-blur md:px-4 md:py-3">
//                     <div className="flex items-center gap-2 md:gap-3">
//                         <button onClick={handleGoBack} className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200" title="Back"><ArrowLeft className="h-4 w-4" /></button>
//                         <h2 className="text-lg font-semibold md:text-2xl">User Details - ID: {userId}</h2>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         {/* Status Change and Delete Buttons */}
//                         <button onClick={handleStatusChange} disabled={busy} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60 ${userData.status === 'active' ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
//                             {userData.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
//                             {userData.status === 'active' ? 'Deactivate' : 'Activate'}
//                         </button>
//                         <button onClick={handleDeleteUser} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"><Trash2 className="h-4 w-4" /> Delete</button>
//                         <button onClick={handleRefresh} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700" title="Refresh"><RefreshCw className="h-4 w-4" /><span className="hidden md:inline">Refresh</span></button>
//                     </div>
//                 </div>

//                 {/* Profile, Balance & Password Card */}
//                 <div className="grid gap-4 md:grid-cols-3">
//                     <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:col-span-2">
//                         <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//                             <div className="flex items-center gap-4">
//                                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100"><User2 className="h-9 w-9 text-slate-600" /></div>
//                                 <div>
//                                     <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                                     <div className="mt-1 flex items-center gap-2 text-sm">
//                                         <span className="font-medium text-slate-600">Password:</span>
//                                         <div className="flex items-center rounded-md bg-slate-100 px-2 py-1">
//                                             <span className="font-mono text-slate-800">{showPassword ? userData.password : "••••••••"}</span>
//                                             <button onClick={() => setShowPassword(!showPassword)} className="ml-2 rounded-full p-1 text-slate-500 hover:bg-slate-200" title={showPassword ? "Hide" : "Show"}>
//                                                 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="space-y-2 text-sm md:text-right">
//                                 <div className="flex items-center justify-start gap-2 md:justify-end">
//                                     {userData.status === "active" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
//                                     <span className="font-medium">Status:</span>
//                                     <span className={`rounded-full border px-2 py-0.5 text-xs ${chip(userData.status)}`}>{userData.status || "active"}</span>
//                                 </div>
//                                 <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                                     <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {userData.email || "-"}</span>
//                                     <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {userData.phone_number || "-"}</span>
//                                     <div className="flex items-center gap-1">
//                                         <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(userData.phone_number)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-1 text-green-600 transition hover:bg-green-100" title="Send WhatsApp"><MessageSquare className="h-5 w-5" /></a>
//                                         <a href={`tel:${userData.phone_number}`} className="rounded-full p-1 text-blue-600 transition hover:bg-blue-100" title="Call User"><Phone className="h-5 w-5" /></a>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="mt-4 grid gap-4 sm:grid-cols-2">
//                             <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Creation Date</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.creation_date).date || "-"}</div></div>
//                             <div className="rounded-xl bg-slate-50 p-3"><div className="text-sm text-slate-500">Last Login</div><div className="mt-0.5 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-slate-500" />{formatDateIST(userData.last_login).date || "-"}</div></div>
//                         </div>
//                     </div>
//                     <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//                         <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-600" /><h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4></div><ShieldCheck className="h-5 w-5 text-emerald-600/70" /></div>
//                         <div className="mt-2 text-2xl font-bold text-emerald-700">{INR(userData.wallet_balance || 0)}</div>
//                     </div>
//                 </div>

//                 {/* KPI Pills & Fund Management */}
//                 <div className="grid gap-4 lg:grid-cols-2">
//                     <div className="grid grid-cols-2 gap-4">
//                         <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//                         <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//                         <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//                         <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//                     </div>
//                     <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//                         <h3 className="text-lg font-semibold">Fund Management</h3>
//                         <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-2">
//                             <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center"><IndianRupee className="h-4 w-4 text-slate-400" /></span><input type="number" inputMode="decimal" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm outline-none ring-0 focus:border-blue-300" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
//                             <button onClick={handleAddFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Plus className="mr-1 h-4 w-4" /> Add</button>
//                             <button onClick={handleAddBonus} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"><Gift className="mr-1 h-4 w-4" /> Bonus</button>
//                             <button onClick={handleWithdrawFunds} disabled={busy} className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"><Minus className="mr-1 h-4 w-4" /> Withdraw</button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Payment Info */}
//                 <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//                     <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//                     <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
//                         <InfoRow label="Bank Name" value={userData.bank_name} />
//                         <InfoRow label="A/C Holder" value={userData.account_holder_name} />
//                         <InfoRow label="A/C Number" value={userData.account_number} />
//                         <InfoRow label="IFSC Code" value={userData.ifsc_code} />
//                         <InfoRow label="PhonePe" value={userData.phonepe_number} />
//                         <InfoRow label="GPay" value={userData.gpay_number} />
//                         <InfoRow label="Paytm" value={userData.paytm_number} />
//                     </div>
//                 </div>

//                 {/* History Tabs */}
//                 <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//                     <div className="mb-4 flex flex-wrap gap-2">
//                         <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//                         <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//                         <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//                     </div>

//                     {tab === "funds" && (
//                         <div className="space-y-6">
//                             <SectionTable title="Admin Credits (Manual Add & Bonus)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={adminCredits.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])} />
//                             <SectionTable title="Approved Deposits (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={userApprovedDeposits.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])} />
//                             <SectionTable title="Admin Debits (Manual Withdrawal)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={fundHistory.debits?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])} />
//                             <SectionTable title="Withdrawal History (User Initiated)" headers={["#", "Amount", "Remark", "Date", "Time", "Status"]} rows={fundHistory.withdrawals?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])} />
//                         </div>
//                     )}

//                     {tab === "bids" && <SectionTable title="Bid History" headers={["#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Points", "Status", "Date", "Time"]} rows={bidHistory.map((r, i) => [i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit, r.open_panna, r.close_panna, r.points, r.status, formatDateIST(r.time).date, formatDateIST(r.time).time])} />}
//                     {tab === "winnings" && <SectionTable title="Winning History Report" headers={["#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Added Point", "Won Point", "Date", "Time"]} rows={winningHistory.map((r, i) => [i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit, r.open_panna, r.close_panna, r.added_point, r.won_point, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time])} />}
//                 </div>
//             </div>
//         </div>
//     );
// }

// {/* --------------------------- UI Sub-components --------------------------- */ }
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//     const tones: Record<string, string> = {
//         emerald: "from-emerald-50 to-white text-emerald-800", rose: "from-rose-50 to-white text-rose-800",
//         sky: "from-sky-50 to-white text-sky-800", amber: "from-amber-50 to-white text-amber-800",
//         slate: "from-slate-50 to-white text-slate-800",
//     };
//     return (<div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}><div className="text-sm font-medium text-slate-500">{title}</div><div className="mt-2 text-xl font-bold">{value}</div></div>);
// }
// function InfoRow({ label, value }: { label: string; value?: string }) {
//     return (<div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div></div>);
// }
// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//     return (<button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>);
// }
// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//     const hasRows = rows && rows.length > 0;
//     return (<div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h4 className="text-base font-semibold">{title}</h4><span className="text-xs text-slate-500">{hasRows ? `${rows.length} items` : "0 items"}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600">{headers.map((h) => (<th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold">{h}</th>))}</tr></thead><tbody>{hasRows ? (rows.map((r, idx) => (<tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>{r.map((c, i) => (<td key={i} className="border-b border-slate-100 px-3 py-2">{c}</td>))}</tr>))) : (<tr><td className="px-3 py-6 text-center text-slate-500" colSpan={headers.length}>No data available in table</td></tr>)}</tbody></table></div></div>);
// }


// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//   Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//   Power, PowerOff, Trash2, Eye, EyeOff, MessageSquare // WhatsApp आइकॉन
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string; // <-- यह पहले से था, लेकिन अब UI में इस्तेमाल होगा
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: "active" | "inactive" | string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   // New UPI fields
//   phonepe_number?: string;
//   gpay_number?: string;
//   paytm_number?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//   const n = typeof v === "string" ? Number(v) : v;
//   if (isNaN(n)) return "₹0";
//   return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };

// const chip = (ok?: string) =>
//   ok === "active"
//     ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//     : "bg-rose-100 text-rose-700 border-rose-200";

// const formatDateIST = (rawDate: string | number) => {
//   if (!rawDate) return { date: "-", time: "-" };
//   try {
//     let formattedDate = String(rawDate);
//     // If it's a combined date-time string, add 'Z' to treat it as UTC
//     if (formattedDate.includes(' ') && !formattedDate.endsWith('Z')) {
//       formattedDate = formattedDate.replace(' ', 'T') + 'Z';
//     } else if (!formattedDate.includes('T')) {
//       // If only a date is provided, add time part and 'Z'
//       formattedDate = formattedDate + 'T00:00:00Z';
//     }
//     const date = new Date(formattedDate);

//     // Check if the date object is valid
//     if (isNaN(date.getTime())) {
//       // console.error("Invalid date string provided:", rawDate);
//       return { date: String(rawDate).split(' ')[0], time: String(rawDate).split(' ')[1] || "-" };
//     }

//     const options: Intl.DateTimeFormatOptions = {
//       timeZone: 'Asia/Kolkata',
//       year: 'numeric', month: '2-digit', day: '2-digit',
//       hour: '2-digit', minute: '2-digit', second: '2-digit',
//       hour12: false
//     };
//     const formatter = new Intl.DateTimeFormat('en-CA', options);
//     const [datePart, timePart] = formatter.format(date).split(', ');
//     return { date: datePart, time: timePart };
//   } catch (e) {
//     // console.error("Date formatting error:", e);
//     return { date: "-", time: "-" };
//   }
// };

// // WhatsApp लिंक के लिए फ़ोन नंबर को फॉर्मेट करने वाला हेल्पर फंक्शन
// const formatPhoneNumberForWhatsApp = (phone: string) => {
//   const cleaned = phone.replace(/\D/g, ""); // नंबर के अलावा सब कुछ हटा दें
//   if (cleaned.length === 10) {
//     return `91${cleaned}`; // 10 अंकों के नंबर के आगे 91 लगा दें
//   }
//   return cleaned; // अगर पहले से सही फॉर्मेट में है तो वैसे ही रहने दें
// };


// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const router = useRouter();
//   const userId = params.userId;

//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);

//   // New state for password visibility
//   const [showPassword, setShowPassword] = useState(false);

//   // DUMMY PASSWORD (यह आपके द्वारा प्रदान किए गए पासवर्ड से बदला जाएगा)
//   const DUMMY_PASSWORD_FROM_ADMIN = "********";

//   const [userData, setUserData] = useState<UserData>({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     password: DUMMY_PASSWORD_FROM_ADMIN, // <-- डमी/हार्डकोडेड पासवर्ड
//     creation_date: "",
//     last_login: "",
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     status: "active",
//     bank_name: "",
//     account_holder_name: "",
//     account_number: "",
//     ifsc_code: "",
//     phonepe_number: "",
//     gpay_number: "",
//     paytm_number: "",
//   });

//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: [],
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//   const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");

//   const [amount, setAmount] = useState<string>("");

//   {/* --------------------------- Token init --------------------------- */ }
//   useEffect(() => {
//     const t = localStorage.getItem("token");
//     if (!t || t === "undefined" || t === "null") {
//       router.push("/login");
//       return;
//     }
//     setToken(t);
//   }, [router]);

//   {/* ---------------------------- Fetchers ---------------------------- */ }
//   useEffect(() => {
//     if (!token || !userId) return;
//     (async () => {
//       setLoading(true);
//       await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//       setLoading(false);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("User fetch failed");
//     const data = await res.json();
    
//     // NOTE: आपको यहाँ अपने एडमिन सिस्टम से यूज़र का सही पासवर्ड सेट करना होगा।
//     // अगर API पासवर्ड नहीं देता है, तो इसे एक हार्डकोडेड/डिफ़ॉल्ट वैल्यू के रूप में सेट करें।
//     // यहाँ मैं मान रहा हूँ कि API से पासवर्ड आ रहा है, अन्यथा डमी रखें।
    
//     // अगर API से पासवर्ड नहीं आता है और आप इसे दिखाना चाहते हैं, तो यह मान लें कि यह कहीं और से मिलेगा।
//     // उदाहरण के लिए, मान लें कि User ID 1 का पासवर्ड 'Test@123' है:
//     let userPassword = data.password || DUMMY_PASSWORD_FROM_ADMIN;
//     if(data.user_id === "1") { 
//         // यह सिर्फ एक उदाहरण है, आपको सभी यूज़र्स के लिए लॉजिक जोड़ना होगा।
//         userPassword = "Test@123"; 
//     }

//     setUserData({ ...data, password: userPassword });
//   };

//   const fetchFundHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Funds fetch failed");
//     const data = await res.json();
//     setFundHistory(data);
//   };

//   const fetchBidHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Bids fetch failed");
//     const data = await res.json();
//     setBidHistory(data);
//   };

//   const fetchWinningHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Winnings fetch failed");
//     const data = await res.json();
//     setWinningHistory(data);
//   };

//   {/* -------------------------- Fund Actions -------------------------- */ }
//   const handleAddFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Add funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक जोड़ दिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     if ((userData.wallet_balance ?? 0) < n) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n, remark: "Admin Debit" }),
//       });
//       if (!res.ok) throw new Error("Withdraw funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक निकाल लिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectAdd = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Add 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectWithdraw = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1, remark: "Admin Debit" }),
//       });
//       if (!res.ok) throw new Error("Withdraw 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   {/* ---------------------- Status/Delete Actions ---------------------- */ }
//   const handleStatusChange = async () => {
//     if (!token || !userData.status || !userId) return;
//     const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//     const confirmAction = window.confirm(
//       `क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`
//     );
//     if (!confirmAction) return;
//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userId, status: newStatus }),
//       });
//       if (!response.ok) throw new Error('Failed to update status');
//       alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//       await fetchUserData(); // Refresh user data to show new status
//     } catch (error) {
//       console.error('Error updating status:', error);
//       alert("स्टेटस अपडेट करने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!token || !userId) return;
//     const confirmDelete = window.confirm(
//       `क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`
//     );
//     if (!confirmDelete) return;

//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ user_id: userId }),
//       });
//       if (!response.ok) throw new Error('Failed to delete user');
//       alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//       router.push('/dashboard'); // Redirect to dashboard after deletion
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       alert('उपयोगकर्ता को हटाने में विफल रहा।');
//     } finally {
//       setBusy(false);
//     }
//   };

//   {/* ------------------------------- Actions ------------------------------- */ }
//   const handleGoBack = () => router.push("/user-management"); // <- यूज़र लिस्ट पर वापस जाने के लिए
//   const handleRefresh = async () => {
//     setLoading(true);
//     await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//     setLoading(false);
//   };


//   {/* ------------------------------- Guards ------------------------------- */ }
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
//         <div className="rounded-xl bg-white/80 p-6 text-lg font-semibold shadow-md">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-100 p-4 md:p-6">
//         <div className="mx-auto max-w-7xl space-y-4">
//           <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-md">
//             <div className="flex items-center gap-2">
//               <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
//               <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//             </div>
//             <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
//           </div>
//           <div className="grid gap-4 md:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
//             ))}
//           </div>
//           <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
//           <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
//         </div>
//       </div>
//     );
//   }

//   // व्हाट्सएप मैसेज एनकोड करें
//   const whatsappMessage = encodeURIComponent(`Hello ${userData.full_name}, I am from GD Matka. Aapko game me koi problem hai kya?`);


//   {/* --------------------------------- UI ---------------------------------- */ }
//   return (
//     <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* Sticky Header */}
//         <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60 md:px-4 md:py-3">
//           <div className="flex items-center gap-2 md:gap-3">
//             <button
//               onClick={handleGoBack}
//               className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
//               title="Back"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-semibold md:text-2xl">User Details - ID: {userId}</h2>
//           </div>

//           {/* ACTIONS: Activate/Deactivate + Delete */}
//           <div className="flex items-center gap-2">
//             {userData.status === "active" ? (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
//                 title="Deactivate user"
//               >
//                 <PowerOff className="h-4 w-4" />
//                 Deactivate
//               </button>
//             ) : (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
//                 title="Activate user"
//               >
//                 <Power className="h-4 w-4" />
//                 Activate
//               </button>
//             )}

//             <button
//               onClick={handleDeleteUser}
//               disabled={busy}
//               className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               title="Delete user"
//             >
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </button>

//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
//               title="Refresh"
//             >
//               <RefreshCw className="h-4 w-4" />
//               <span className="hidden md:inline">Refresh</span>
//             </button>
//           </div>
//         </div>

//         {/* Profile, Balance & Password Card */}
//         <div className="grid gap-4 md:grid-cols-3">
//           {/* Main Profile Info */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:col-span-2">
//             <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//               <div className="flex items-center gap-4">
//                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100">
//                   <User2 className="h-9 w-9 text-slate-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                   {/* Password Field Added Here */}
//                   <div className="mt-1 flex items-center gap-2 text-sm">
//                     <span className="font-medium text-slate-600">Password:</span>
//                     <div className="flex items-center rounded-md bg-slate-100 px-2 py-1">
//                       <span className="font-mono text-slate-800">
//                         {showPassword ? userData.password : "••••••••"}
//                       </span>
//                       <button
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="ml-2 rounded-full p-1 text-slate-500 hover:bg-slate-200"
//                         title={showPassword ? "Hide Password" : "Show Password"}
//                       >
//                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2 text-sm md:text-right">
//                 <div className="flex items-center justify-start gap-2 md:justify-end">
//                   {userData.status === "active" ? (
//                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//                   ) : (
//                     <XCircle className="h-4 w-4 text-rose-600" />
//                   )}
//                   <span className="font-medium">Status:</span>
//                   <span className={`rounded-full border px-2 py-0.5 text-xs ${chip(userData.status)}`}>
//                     {userData.status || "active"}
//                   </span>
//                 </div>
//                 {/* Contact and Direct Actions */}
//                 <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                     <span className="inline-flex items-center gap-1">
//                       <Mail className="h-4 w-4" /> {userData.email || "-"}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <Phone className="h-4 w-4" /> {userData.phone_number || "-"}
//                     </span>
//                     {/* Direct Contact Buttons Added Here */}
//                     <div className="flex items-center gap-1">
//                       {/* WhatsApp Button */}
//                       <a
//                           href={`https://wa.me/${formatPhoneNumberForWhatsApp(
//                               userData.phone_number
//                           )}?text=${whatsappMessage}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="rounded-full p-1 text-green-600 transition hover:bg-green-100"
//                           title="Send WhatsApp Message"
//                       >
//                           <MessageSquare className="h-5 w-5" />
//                       </a>
//                       {/* Call Button */}
//                       <a
//                           href={`tel:${userData.phone_number}`}
//                           className="rounded-full p-1 text-blue-600 transition hover:bg-blue-100"
//                           title="Call User"
//                       >
//                           <Phone className="h-5 w-5" />
//                       </a>
//                     </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 grid gap-4 sm:grid-cols-2">
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Creation Date</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {formatDateIST(userData.creation_date).date || "-"}
//                 </div>
//               </div>
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Last Login</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {formatDateIST(userData.last_login).date || "-"}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Balance Card with quick +/- */}
//           <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Wallet className="h-5 w-5 text-emerald-600" />
//                 <h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4>
//               </div>
//               <ShieldCheck className="h-5 w-5 text-emerald-600/70" />
//             </div>
//             <div className="mt-2 text-2xl font-bold text-emerald-700">
//               {INR(Number(userData.wallet_balance || 0))}
//             </div>
//             <div className="mt-3 flex items-center gap-2">
//               <button
//                 onClick={handleDirectWithdraw}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               >
//                 <Minus className="mr-1 h-4 w-4" /> 1
//               </button>
//               <button
//                 onClick={handleDirectAdd}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
//               >
//                 <Plus className="mr-1 h-4 w-4" /> 1
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* KPI Pills */}
//         <div className="grid gap-4 md:grid-cols-4">
//           <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//           <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//           <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//           <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//         </div>

//         {/* Payment Info + Fund Manager */}
//         <div className="grid gap-4 lg:grid-cols-3">

//           {/* Payment Info */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//             <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//             <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
//               {/* बैंक डिटेल्स */}
//               <InfoRow label="Bank Name" value={userData.bank_name} />
//               <InfoRow label="A/C Holder Name" value={userData.account_holder_name} />
//               <InfoRow label="A/C Number" value={userData.account_number} />
//               <InfoRow label="IFSC Code" value={userData.ifsc_code} />

//               {/* UPI डिटेल्स */}
//               <InfoRow label="PhonePe Number" value={userData.phonepe_number} />
//               <InfoRow label="GPay Number" value={userData.gpay_number} />
//               <InfoRow label="Paytm Number" value={userData.paytm_number} />
//             </div>
//           </div>


//           {/* Fund Management */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur lg:col-span-2">
//             <h3 className="text-lg font-semibold">Fund Management</h3>
//             <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
//               <div className="relative">
//                 <span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center">
//                   <IndianRupee className="h-4 w-4 text-slate-400" />
//                 </span>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm outline-none ring-0 focus:border-blue-300"
//                   placeholder="Enter amount"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                 />
//               </div>
//               <button
//                 onClick={handleAddFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
//               >
//                 Add Funds
//               </button>
//               <button
//                 onClick={handleWithdrawFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* History Tabs */}
//         <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//           <div className="mb-4 flex flex-wrap gap-2">
//             <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//             <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//             <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//           </div>

//           {tab === "funds" && (
//             <div className="space-y-6">
//               <SectionTable
//                 title="Fund Credit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.credits?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//               <SectionTable
//                 title="Fund Debit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.debits?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//               <SectionTable
//                 title="Add Fund Request (UPI)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.requests?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//               <SectionTable
//                 title="Withdraw Fund"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.withdrawals?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//             </div>
//           )}

//           {tab === "bids" && (
//             <SectionTable
//               title="Bid History"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Points", "Status", "Date", "Time",
//               ]}
//               rows={bidHistory.map((r, i) => [
//                 i + 1,
//                 r.game_name,
//                 r.game_type,
//                 r.session,
//                 r.open_digit,
//                 r.close_digit,
//                 r.open_panna,
//                 r.close_panna,
//                 r.points,
//                 r.status,
//                 // bidHistory में r.time को सही किया गया है
//                 formatDateIST(r.time).date,
//                 formatDateIST(r.time).time,
//               ])}
//             />
//           )}

//           {tab === "winnings" && (
//             <SectionTable
//               title="Winning History Report"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Added Point", "Won Point", "Date", "Time",
//               ]}
//               rows={winningHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.added_point, r.won_point, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time,
//               ])}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// {/* --------------------------- UI Sub-components --------------------------- */ }
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//   const tones: Record<string, string> = {
//     emerald: "from-emerald-50 to-white text-emerald-800",
//     rose: "from-rose-50 to-white text-rose-800",
//     sky: "from-sky-50 to-white text-sky-800",
//     amber: "from-amber-50 to-white text-amber-800",
//     slate: "from-slate-50 to-white text-slate-800",
//   };
//   return (
//     <div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}>
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-medium text-slate-500">{title}</div>
//       </div>
//       <div className="mt-2 text-xl font-bold">{value}</div>
//     </div>
//   );
// }

// function InfoRow({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2">
//       <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
//       <div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div>
//     </div>
//   );
// }

// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//         }`}
//     >
//       {label}
//     </button>
//   );
// }

// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//   const hasRows = rows && rows.length > 0;
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//         <h4 className="text-base font-semibold">{title}</h4>
//         <span className="text-xs text-slate-500">{hasRows ? `${rows!.length} items` : "0 items"}</span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[720px] border-collapse text-sm">
//           <thead>
//             <tr className="bg-slate-50 text-left text-slate-600">
//               {headers.map((h) => (
//                 <th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {hasRows ? (
//               rows!.map((r, idx) => (
//                 <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
//                   {r.map((c, i) => (
//                     <td key={i} className="border-b border-slate-100 px-3 py-2">
//                       {c}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td className="px-3 py-6 text-center text-slate-500" colSpan={headers.length}>
//                   No data available in table
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//   Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//   Power, PowerOff, Trash2, AlertTriangle
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: "active" | "inactive" | string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   // New UPI fields
//   phonepe_number?: string;
//   gpay_number?: string;
//   paytm_number?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//   const n = typeof v === "string" ? Number(v) : v;
//   if (isNaN(n)) return "₹0";
//   return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };

// const chip = (ok?: string) =>
//   ok === "active"
//     ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//     : "bg-rose-100 text-rose-700 border-rose-200";

// const formatDateIST = (rawDate: string | number) => {
//   if (!rawDate) return { date: "-", time: "-" };
//   try {
//     let formattedDate = String(rawDate);
//     // If it's a combined date-time string, add 'Z' to treat it as UTC
//     if (formattedDate.includes(' ') && !formattedDate.endsWith('Z')) {
//       formattedDate = formattedDate.replace(' ', 'T') + 'Z';
//     } else if (!formattedDate.includes('T')) {
//       // If only a date is provided, add time part and 'Z'
//       formattedDate = formattedDate + 'T00:00:00Z';
//     }
//     const date = new Date(formattedDate);

//     // Check if the date object is valid
//     if (isNaN(date.getTime())) {
//       console.error("Invalid date string provided:", rawDate);
//       return { date: String(rawDate).split(' ')[0], time: String(rawDate).split(' ')[1] || "-" };
//     }

//     const options: Intl.DateTimeFormatOptions = {
//       timeZone: 'Asia/Kolkata',
//       year: 'numeric', month: '2-digit', day: '2-digit',
//       hour: '2-digit', minute: '2-digit', second: '2-digit',
//       hour12: false
//     };
//     const formatter = new Intl.DateTimeFormat('en-CA', options);
//     const [datePart, timePart] = formatter.format(date).split(', ');
//     return { date: datePart, time: timePart };
//   } catch (e) {
//     console.error("Date formatting error:", e);
//     return { date: "-", time: "-" };
//   }
// };


// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const router = useRouter();
//   const userId = params.userId;

//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);

//   const [userData, setUserData] = useState<UserData>({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     password: "",
//     creation_date: "",
//     last_login: "",
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     status: "active",
//     bank_name: "",
//     account_holder_name: "",
//     account_number: "",
//     ifsc_code: "",
//     phonepe_number: "",
//     gpay_number: "",
//     paytm_number: "",
//   });

//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: [],
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//   const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");

//   const [amount, setAmount] = useState<string>("");

//   // Confirmation modal state
//   const [confirmOpen, setConfirmOpen] = useState<null | { type: "deactivate" | "activate" | "delete"; title: string; desc: string }>(null);

//   {/* --------------------------- Token init --------------------------- */ }
//   useEffect(() => {
//     const t = localStorage.getItem("token");
//     if (!t || t === "undefined" || t === "null") {
//       router.push("/login");
//       return;
//     }
//     setToken(t);
//   }, [router]);

//   {/* ---------------------------- Fetchers ---------------------------- */ }
//   useEffect(() => {
//     if (!token || !userId) return;
//     (async () => {
//       setLoading(true);
//       await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//       setLoading(false);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("User fetch failed");
//     const data = await res.json();
//     setUserData(data);
//   };

//   const fetchFundHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Funds fetch failed");
//     const data = await res.json();
//     setFundHistory(data);
//   };

//   const fetchBidHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Bids fetch failed");
//     const data = await res.json();
//     setBidHistory(data);
//   };

//   const fetchWinningHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Winnings fetch failed");
//     const data = await res.json();
//     setWinningHistory(data);
//   };

//   {/* -------------------------- Fund Actions -------------------------- */ }
//   const handleAddFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Add funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक जोड़ दिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     if ((userData.wallet_balance ?? 0) < n) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n, remark: "Admin Debit" }),
//       });
//       if (!res.ok) throw new Error("Withdraw funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक निकाल लिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectAdd = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Add 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectWithdraw = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1, remark: "Admin Debit" }),
//       });
//       if (!res.ok) throw new Error("Withdraw 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   {/* ---------------------- Status/Delete Actions ---------------------- */ }
//   const handleStatusChange = async () => {
//     if (!token || !userData.status || !userId) return;
//     const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//     const confirmAction = window.confirm(
//       `क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`
//     );
//     if (!confirmAction) return;
//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userId, status: newStatus }),
//       });
//       if (!response.ok) throw new Error('Failed to update status');
//       alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//       await fetchUserData(); // Refresh user data to show new status
//     } catch (error) {
//       console.error('Error updating status:', error);
//       alert("स्टेटस अपडेट करने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!token || !userId) return;
//     const confirmDelete = window.confirm(
//       `क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`
//     );
//     if (!confirmDelete) return;

//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ user_id: userId }),
//       });
//       if (!response.ok) throw new Error('Failed to delete user');
//       alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//       router.push('/dashboard'); // Redirect to dashboard after deletion
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       alert('उपयोगकर्ता को हटाने में विफल रहा।');
//     } finally {
//       setBusy(false);
//     }
//   };

//   {/* ------------------------------- Actions ------------------------------- */ }
//   const handleGoBack = () => router.push("/dashboard"); // <- यहाँ बदलाव किया गया है
//   const handleRefresh = async () => {
//     setLoading(true);
//     await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//     setLoading(false);
//   };


//   {/* ------------------------------- Guards ------------------------------- */ }
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
//         <div className="rounded-xl bg-white/80 p-6 text-lg font-semibold shadow-md">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-100 p-4 md:p-6">
//         <div className="mx-auto max-w-7xl space-y-4">
//           <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-md">
//             <div className="flex items-center gap-2">
//               <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
//               <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//             </div>
//             <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
//           </div>
//           <div className="grid gap-4 md:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
//             ))}
//           </div>
//           <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
//           <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
//         </div>
//       </div>
//     );
//   }

//   {/* --------------------------------- UI ---------------------------------- */ }
//   return (
//     <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* Sticky Header */}
//         <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60 md:px-4 md:py-3">
//           <div className="flex items-center gap-2 md:gap-3">
//             <button
//               onClick={handleGoBack}
//               className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
//               title="Back"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-semibold md:text-2xl">User Details</h2>
//           </div>

//           {/* ACTIONS: Activate/Deactivate + Delete */}
//           <div className="flex items-center gap-2">
//             {userData.status === "active" ? (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
//                 title="Deactivate user"
//               >
//                 <PowerOff className="h-4 w-4" />
//                 Deactivate
//               </button>
//             ) : (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
//                 title="Activate user"
//               >
//                 <Power className="h-4 w-4" />
//                 Activate
//               </button>
//             )}

//             <button
//               onClick={handleDeleteUser}
//               disabled={busy}
//               className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               title="Delete user"
//             >
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </button>

//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
//               title="Refresh"
//             >
//               <RefreshCw className="h-4 w-4" />
//               <span className="hidden md:inline">Refresh</span>
//             </button>
//           </div>
//         </div>

//         {/* Profile (NO security password) */}
//         <div className="grid gap-4 md:grid-cols-3">
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:col-span-2">
//             <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//               <div className="flex items-center gap-4">
//                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100">
//                   <User2 className="h-9 w-9 text-slate-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                   <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                     <span className="inline-flex items-center gap-1">
//                       <Mail className="h-4 w-4" /> {userData.email || "-"}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <Phone className="h-4 w-4" /> {userData.phone_number || "-"}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   {userData.status === "active" ? (
//                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//                   ) : (
//                     <XCircle className="h-4 w-4 text-rose-600" />
//                   )}
//                   <span className="font-medium">Status:</span>
//                   <span className={`rounded-full border px-2 py-0.5 text-xs ${chip(userData.status)}`}>
//                     {userData.status || "active"}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 grid gap-4 sm:grid-cols-2">
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Creation Date</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {formatDateIST(userData.creation_date).date || "-"}
//                 </div>
//               </div>
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Last Login</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {formatDateIST(userData.last_login).date || "-"}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Balance Card with quick +/- */}
//           <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Wallet className="h-5 w-5 text-emerald-600" />
//                 <h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4>
//               </div>
//               <ShieldCheck className="h-5 w-5 text-emerald-600/70" />
//             </div>
//             <div className="mt-2 text-2xl font-bold text-emerald-700">
//               {INR(Number(userData.wallet_balance || 0))}
//             </div>
//             <div className="mt-3 flex items-center gap-2">
//               <button
//                 onClick={handleDirectWithdraw}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               >
//                 <Minus className="mr-1 h-4 w-4" /> 1
//               </button>
//               <button
//                 onClick={handleDirectAdd}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
//               >
//                 <Plus className="mr-1 h-4 w-4" /> 1
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* KPI Pills */}
//         <div className="grid gap-4 md:grid-cols-4">
//           <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//           <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//           <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//           <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//         </div>

//         {/* Payment Info + Fund Manager */}
//         <div className="grid gap-4 lg:grid-cols-3">

//           {/* Payment Info -- UPDATED SECTION */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//             <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//             <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
//               {/* बैंक डिटेल्स */}
//               <InfoRow label="Bank Name" value={userData.bank_name} />
//               <InfoRow label="A/C Holder Name" value={userData.account_holder_name} />
//               <InfoRow label="A/C Number" value={userData.account_number} />
//               <InfoRow label="IFSC Code" value={userData.ifsc_code} />

//               {/* UPI डिटेल्स */}
//               <InfoRow label="PhonePe Number" value={userData.phonepe_number} />
//               <InfoRow label="GPay Number" value={userData.gpay_number} />
//               <InfoRow label="Paytm Number" value={userData.paytm_number} />
//             </div>
//           </div>


//           {/* Fund Management */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur lg:col-span-2">
//             <h3 className="text-lg font-semibold">Fund Management</h3>
//             <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
//               <div className="relative">
//                 <span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center">
//                   <IndianRupee className="h-4 w-4 text-slate-400" />
//                 </span>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm outline-none ring-0 focus:border-blue-300"
//                   placeholder="Enter amount"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                 />
//               </div>
//               <button
//                 onClick={handleAddFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
//               >
//                 Add Funds
//               </button>
//               <button
//                 onClick={handleWithdrawFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* History Tabs */}
//         <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//           <div className="mb-4 flex flex-wrap gap-2">
//             <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//             <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//             <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//           </div>

//           {tab === "funds" && (
//             <div className="space-y-6">
//               <SectionTable
//                 title="Fund Credit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.credits?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//               <SectionTable
//                 title="Fund Debit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.debits?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//               <SectionTable
//                 title="Add Fund Request (UPI)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.requests?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//               <SectionTable
//                 title="Withdraw Fund"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.withdrawals?.map((r, i) => [i + 1, INR(r.amount), r.remark, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time, r.status])}
//               />
//             </div>
//           )}

//           {tab === "bids" && (
//             <SectionTable
//               title="Bid History"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Points", "Status", "Date", "Time",
//               ]}
//               rows={bidHistory.map((r, i) => [
//                 i + 1,
//                 r.game_name,
//                 r.game_type,
//                 r.session,
//                 r.open_digit,
//                 r.close_digit,
//                 r.open_panna,
//                 r.close_panna,
//                 r.points,
//                 r.status,
//                 // यहां तारीख और समय को सही किया गया है
//                 new Date(r.time).toLocaleDateString(),
//                 new Date(r.time).toLocaleTimeString(),
//               ])}
//             />
//           )}

//           {tab === "winnings" && (
//             <SectionTable
//               title="Winning History Report"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Added Point", "Won Point", "Date", "Time",
//               ]}
//               rows={winningHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.added_point, r.won_point, formatDateIST(r.date + ' ' + r.time).date, formatDateIST(r.date + ' ' + r.time).time,
//               ])}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// {/* --------------------------- UI Sub-components --------------------------- */ }
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//   const tones: Record<string, string> = {
//     emerald: "from-emerald-50 to-white text-emerald-800",
//     rose: "from-rose-50 to-white text-rose-800",
//     sky: "from-sky-50 to-white text-sky-800",
//     amber: "from-amber-50 to-white text-amber-800",
//     slate: "from-slate-50 to-white text-slate-800",
//   };
//   return (
//     <div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}>
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-medium text-slate-500">{title}</div>
//       </div>
//       <div className="mt-2 text-xl font-bold">{value}</div>
//     </div>
//   );
// }

// function InfoRow({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2">
//       <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
//       <div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div>
//     </div>
//   );
// }

// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//         }`}
//     >
//       {label}
//     </button>
//   );
// }

// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//   const hasRows = rows && rows.length > 0;
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//         <h4 className="text-base font-semibold">{title}</h4>
//         <span className="text-xs text-slate-500">{hasRows ? `${rows!.length} items` : "0 items"}</span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[720px] border-collapse text-sm">
//           <thead>
//             <tr className="bg-slate-50 text-left text-slate-600">
//               {headers.map((h) => (
//                 <th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {hasRows ? (
//               rows!.map((r, idx) => (
//                 <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
//                   {r.map((c, i) => (
//                     <td key={i} className="border-b border-slate-100 px-3 py-2">
//                       {c}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td className="px-3 py-6 text-center text-slate-500" colSpan={headers.length}>
//                   No data available in table
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//   Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//   Power, PowerOff, Trash2, AlertTriangle
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: "active" | "inactive" | string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   // New UPI fields
//   phonepe_number?: string;
//   gpay_number?: string;
//   paytm_number?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//   const n = typeof v === "string" ? Number(v) : v;
//   if (isNaN(n)) return "₹0";
//   return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };
// const chip = (ok?: string) =>
//   ok === "active"
//     ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//     : "bg-rose-100 text-rose-700 border-rose-200";

// // नया हेल्पर फंक्शन: UTC टाइमस्टैम्प को IST में बदलता है
// const formatDateIST = (rawDate: string | number) => {
//   if (!rawDate) return { date: "-", time: "-" };
//   try {
//     const date = new Date(rawDate);
//     const options: Intl.DateTimeFormatOptions = {
//       timeZone: 'Asia/Kolkata',
//       year: 'numeric', month: '2-digit', day: '2-digit',
//       hour: '2-digit', minute: '2-digit', second: '2-digit',
//       hour12: false
//     };
//     const formatter = new Intl.DateTimeFormat('en-CA', options);
//     const [datePart, timePart] = formatter.format(date).split(', ');
//     return { date: datePart, time: timePart };
//   } catch (e) {
//     console.error("Date formatting error:", e);
//     return { date: "-", time: "-" };
//   }
// };


// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const router = useRouter();
//   const userId = params.userId;

//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);

//   const [userData, setUserData] = useState<UserData>({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     password: "",
//     creation_date: "",
//     last_login: "",
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     status: "active",
//     bank_name: "",
//     account_holder_name: "",
//     account_number: "",
//     ifsc_code: "",
//     phonepe_number: "",
//     gpay_number: "",
//     paytm_number: "",
//   });

//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: [],
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//   const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");

//   const [amount, setAmount] = useState<string>("");

//   // Confirmation modal state
//   const [confirmOpen, setConfirmOpen] = useState<null | { type: "deactivate" | "activate" | "delete"; title: string; desc: string }>(null);

//   /* --------------------------- Token init --------------------------- */
//   useEffect(() => {
//     const t = localStorage.getItem("token");
//     if (!t || t === "undefined" || t === "null") {
//       router.push("/login");
//       return;
//     }
//     setToken(t);
//   }, [router]);

//   /* ---------------------------- Fetchers ---------------------------- */
//   useEffect(() => {
//     if (!token || !userId) return;
//     (async () => {
//       setLoading(true);
//       await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//       setLoading(false);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("User fetch failed");
//     const data = await res.json();
//     setUserData(data);
//   };

//   const fetchFundHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Funds fetch failed");
//     const data = await res.json();
//     setFundHistory(data);
//   };

//   const fetchBidHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Bids fetch failed");
//     const data = await res.json();
//     setBidHistory(data);
//   };

//   const fetchWinningHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Winnings fetch failed");
//     const data = await res.json();
//     setWinningHistory(data);
//   };

//   /* -------------------------- Fund Actions -------------------------- */
//   const handleAddFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Add funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक जोड़ दिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     if ((userData.wallet_balance ?? 0) < n) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Withdraw funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक निकाल लिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectAdd = async () => {
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Add 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectWithdraw = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Withdraw 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ---------------------- Status/Delete Actions ---------------------- */
//   const handleStatusChange = async () => {
//     if (!token || !userData.status || !userId) return;
//     const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//     const confirmAction = window.confirm(
//       `क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`
//     );
//     if (!confirmAction) return;
//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userId, status: newStatus }),
//       });
//       if (!response.ok) throw new Error('Failed to update status');
//       alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//       await fetchUserData(); // Refresh user data to show new status
//     } catch (error) {
//       console.error('Error updating status:', error);
//       alert("स्टेटस अपडेट करने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!token || !userId) return;
//     const confirmDelete = window.confirm(
//       `क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`
//     );
//     if (!confirmDelete) return;

//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ user_id: userId }),
//       });
//       if (!response.ok) throw new Error('Failed to delete user');
//       alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//       router.push('/user-management'); // Redirect to user list after deletion
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       alert('उपयोगकर्ता को हटाने में विफल रहा।');
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ------------------------------- Actions ------------------------------- */
//   const handleGoBack = () => router.push("/user-management");
//   const handleRefresh = async () => {
//     setLoading(true);
//     await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//     setLoading(false);
//   };


//   /* ------------------------------- Guards ------------------------------- */
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
//         <div className="rounded-xl bg-white/80 p-6 text-lg font-semibold shadow-md">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-100 p-4 md:p-6">
//         <div className="mx-auto max-w-7xl space-y-4">
//           <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-md">
//             <div className="flex items-center gap-2">
//               <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
//               <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//             </div>
//             <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
//           </div>
//           <div className="grid gap-4 md:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
//             ))}
//           </div>
//           <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
//           <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
//         </div>
//       </div>
//     );
//   }

//   /* --------------------------------- UI ---------------------------------- */
//   return (
//     <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* Sticky Header */}
//         <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60 md:px-4 md:py-3">
//           <div className="flex items-center gap-2 md:gap-3">
//             <button
//               onClick={handleGoBack}
//               className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
//               title="Back"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-semibold md:text-2xl">User Details</h2>
//           </div>

//           {/* ACTIONS: Activate/Deactivate + Delete */}
//           <div className="flex items-center gap-2">
//             {userData.status === "active" ? (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
//                 title="Deactivate user"
//               >
//                 <PowerOff className="h-4 w-4" />
//                 Deactivate
//               </button>
//             ) : (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
//                 title="Activate user"
//               >
//                 <Power className="h-4 w-4" />
//                 Activate
//               </button>
//             )}

//             <button
//               onClick={handleDeleteUser}
//               disabled={busy}
//               className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               title="Delete user"
//             >
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </button>

//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
//               title="Refresh"
//             >
//               <RefreshCw className="h-4 w-4" />
//               <span className="hidden md:inline">Refresh</span>
//             </button>
//           </div>
//         </div>

//         {/* Profile (NO security password) */}
//         <div className="grid gap-4 md:grid-cols-3">
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:col-span-2">
//             <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//               <div className="flex items-center gap-4">
//                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100">
//                   <User2 className="h-9 w-9 text-slate-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                   <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                     <span className="inline-flex items-center gap-1">
//                       <Mail className="h-4 w-4" /> {userData.email || "-"}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <Phone className="h-4 w-4" /> {userData.phone_number || "-"}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   {userData.status === "active" ? (
//                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//                   ) : (
//                     <XCircle className="h-4 w-4 text-rose-600" />
//                   )}
//                   <span className="font-medium">Status:</span>
//                   <span className={`rounded-full border px-2 py-0.5 text-xs ${chip(userData.status)}`}>
//                     {userData.status || "active"}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 grid gap-4 sm:grid-cols-2">
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Creation Date</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {userData.creation_date || "-"}
//                 </div>
//               </div>
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Last Login</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {userData.last_login || "-"}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Balance Card with quick +/- */}
//           <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Wallet className="h-5 w-5 text-emerald-600" />
//                 <h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4>
//               </div>
//               <ShieldCheck className="h-5 w-5 text-emerald-600/70" />
//             </div>
//             <div className="mt-2 text-2xl font-bold text-emerald-700">
//               {INR(Number(userData.wallet_balance || 0))}
//             </div>
//             <div className="mt-3 flex items-center gap-2">
//               <button
//                 onClick={handleDirectWithdraw}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               >
//                 <Minus className="mr-1 h-4 w-4" /> 1
//               </button>
//               <button
//                 onClick={handleDirectAdd}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
//               >
//                 <Plus className="mr-1 h-4 w-4" /> 1
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* KPI Pills */}
//         <div className="grid gap-4 md:grid-cols-4">
//           <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//           <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//           <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//           <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//         </div>

//         {/* Payment Info + Fund Manager */}
//         <div className="grid gap-4 lg:grid-cols-3">

//           {/* Payment Info -- UPDATED SECTION */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//             <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//             <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
//               {/* बैंक डिटेल्स */}
//               <InfoRow label="Bank Name" value={userData.bank_name} />
//               <InfoRow label="A/C Holder Name" value={userData.account_holder_name} />
//               <InfoRow label="A/C Number" value={userData.account_number} />
//               <InfoRow label="IFSC Code" value={userData.ifsc_code} />

//               {/* UPI डिटेल्स */}
//               <InfoRow label="PhonePe Number" value={userData.phonepe_number} />
//               <InfoRow label="GPay Number" value={userData.gpay_number} />
//               <InfoRow label="Paytm Number" value={userData.paytm_number} />
//             </div>
//           </div>


//           {/* Fund Management */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur lg:col-span-2">
//             <h3 className="text-lg font-semibold">Fund Management</h3>
//             <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
//               <div className="relative">
//                 <span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center">
//                   <IndianRupee className="h-4 w-4 text-slate-400" />
//                 </span>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm outline-none ring-0 focus:border-blue-300"
//                   placeholder="Enter amount"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                 />
//               </div>
//               <button
//                 onClick={handleAddFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
//               >
//                 Add Funds
//               </button>
//               <button
//                 onClick={handleWithdrawFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* History Tabs */}
//         <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//           <div className="mb-4 flex flex-wrap gap-2">
//             <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//             <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//             <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//           </div>

//           {tab === "funds" && (
//             <div className="space-y-6">
//               <SectionTable
//                 title="Fund Credit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.credits?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Fund Debit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.debits?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Add Fund Request (UPI)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.requests?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Withdraw Fund"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.withdrawals?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//             </div>
//           )}

//           {tab === "bids" && (
//             <SectionTable
//               title="Bid History"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Points", "Status", "Date", "Time",
//               ]}
//               rows={bidHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.points, r.status, r.date, r.time,
//               ])}
//             />
//           )}

//           {tab === "winnings" && (
//             <SectionTable
//               title="Winning History Report"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Added Point", "Won Point", "Date", "Time",
//               ]}
//               rows={winningHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.added_point, r.won_point, r.date, r.time,
//               ])}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* --------------------------- UI Sub-components --------------------------- */
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//   const tones: Record<string, string> = {
//     emerald: "from-emerald-50 to-white text-emerald-800",
//     rose: "from-rose-50 to-white text-rose-800",
//     sky: "from-sky-50 to-white text-sky-800",
//     amber: "from-amber-50 to-white text-amber-800",
//     slate: "from-slate-50 to-white text-slate-800",
//   };
//   return (
//     <div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}>
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-medium text-slate-500">{title}</div>
//       </div>
//       <div className="mt-2 text-xl font-bold">{value}</div>
//     </div>
//   );
// }

// function InfoRow({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2">
//       <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
//       <div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div>
//     </div>
//   );
// }

// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//         }`}
//     >
//       {label}
//     </button>
//   );
// }

// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//   const hasRows = rows && rows.length > 0;
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//         <h4 className="text-base font-semibold">{title}</h4>
//         <span className="text-xs text-slate-500">{hasRows ? `${rows!.length} items` : "0 items"}</span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[720px] border-collapse text-sm">
//           <thead>
//             <tr className="bg-slate-50 text-left text-slate-600">
//               {headers.map((h) => (
//                 <th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {hasRows ? (
//               rows!.map((r, idx) => (
//                 <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
//                   {r.map((c, i) => (
//                     <td key={i} className="border-b border-slate-100 px-3 py-2">
//                       {c}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td className="px-3 py-6 text-center text-slate-500" colSpan={headers.length}>
//                   No data available in table
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//   Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//   Power, PowerOff, Trash2, AlertTriangle
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: "active" | "inactive" | string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   // New UPI fields
//   phonepe_number?: string;
//   gpay_number?: string;
//   paytm_number?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//   const n = typeof v === "string" ? Number(v) : v;
//   if (isNaN(n)) return "₹0";
//   return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };
// const chip = (ok?: string) =>
//   ok === "active"
//     ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//     : "bg-rose-100 text-rose-700 border-rose-200";

// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const router = useRouter();
//   const userId = params.userId;

//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);

//   const [userData, setUserData] = useState<UserData>({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     password: "",
//     creation_date: "",
//     last_login: "",
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     status: "active",
//     bank_name: "",
//     account_holder_name: "",
//     account_number: "",
//     ifsc_code: "",
//     phonepe_number: "",
//     gpay_number: "",
//     paytm_number: "",
//   });

//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: [],
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//   const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");

//   const [amount, setAmount] = useState<string>("");

//   // Confirmation modal state
//   const [confirmOpen, setConfirmOpen] = useState<null | { type: "deactivate" | "activate" | "delete"; title: string; desc: string }>(null);

//   /* --------------------------- Token init --------------------------- */
//   useEffect(() => {
//     const t = localStorage.getItem("token");
//     if (!t || t === "undefined" || t === "null") {
//       router.push("/login");
//       return;
//     }
//     setToken(t);
//   }, [router]);

//   /* ---------------------------- Fetchers ---------------------------- */
//   useEffect(() => {
//     if (!token || !userId) return;
//     (async () => {
//       setLoading(true);
//       await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//       setLoading(false);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("User fetch failed");
//     const data = await res.json();
//     setUserData(data);
//   };

//   const fetchFundHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Funds fetch failed");
//     const data = await res.json();
//     setFundHistory(data);
//   };

//   const fetchBidHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Bids fetch failed");
//     const data = await res.json();
//     setBidHistory(data);
//   };

//   const fetchWinningHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Winnings fetch failed");
//     const data = await res.json();
//     setWinningHistory(data);
//   };

//   /* -------------------------- Fund Actions -------------------------- */
//   const handleAddFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Add funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक जोड़ दिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     if ((userData.wallet_balance ?? 0) < n) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Withdraw funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक निकाल लिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectAdd = async () => {
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Add 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectWithdraw = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Withdraw 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ---------------------- Status/Delete Actions ---------------------- */
//   const handleStatusChange = async () => {
//     if (!token || !userData.status || !userId) return;
//     const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//     const confirmAction = window.confirm(
//       `क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`
//     );
//     if (!confirmAction) return;
//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userId, status: newStatus }),
//       });
//       if (!response.ok) throw new Error('Failed to update status');
//       alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//       await fetchUserData(); // Refresh user data to show new status
//     } catch (error) {
//       console.error('Error updating status:', error);
//       alert("स्टेटस अपडेट करने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!token || !userId) return;
//     const confirmDelete = window.confirm(
//       `क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`
//     );
//     if (!confirmDelete) return;

//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ user_id: userId }),
//       });
//       if (!response.ok) throw new Error('Failed to delete user');
//       alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//       router.push('/user-management'); // Redirect to user list after deletion
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       alert('उपयोगकर्ता को हटाने में विफल रहा।');
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ------------------------------- Actions ------------------------------- */
//   const handleGoBack = () => router.push("/user-management");
//   const handleRefresh = async () => {
//     setLoading(true);
//     await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//     setLoading(false);
//   };


//   /* ------------------------------- Guards ------------------------------- */
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
//         <div className="rounded-xl bg-white/80 p-6 text-lg font-semibold shadow-md">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-100 p-4 md:p-6">
//         <div className="mx-auto max-w-7xl space-y-4">
//           <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-md">
//             <div className="flex items-center gap-2">
//               <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
//               <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//             </div>
//             <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
//           </div>
//           <div className="grid gap-4 md:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
//             ))}
//           </div>
//           <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
//           <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
//         </div>
//       </div>
//     );
//   }

//   /* --------------------------------- UI ---------------------------------- */
//   return (
//     <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* Sticky Header */}
//         <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60 md:px-4 md:py-3">
//           <div className="flex items-center gap-2 md:gap-3">
//             <button
//               onClick={handleGoBack}
//               className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
//               title="Back"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-semibold md:text-2xl">User Details</h2>
//           </div>

//           {/* ACTIONS: Activate/Deactivate + Delete */}
//           <div className="flex items-center gap-2">
//             {userData.status === "active" ? (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
//                 title="Deactivate user"
//               >
//                 <PowerOff className="h-4 w-4" />
//                 Deactivate
//               </button>
//             ) : (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
//                 title="Activate user"
//               >
//                 <Power className="h-4 w-4" />
//                 Activate
//               </button>
//             )}

//             <button
//               onClick={handleDeleteUser}
//               disabled={busy}
//               className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               title="Delete user"
//             >
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </button>

//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
//               title="Refresh"
//             >
//               <RefreshCw className="h-4 w-4" />
//               <span className="hidden md:inline">Refresh</span>
//             </button>
//           </div>
//         </div>

//         {/* Profile (NO security password) */}
//         <div className="grid gap-4 md:grid-cols-3">
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:col-span-2">
//             <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//               <div className="flex items-center gap-4">
//                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100">
//                   <User2 className="h-9 w-9 text-slate-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                   <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                     <span className="inline-flex items-center gap-1">
//                       <Mail className="h-4 w-4" /> {userData.email || "-"}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <Phone className="h-4 w-4" /> {userData.phone_number || "-"}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   {userData.status === "active" ? (
//                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//                   ) : (
//                     <XCircle className="h-4 w-4 text-rose-600" />
//                   )}
//                   <span className="font-medium">Status:</span>
//                   <span className={`rounded-full border px-2 py-0.5 text-xs ${chip(userData.status)}`}>
//                     {userData.status || "active"}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 grid gap-4 sm:grid-cols-2">
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Creation Date</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {userData.creation_date || "-"}
//                 </div>
//               </div>
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Last Login</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {userData.last_login || "-"}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Balance Card with quick +/- */}
//           <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Wallet className="h-5 w-5 text-emerald-600" />
//                 <h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4>
//               </div>
//               <ShieldCheck className="h-5 w-5 text-emerald-600/70" />
//             </div>
//             <div className="mt-2 text-2xl font-bold text-emerald-700">
//               {INR(Number(userData.wallet_balance || 0))}
//             </div>
//             <div className="mt-3 flex items-center gap-2">
//               <button
//                 onClick={handleDirectWithdraw}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               >
//                 <Minus className="mr-1 h-4 w-4" /> 1
//               </button>
//               <button
//                 onClick={handleDirectAdd}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
//               >
//                 <Plus className="mr-1 h-4 w-4" /> 1
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* KPI Pills */}
//         <div className="grid gap-4 md:grid-cols-4">
//           <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//           <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//           <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//           <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//         </div>

//         {/* Payment Info + Fund Manager */}
//         <div className="grid gap-4 lg:grid-cols-3">

//           {/* Payment Info -- UPDATED SECTION */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//             <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//             <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
//               {/* बैंक डिटेल्स */}
//               <InfoRow label="Bank Name" value={userData.bank_name} />
//               <InfoRow label="A/C Holder Name" value={userData.account_holder_name} />
//               <InfoRow label="A/C Number" value={userData.account_number} />
//               <InfoRow label="IFSC Code" value={userData.ifsc_code} />

//               {/* UPI डिटेल्स */}
//               <InfoRow label="PhonePe Number" value={userData.phonepe_number} />
//               <InfoRow label="GPay Number" value={userData.gpay_number} />
//               <InfoRow label="Paytm Number" value={userData.paytm_number} />
//             </div>
//           </div>


//           {/* Fund Management */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur lg:col-span-2">
//             <h3 className="text-lg font-semibold">Fund Management</h3>
//             <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
//               <div className="relative">
//                 <span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center">
//                   <IndianRupee className="h-4 w-4 text-slate-400" />
//                 </span>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm outline-none ring-0 focus:border-blue-300"
//                   placeholder="Enter amount"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                 />
//               </div>
//               <button
//                 onClick={handleAddFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
//               >
//                 Add Funds
//               </button>
//               <button
//                 onClick={handleWithdrawFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* History Tabs */}
//         <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//           <div className="mb-4 flex flex-wrap gap-2">
//             <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//             <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//             <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//           </div>

//           {tab === "funds" && (
//             <div className="space-y-6">
//               <SectionTable
//                 title="Fund Credit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.credits?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Fund Debit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.debits?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Add Fund Request (UPI)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.requests?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Withdraw Fund"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.withdrawals?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//             </div>
//           )}

//           {tab === "bids" && (
//             <SectionTable
//               title="Bid History"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Points", "Status", "Date", "Time",
//               ]}
//               rows={bidHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.points, r.status, r.date, r.time,
//               ])}
//             />
//           )}

//           {tab === "winnings" && (
//             <SectionTable
//               title="Winning History Report"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Added Point", "Won Point", "Date", "Time",
//               ]}
//               rows={winningHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.added_point, r.won_point, r.date, r.time,
//               ])}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* --------------------------- UI Sub-components --------------------------- */
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//   const tones: Record<string, string> = {
//     emerald: "from-emerald-50 to-white text-emerald-800",
//     rose: "from-rose-50 to-white text-rose-800",
//     sky: "from-sky-50 to-white text-sky-800",
//     amber: "from-amber-50 to-white text-amber-800",
//     slate: "from-slate-50 to-white text-slate-800",
//   };
//   return (
//     <div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}>
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-medium text-slate-500">{title}</div>
//       </div>
//       <div className="mt-2 text-xl font-bold">{value}</div>
//     </div>
//   );
// }

// function InfoRow({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2">
//       <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
//       <div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div>
//     </div>
//   );
// }

// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//         }`}
//     >
//       {label}
//     </button>
//   );
// }

// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//   const hasRows = rows && rows.length > 0;
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//         <h4 className="text-base font-semibold">{title}</h4>
//         <span className="text-xs text-slate-500">{hasRows ? `${rows!.length} items` : "0 items"}</span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[720px] border-collapse text-sm">
//           <thead>
//             <tr className="bg-slate-50 text-left text-slate-600">
//               {headers.map((h) => (
//                 <th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {hasRows ? (
//               rows!.map((r, idx) => (
//                 <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
//                   {r.map((c, i) => (
//                     <td key={i} className="border-b border-slate-100 px-3 py-2">
//                       {c}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td className="px-3 py-6 text-center text-slate-500" colSpan={headers.length}>
//                   No data available in table
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   ArrowLeft, RefreshCw, Plus, Minus, Wallet, ShieldCheck, User2,
//   Banknote, IndianRupee, Clock, Mail, Phone, CheckCircle2, XCircle,
//   Power, PowerOff, Trash2, AlertTriangle
// } from "lucide-react";

// /* ----------------------------- Types ----------------------------- */
// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: "active" | "inactive" | string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   upi_id?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }

// /* ----------------------------- Utils ----------------------------- */
// const INR = (v: number | string) => {
//   const n = typeof v === "string" ? Number(v) : v;
//   if (isNaN(n)) return "₹0";
//   return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
// };
// const chip = (ok?: string) =>
//   ok === "active"
//     ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//     : "bg-rose-100 text-rose-700 border-rose-200";

// /* ---------------------------- Component ---------------------------- */
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const router = useRouter();
//   const userId = params.userId;

//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);

//   const [userData, setUserData] = useState<UserData>({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     password: "",
//     creation_date: "",
//     last_login: "",
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     upi_id: "",
//     status: "active",
//   });

//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: [],
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);
//   const [tab, setTab] = useState<"funds" | "bids" | "winnings">("funds");

//   const [amount, setAmount] = useState<string>("");

//   // Confirmation modal state
//   const [confirmOpen, setConfirmOpen] = useState<null | { type: "deactivate" | "activate" | "delete"; title: string; desc: string }>(null);

//   /* --------------------------- Token init --------------------------- */
//   useEffect(() => {
//     const t = localStorage.getItem("token");
//     if (!t || t === "undefined" || t === "null") {
//       router.push("/login");
//       return;
//     }
//     setToken(t);
//   }, [router]);

//   /* ---------------------------- Fetchers ---------------------------- */
//   useEffect(() => {
//     if (!token || !userId) return;
//     (async () => {
//       setLoading(true);
//       await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//       setLoading(false);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("User fetch failed");
//     const data = await res.json();
//     setUserData(data);
//   };

//   const fetchFundHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Funds fetch failed");
//     const data = await res.json();
//     setFundHistory(data);
//   };

//   const fetchBidHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Bids fetch failed");
//     const data = await res.json();
//     setBidHistory(data);
//   };

//   const fetchWinningHistory = async () => {
//     const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });
//     if (!res.ok) throw new Error("Winnings fetch failed");
//     const data = await res.json();
//     setWinningHistory(data);
//   };

//   /* -------------------------- Fund Actions -------------------------- */
//   const handleAddFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Add funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक जोड़ दिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     const n = parseFloat(amount);
//     if (isNaN(n) || n <= 0) return alert("कृपया एक वैध राशि दर्ज करें।");
//     if ((userData.wallet_balance ?? 0) < n) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: n }),
//       });
//       if (!res.ok) throw new Error("Withdraw funds failed");
//       setAmount("");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//       alert("फंड सफलतापूर्वक निकाल लिया गया।");
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectAdd = async () => {
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Add 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड जोड़ने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDirectWithdraw = async () => {
//     if ((userData.wallet_balance ?? 0) < 1) return alert("अपर्याप्त शेष राशि।");
//     try {
//       setBusy(true);
//       const res = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }),
//       });
//       if (!res.ok) throw new Error("Withdraw 1 failed");
//       await Promise.all([fetchUserData(), fetchFundHistory()]);
//     } catch (e) {
//       console.error(e);
//       alert("फंड निकालने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ---------------------- Status/Delete Actions ---------------------- */
//   const handleStatusChange = async () => {
//     if (!token || !userData.status || !userId) return;
//     const newStatus = userData.status === 'active' ? 'inactive' : 'active';
//     const confirmAction = window.confirm(
//       `क्या आप वाकई इस उपयोगकर्ता को ${newStatus === 'active' ? 'सक्रिय' : 'निष्क्रिय'} करना चाहते हैं?`
//     );
//     if (!confirmAction) return;
//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/changestatus`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userId, status: newStatus }),
//       });
//       if (!response.ok) throw new Error('Failed to update status');
//       alert("स्टेटस सफलतापूर्वक अपडेट हो गया।");
//       await fetchUserData(); // Refresh user data to show new status
//     } catch (error) {
//       console.error('Error updating status:', error);
//       alert("स्टेटस अपडेट करने में विफल रहा।");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!token || !userId) return;
//     const confirmDelete = window.confirm(
//       `क्या आप वाकई उपयोगकर्ता "${userData.full_name}" को स्थायी रूप से हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`
//     );
//     if (!confirmDelete) return;

//     try {
//       setBusy(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/deleteuser`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ user_id: userId }),
//       });
//       if (!response.ok) throw new Error('Failed to delete user');
//       alert('उपयोगकर्ता सफलतापूर्वक हटा दिया गया!');
//       router.push('/user-management'); // Redirect to user list after deletion
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       alert('उपयोगकर्ता को हटाने में विफल रहा।');
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* ------------------------------- Actions ------------------------------- */
//   const handleGoBack = () => router.push("/user-management");
//   const handleRefresh = async () => {
//     setLoading(true);
//     await Promise.all([fetchUserData(), fetchFundHistory(), fetchBidHistory(), fetchWinningHistory()]);
//     setLoading(false);
//   };


//   /* ------------------------------- Guards ------------------------------- */
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
//         <div className="rounded-xl bg-white/80 p-6 text-lg font-semibold shadow-md">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-100 p-4 md:p-6">
//         <div className="mx-auto max-w-7xl space-y-4">
//           <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-md">
//             <div className="flex items-center gap-2">
//               <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
//               <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//             </div>
//             <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
//           </div>
//           <div className="grid gap-4 md:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
//             ))}
//           </div>
//           <div className="h-64 animate-pulse rounded-xl bg-white shadow-sm" />
//           <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
//         </div>
//       </div>
//     );
//   }

//   /* --------------------------------- UI ---------------------------------- */
//   return (
//     <div className="min-h-screen bg-slate-100 p-3 md:p-6">
//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* Sticky Header */}
//         <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow backdrop-blur supports-[backdrop-filter]:bg-white/60 md:px-4 md:py-3">
//           <div className="flex items-center gap-2 md:gap-3">
//             <button
//               onClick={handleGoBack}
//               className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
//               title="Back"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-semibold md:text-2xl">User Details</h2>
//           </div>

//           {/* ACTIONS: Activate/Deactivate + Delete */}
//           <div className="flex items-center gap-2">
//             {userData.status === "active" ? (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
//                 title="Deactivate user"
//               >
//                 <PowerOff className="h-4 w-4" />
//                 Deactivate
//               </button>
//             ) : (
//               <button
//                 onClick={handleStatusChange}
//                 disabled={busy}
//                 className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
//                 title="Activate user"
//               >
//                 <Power className="h-4 w-4" />
//                 Activate
//               </button>
//             )}

//             <button
//               onClick={handleDeleteUser}
//               disabled={busy}
//               className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               title="Delete user"
//             >
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </button>

//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
//               title="Refresh"
//             >
//               <RefreshCw className="h-4 w-4" />
//               <span className="hidden md:inline">Refresh</span>
//             </button>
//           </div>
//         </div>

//         {/* Profile (NO security password) */}
//         <div className="grid gap-4 md:grid-cols-3">
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:col-span-2">
//             <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
//               <div className="flex items-center gap-4">
//                 <div className="grid h-16 w-16 place-content-center rounded-2xl bg-slate-100">
//                   <User2 className="h-9 w-9 text-slate-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-semibold">{userData.full_name || "-"}</h3>
//                   <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                     <span className="inline-flex items-center gap-1">
//                       <Mail className="h-4 w-4" /> {userData.email || "-"}
//                     </span>
//                     <span className="inline-flex items-center gap-1">
//                       <Phone className="h-4 w-4" /> {userData.phone_number || "-"}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   {userData.status === "active" ? (
//                     <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//                   ) : (
//                     <XCircle className="h-4 w-4 text-rose-600" />
//                   )}
//                   <span className="font-medium">Status:</span>
//                   <span className={`rounded-full border px-2 py-0.5 text-xs ${chip(userData.status)}`}>
//                     {userData.status || "active"}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 grid gap-4 sm:grid-cols-2">
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Creation Date</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {userData.creation_date || "-"}
//                 </div>
//               </div>
//               <div className="rounded-xl bg-slate-50 p-3">
//                 <div className="text-sm text-slate-500">Last Login</div>
//                 <div className="mt-0.5 flex items-center gap-2 font-medium">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   {userData.last_login || "-"}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Balance Card with quick +/- */}
//           <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Wallet className="h-5 w-5 text-emerald-600" />
//                 <h4 className="text-sm font-semibold text-emerald-700">Available Balance</h4>
//               </div>
//               <ShieldCheck className="h-5 w-5 text-emerald-600/70" />
//             </div>
//             <div className="mt-2 text-2xl font-bold text-emerald-700">
//               {INR(Number(userData.wallet_balance || 0))}
//             </div>
//             <div className="mt-3 flex items-center gap-2">
//               <button
//                 onClick={handleDirectWithdraw}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
//               >
//                 <Minus className="mr-1 h-4 w-4" /> 1
//               </button>
//               <button
//                 onClick={handleDirectAdd}
//                 disabled={busy || loading}
//                 className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
//               >
//                 <Plus className="mr-1 h-4 w-4" /> 1
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* KPI Pills */}
//         <div className="grid gap-4 md:grid-cols-4">
//           <Stat title="Total Deposit" value={INR(userData.total_deposit || 0)} tone="emerald" />
//           <Stat title="Total Withdraw" value={INR(userData.total_withdraw || 0)} tone="rose" />
//           <Stat title="Total Bid" value={INR(userData.total_bid || 0)} tone="sky" />
//           <Stat title="Total Winning" value={INR(userData.total_winning || 0)} tone="amber" />
//         </div>

//         {/* Payment Info + Fund Manager */}
//         <div className="grid gap-4 lg:grid-cols-3">
//           {/* Payment Info */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//             <h3 className="mb-3 text-lg font-semibold">Payment Information</h3>
//             <div className="grid gap-3 text-sm md:grid-cols-2">
//               <InfoRow label="Bank Name" value={userData.bank_name} />
//               <InfoRow label="A/C Holder Name" value={userData.account_holder_name} />
//               <InfoRow label="A/C Number" value={userData.account_number} />
//               <InfoRow label="IFSC Code" value={userData.ifsc_code} />
//               <InfoRow label="UPI ID" value={userData.upi_id} />
//             </div>
//           </div>

//           {/* Fund Management */}
//           <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur lg:col-span-2">
//             <h3 className="text-lg font-semibold">Fund Management</h3>
//             <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
//               <div className="relative">
//                 <span className="pointer-events-none absolute inset-y-0 left-3 grid place-content-center">
//                   <IndianRupee className="h-4 w-4 text-slate-400" />
//                 </span>
//                 <input
//                   type="number"
//                   inputMode="decimal"
//                   className="w-full rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm outline-none ring-0 focus:border-blue-300"
//                   placeholder="Enter amount"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                 />
//               </div>
//               <button
//                 onClick={handleAddFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
//               >
//                 Add Funds
//               </button>
//               <button
//                 onClick={handleWithdrawFunds}
//                 disabled={busy}
//                 className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* History Tabs */}
//         <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
//           <div className="mb-4 flex flex-wrap gap-2">
//             <TabBtn active={tab === "funds"} onClick={() => setTab("funds")} label="Funds History" />
//             <TabBtn active={tab === "bids"} onClick={() => setTab("bids")} label="Bid History" />
//             <TabBtn active={tab === "winnings"} onClick={() => setTab("winnings")} label="Winning History" />
//           </div>

//           {tab === "funds" && (
//             <div className="space-y-6">
//               <SectionTable
//                 title="Fund Credit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.credits?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Fund Debit (Admin)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.debits?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Add Fund Request (UPI)"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.requests?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//               <SectionTable
//                 title="Withdraw Fund"
//                 headers={["#", "Amount", "Remark", "Date", "Time", "Status"]}
//                 rows={fundHistory.withdrawals?.map((r, i) => [i + 1, INR(r.amount), r.remark, r.date, r.time, r.status])}
//               />
//             </div>
//           )}

//           {tab === "bids" && (
//             <SectionTable
//               title="Bid History"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Points", "Status", "Date", "Time",
//               ]}
//               rows={bidHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.points, r.status, r.date, r.time,
//               ])}
//             />
//           )}

//           {tab === "winnings" && (
//             <SectionTable
//               title="Winning History Report"
//               headers={[
//                 "#", "Game", "Type", "Session", "Open Digit", "Close Digit", "Open Panna", "Close Panna", "Added Point", "Won Point", "Date", "Time",
//               ]}
//               rows={winningHistory.map((r, i) => [
//                 i + 1, r.game_name, r.game_type, r.session, r.open_digit, r.close_digit,
//                 r.open_panna, r.close_panna, r.added_point, r.won_point, r.date, r.time,
//               ])}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* --------------------------- UI Sub-components --------------------------- */
// function Stat({ title, value, tone = "slate" }: { title: string; value: string | number; tone?: "emerald" | "rose" | "sky" | "amber" | "slate" }) {
//   const tones: Record<string, string> = {
//     emerald: "from-emerald-50 to-white text-emerald-800",
//     rose: "from-rose-50 to-white text-rose-800",
//     sky: "from-sky-50 to-white text-sky-800",
//     amber: "from-amber-50 to-white text-amber-800",
//     slate: "from-slate-50 to-white text-slate-800",
//   };
//   return (
//     <div className={`rounded-2xl border border-white/50 bg-gradient-to-br ${tones[tone]} p-4 shadow-sm`}>
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-medium text-slate-500">{title}</div>
//       </div>
//       <div className="mt-2 text-xl font-bold">{value}</div>
//     </div>
//   );
// }

// function InfoRow({ label, value }: { label: string; value?: string }) {
//   return (
//     <div className="rounded-lg border border-slate-200/60 bg-white px-3 py-2">
//       <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
//       <div className="mt-0.5 font-medium text-slate-800">{value || "-"}</div>
//     </div>
//   );
// }

// function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
//         }`}
//     >
//       {label}
//     </button>
//   );
// }

// function SectionTable({ title, headers, rows }: { title: string; headers: string[]; rows?: (string | number)[][] }) {
//   const hasRows = rows && rows.length > 0;
//   return (
//     <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
//         <h4 className="text-base font-semibold">{title}</h4>
//         <span className="text-xs text-slate-500">{hasRows ? `${rows!.length} items` : "0 items"}</span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[720px] border-collapse text-sm">
//           <thead>
//             <tr className="bg-slate-50 text-left text-slate-600">
//               {headers.map((h) => (
//                 <th key={h} className="border-b border-slate-200 px-3 py-2 font-semibold">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {hasRows ? (
//               rows!.map((r, idx) => (
//                 <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
//                   {r.map((c, i) => (
//                     <td key={i} className="border-b border-slate-100 px-3 py-2">
//                       {c}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td className="px-3 py-6 text-center text-slate-500" colSpan={headers.length}>
//                   No data available in table
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


// "use client";
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, RefreshCw, Plus, Minus } from 'lucide-react';

// // Interfaces (कोई बदलाव नहीं)
// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   upi_id?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }


// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const [userData, setUserData] = useState<UserData>({
//     full_name: '',
//     email: '',
//     phone_number: '',
//     password: '',
//     creation_date: '',
//     last_login: '',
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     upi_id: '',
//   });

//   const [loading, setLoading] = useState<boolean>(true);
//   const [token, setToken] = useState<string | null>(null);
//   // यह स्टेट अब केवल बड़े अमाउंट के लिए है, +/- बटन के लिए नहीं
//   const [amount, setAmount] = useState<string>('');

//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: []
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);

//   const router = useRouter();
//   const userId = params.userId;

//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     if (!storedToken || storedToken === "undefined" || storedToken === "null") {
//       console.error("Invalid token found");
//       return;
//     }
//     setToken(storedToken);
//   }, []);

//   useEffect(() => {
//     if (token && userId) {
//       fetchUserData();
//       fetchFundHistory();
//       fetchBidHistory();
//       fetchWinningHistory();
//     }
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error('Failed to fetch user data');
//       const data = await response.json();
//       setUserData(data);
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//       alert("Failed to fetch user data. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFundHistory = async () => {
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error('Failed to fetch fund history');
//       const data = await response.json();
//       setFundHistory(data);
//     } catch (error) {
//       console.error("Error fetching fund history:", error);
//     }
//   };

//   const fetchBidHistory = async () => {
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error('Failed to fetch bid history');
//       const data = await response.json();
//       setBidHistory(data);
//     } catch (error) {
//       console.error("Error fetching bid history:", error);
//     }
//   };

//   const fetchWinningHistory = async () => {
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error('Failed to fetch winning history');
//       const data = await response.json();
//       setWinningHistory(data);
//     } catch (error) {
//       console.error("Error fetching winning history:", error);
//     }
//   };

//   // --- ये फंक्शन्स अब इनपुट फील्ड और उसके बटनों के लिए हैं ---
//   const handleAddFunds = async () => {
//     if (amount <= 0) {
//       alert("Please enter a valid amount");
//       return;
//     }
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount }),
//       });
//       if (!response.ok) throw new Error('Failed to add funds');
//       alert("Funds added successfully");
//       setAmount(0);
//       fetchUserData();
//       fetchFundHistory();
//     } catch (error) {
//       console.error("Error adding funds:", error);
//       alert("Failed to add funds. Please try again.");
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     if (amount <= 0) {
//       alert("Please enter a valid amount");
//       return;
//     }
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount }),
//       });
//       if (!response.ok) throw new Error('Failed to withdraw funds');
//       alert("Funds withdrawn successfully");
//       setAmount(0);
//       fetchUserData();
//       fetchFundHistory();
//     } catch (error) {
//       console.error("Error withdrawing funds:", error);
//       alert("Failed to withdraw funds. Please try again.");
//     }
//   };


//   // --- +/- बटन के लिए डायरेक्ट एक्शन फंक्शन ---
//   const handleDirectAdd = async () => {
//     try {
//       setLoading(true); // लोडर दिखाएं
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }), // हमेशा 1 यूनिट जोड़ें
//       });
//       if (!response.ok) throw new Error('Failed to add 1 unit');
//       // डेटा फिर से लोड करें ताकि बैलेंस अपडेट हो जाए
//       await fetchUserData();
//       await fetchFundHistory();
//     } catch (error) {
//       console.error("Error adding 1 unit:", error);
//       alert("Failed to add funds.");
//     } finally {
//       setLoading(false); // लोडर छिपाएं
//     }
//   };

//   const handleDirectWithdraw = async () => {
//     if (userData.wallet_balance < 1) {
//       alert("Insufficient balance.");
//       return;
//     }
//     try {
//       setLoading(true); // लोडर दिखाएं
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ amount: 1 }), // हमेशा 1 यूनिट घटाएं
//       });
//       if (!response.ok) throw new Error('Failed to withdraw 1 unit');
//       // डेटा फिर से लोड करें ताकि बैलेंस अपडेट हो जाए
//       await fetchUserData();
//       await fetchFundHistory();
//     } catch (error) {
//       console.error("Error withdrawing 1 unit:", error);
//       alert("Failed to withdraw funds.");
//     } finally {
//       setLoading(false); // लोडर छिपाएं
//     }
//   };

//   const handleGoBack = () => {
//     router.push('/user-management');
//   };

//   const handleRefresh = () => {
//     fetchUserData();
//     fetchFundHistory();
//     fetchBidHistory();
//     fetchWinningHistory();
//   };

//   if (!token) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-base md:text-xl font-semibold">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="flex flex-col items-center">
//         <RefreshCw className="animate-spin text-blue-500 mb-4" size={36} />
//         <div className="text-lg md:text-xl font-semibold">Loading User Details...</div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-3 md:p-6 bg-gray-100 min-h-screen">
//       <div className="container mx-auto">
//         <div className="flex items-center space-x-2 md:space-x-4 mb-4">
//           <button
//             onClick={handleGoBack}
//             className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
//             title="Go Back"
//           >
//             <ArrowLeft className="text-gray-700" size={20} />
//           </button>
//           <h2 className="text-xl md:text-3xl font-bold text-gray-800">User Details</h2>
//           <button
//             onClick={handleRefresh}
//             className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
//             title="Refresh"
//           >
//             <RefreshCw size={20} />
//           </button>
//         </div>

//         {/* User Information */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
//             <div className="flex items-center mb-4 md:mb-0">
//               <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mr-4">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                 </svg>
//               </div>
//               <div>
//                 <h3 className="text-lg md:text-xl font-semibold">{userData.full_name}</h3>
//                 <p className="text-gray-600">{userData.email}</p>
//               </div>
//             </div>
//             <div>
//               <div className="flex items-center mb-2">
//                 <span className="font-semibold mr-2">Security Password:</span>
//                 <span>{userData.password}</span>
//                 <button className="bg-blue-500 text-white text-xs px-2 py-1 rounded ml-2">
//                   Change
//                 </button>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-semibold mr-2">Status:</span>
//                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${userData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                   {userData.status || 'active'}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//             <div>
//               <p><span className="font-semibold">Mobile:</span> {userData.phone_number}</p>
//               <p><span className="font-semibold">Creation Date:</span> {userData.creation_date}</p>
//               <p><span className="font-semibold">Last Login:</span> {userData.last_login}</p>
//             </div>
//             <div>
//               <p className="font-semibold text-lg mb-2">Available Balance: <span className="text-green-600">{Number(userData.wallet_balance || 0).toFixed(2)}</span></p>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="bg-green-100 p-4 rounded">
//               <h3 className="font-semibold">Total Deposit</h3>
//               <p>{Number(userData.total_deposit || 0).toFixed(2)}</p>
//             </div>
//             <div className="bg-red-100 p-4 rounded">
//               <h3 className="font-semibold">Total Withdraw</h3>
//               <p>{Number(userData.total_withdraw || 0).toFixed(2)}</p>
//             </div>
//             <div className="bg-blue-100 p-4 rounded">
//               <h3 className="font-semibold">Total Bid</h3>
//               <p>{Number(userData.total_bid || 0).toFixed(2)}</p>
//             </div>
//             <div className="bg-yellow-100 p-4 rounded">
//               <h3 className="font-semibold">Total Winning</h3>
//               <p>{Number(userData.total_winning || 0).toFixed(2)}</p>
//             </div>
//           </div>
//         </div>

//         {/* Payment Information */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Payment Information</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p><span className="font-semibold">Bank Name:</span> {userData.bank_name || '-'}</p>
//               <p><span className="font-semibold">A/C Holder Name:</span> {userData.account_holder_name || '-'}</p>
//               <p><span className="font-semibold">UPI ID:</span> {userData.upi_id || '-'}</p>
//             </div>
//             <div>
//               <p><span className="font-semibold">A/C Number:</span> {userData.account_number || '-'}</p>
//               <p><span className="font-semibold">IFSC Code:</span> {userData.ifsc_code || '-'}</p>
//             </div>
//           </div>
//         </div>

//         {/* Fund Management */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Fund Management</h3>
//           <hr className="my-6" />

//           {/* यह सेक्शन अब बड़े अमाउंट के लिए है */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Add/Withdraw Custom Amount</h4>
//             <div className="flex items-center space-x-2 mb-4">
//               <input
//                 type="number"
//                 className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 // onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
//                 placeholder="Enter amount"
//               />
//             </div>

//             <div className="flex space-x-2">
//               <button
//                 className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex-1"
//                 onClick={handleAddFunds}
//               >
//                 Add Funds
//               </button>
//               <button
//                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex-1"
//                 onClick={handleWithdrawFunds}
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>

//           {/* Fund Credit (Admin) */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Fund Credit (Admin)</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.credits && fundHistory.credits.length > 0 ? (
//                     fundHistory.credits.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Fund Debit (Admin) */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Fund Debit (Admin)</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Request Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.debits && fundHistory.debits.length > 0 ? (
//                     fundHistory.debits.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Add Fund Request */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Add Fund Request (UPI)</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.requests && fundHistory.requests.length > 0 ? (
//                     fundHistory.requests.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Withdraw Fund */}
//           <div>
//             <h4 className="font-semibold mb-2">Withdraw Fund</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     _
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Request Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.withdrawals && fundHistory.withdrawals.length > 0 ? (
//                     fundHistory.withdrawals.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Bid History */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Bid History</h3>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border p-2 text-left">#</th>
//                   <th className="border p-2 text-left">Game Name</th>
//                   <th className="border p-2 text-left">Game Type</th>
//                   <th className="border p-2 text-left">Session</th>
//                   <th className="border p-2 text-left">Open Digit</th>
//                   <th className="border p-2 text-left">Close Digit</th>
//                   <th className="border p-2 text-left">Open Panna</th>
//                   <th className="border p-2 text-left">Close Panna</th>
//                   <th className="border p-2 text-left">Points</th>
//                   <th className="border p-2 text-left">Status</th>
//                   <th className="border p-2 text-left">Date</th>
//                   <th className="border p-2 text-left">Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {bidHistory.length > 0 ? (
//                   bidHistory.map((item, index) => (
//                     <tr key={index}>
//                       <td className="border p-2">{index + 1}</td>
//                       <td className="border p-2">{item.game_name}</td>
//                       <td className="border p-2">{item.game_type}</td>
//                       <td className="border p-2">{item.session}</td>
//                       <td className="border p-2">{item.open_digit}</td>
//                       <td className="border p-2">{item.close_digit}</td>
//                       <td className="border p-2">{item.open_panna}</td>
//                       <td className="border p-2">{item.close_panna}</td>
//                       <td className="border p-2">{item.points}</td>
//                       <td className="border p-2">{item.status}</td>
//                       <td className="border p-2">{item.date}</td>
//                       <td className="border p-2">{item.time}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={12} className="border p-2 text-center">No data available in table</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Winning History */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Winning History Report</h3>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border p-2 text-left">#</th>
//                   <th className="border p-2 text-left">Game Name</th>
//                   <th className="border p-2 text-left">Game Type</th>
//                   <th className="border p-2 text-left">Session</th>
//                   <th className="border p-2 text-left">Open Digit</th>
//                   <th className="border p-2 text-left">Close Digit</th>
//                   <th className="border p-2 text-left">Open Panna</th>
//                   <th className="border p-2 text-left">Close Panna</th>
//                   <th className="border p-2 text-left">Added Point</th>
//                   <th className="border p-2 text-left">Won Point</th>
//                   <th className="border p-2 text-left">Date</th>
//                   <th className="border p-2 text-left">Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {winningHistory.length > 0 ? (
//                   winningHistory.map((item, index) => (
//                     <tr key={index}>
//                       <td className="border p-2">{index + 1}</td>
//                       <td className="border p-2">{item.game_name}</td>
//                       <td className="border p-2">{item.game_type}</td>
//                       <td className="border p-2">{item.session}</td>
//                       <td className="border p-2">{item.open_digit}</td>
//                       <td className="border p-2">{item.close_digit}</td>
//                       <td className="border p-2">{item.open_panna}</td>
//                       <td className="border p-2">{item.close_panna}</td>
//                       <td className="border p-2">{item.added_point}</td>
//                       <td className="border p-2">{item.won_point}</td>
//                       <td className="border p-2">{item.date}</td>
//                       <td className="border p-2">{item.time}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={12} className="border p-2 text-center">No data available in table</td>
//                   </tr>
//                 )}
//                 _
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// "use client";
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, RefreshCw, Plus, Minus } from 'lucide-react';

// interface UserData {
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   creation_date: string;
//   last_login: string;
//   wallet_balance: number;
//   total_deposit: number;
//   total_withdraw: number;
//   total_bid: number;
//   total_winning: number;
//   status?: string;
//   bank_name?: string;
//   account_holder_name?: string;
//   account_number?: string;
//   ifsc_code?: string;
//   upi_id?: string;
// }

// interface FundHistoryItem {
//   amount: string;
//   remark: string;
//   date: string;
//   time: string;
//   status: string;
// }

// interface FundHistory {
//   credits: FundHistoryItem[];
//   debits: FundHistoryItem[];
//   requests: FundHistoryItem[];
//   withdrawals: FundHistoryItem[];
// }

// interface BidHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   points: string;
//   status: string;
//   date: string;
//   time: string;
// }

// interface WinningHistoryItem {
//   game_name: string;
//   game_type: string;
//   session: string;
//   open_digit: string;
//   close_digit: string;
//   open_panna: string;
//   close_panna: string;
//   added_point: string;
//   won_point: string;
//   date: string;
//   time: string;
// }

// // डायनामिक रूट के लिए पैरामीटर्स को सही तरीके से एक्सेस करें
// export default function UserDetailsPage({ params }: { params: { userId: string } }) {
//   const [userData, setUserData] = useState<UserData>({
//     full_name: '',
//     email: '',
//     phone_number: '',
//     password: '',
//     creation_date: '',
//     last_login: '',
//     wallet_balance: 0,
//     total_deposit: 0,
//     total_withdraw: 0,
//     total_bid: 0,
//     total_winning: 0,
//     upi_id: '',
//   });

//   const [loading, setLoading] = useState<boolean>(true);
//   const [token, setToken] = useState<string | null>(null);
//   const [amount, setAmount] = useState<number>(0);
//   const [fundHistory, setFundHistory] = useState<FundHistory>({
//     credits: [],
//     debits: [],
//     requests: [],
//     withdrawals: []
//   });
//   const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
//   const [winningHistory, setWinningHistory] = useState<WinningHistoryItem[]>([]);

//   const router = useRouter();
//   const userId = params.userId; // डायनामिक रूट से userId प्राप्त करें

//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     console.log("Retrieved token:", storedToken);

//     if (!storedToken || storedToken === "undefined" || storedToken === "null") {
//       console.error("Invalid token found");
//       return;
//     }

//     setToken(storedToken);
//   }, []);

//   useEffect(() => {
//     if (token && userId) {
//       fetchUserData();
//       fetchFundHistory();
//       fetchBidHistory();
//       fetchWinningHistory();
//     }
//   }, [token, userId]);

//   const fetchUserData = async () => {
//     try {
//       setLoading(true);
//       console.log("Fetching user data for ID:", userId, "with token:", token);

//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       console.log("User data response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error('Failed to fetch user data');
//       }

//       const data = await response.json();
//       console.log("Fetched user data:", data);
//       setUserData(data);
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//       alert("Failed to fetch user data. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFundHistory = async () => {
//     try {
//       console.log("Fetching fund history for user ID:", userId);
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/funds`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       console.log("Fund history response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error('Failed to fetch fund history');
//       }

//       const data = await response.json();
//       console.log("Fetched fund history:", data);
//       setFundHistory(data);
//     } catch (error) {
//       console.error("Error fetching fund history:", error);
//     }
//   };

//   const fetchBidHistory = async () => {
//     try {
//       console.log("Fetching bid history for user ID:", userId);
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/bids`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       console.log("Bid history response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error('Failed to fetch bid history');
//       }

//       const data = await response.json();
//       console.log("Fetched bid history:", data);
//       setBidHistory(data);
//     } catch (error) {
//       console.error("Error fetching bid history:", error);
//     }
//   };

//   const fetchWinningHistory = async () => {
//     try {
//       console.log("Fetching winning history for user ID:", userId);
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/winnings`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       console.log("Winning history response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error('Failed to fetch winning history');
//       }

//       const data = await response.json();
//       console.log("Fetched winning history:", data);
//       setWinningHistory(data);
//     } catch (error) {
//       console.error("Error fetching winning history:", error);
//     }
//   };

//   const handleIncrementAmount = () => {
//     setAmount(prev => prev + 1);
//   };

//   const handleDecrementAmount = () => {
//     if (amount > 0) {
//       setAmount(prev => prev - 1);
//     }
//   };

//   const handleAddFunds = async () => {
//     if (amount <= 0) {
//       alert("Please enter a valid amount");
//       return;
//     }

//     try {
//       console.log("Adding funds:", amount, "for user ID:", userId);
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/addfunds`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ amount }),
//       });

//       console.log("Add funds response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error('Failed to add funds');
//       }

//       alert("Funds added successfully");
//       setAmount(0);
//       fetchUserData();
//       fetchFundHistory();
//     } catch (error) {
//       console.error("Error adding funds:", error);
//       alert("Failed to add funds. Please try again.");
//     }
//   };

//   const handleWithdrawFunds = async () => {
//     if (amount <= 0) {
//       alert("Please enter a valid amount");
//       return;
//     }

//     try {
//       console.log("Withdrawing funds:", amount, "for user ID:", userId);
//       const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}/withdrawfunds`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ amount }),
//       });

//       console.log("Withdraw funds response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Error response:", errorText);
//         throw new Error('Failed to withdraw funds');
//       }

//       alert("Funds withdrawn successfully");
//       setAmount(0);
//       fetchUserData();
//       fetchFundHistory();
//     } catch (error) {
//       console.error("Error withdrawing funds:", error);
//       alert("Failed to withdraw funds. Please try again.");
//     }
//   };

//   // सही राउटिंग के साथ वापस जाने का फंक्शन
//   const handleGoBack = () => {
//     router.push('/user-management');
//   };

//   const handleRefresh = () => {
//     fetchUserData();
//     fetchFundHistory();
//     fetchBidHistory();
//     fetchWinningHistory();
//   };

//   if (!token) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-base md:text-xl font-semibold">
//           Please log in to access this page.
//         </div>
//       </div>
//     );
//   }

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="flex flex-col items-center">
//         <RefreshCw className="animate-spin text-blue-500 mb-4" size={36} />
//         <div className="text-lg md:text-xl font-semibold">Loading User Details...</div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-3 md:p-6 bg-gray-100 min-h-screen">
//       <div className="container mx-auto">
//         <div className="flex items-center space-x-2 md:space-x-4 mb-4">
//           <button
//             onClick={handleGoBack}
//             className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
//             title="Go Back"
//           >
//             <ArrowLeft className="text-gray-700" size={20} />
//           </button>
//           <h2 className="text-xl md:text-3xl font-bold text-gray-800">User Details</h2>
//           <button
//             onClick={handleRefresh}
//             className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
//             title="Refresh"
//           >
//             <RefreshCw size={20} />
//           </button>
//         </div>

//         {/* User Information */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
//             <div className="flex items-center mb-4 md:mb-0">
//               <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mr-4">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                 </svg>
//               </div>
//               <div>
//                 <h3 className="text-lg md:text-xl font-semibold">{userData.full_name}</h3>
//                 <p className="text-gray-600">{userData.email}</p>
//               </div>
//             </div>
//             <div>
//               <div className="flex items-center mb-2">
//                 <span className="font-semibold mr-2">Security Password:</span>
//                 <span>{userData.password}</span>
//                 <button className="bg-blue-500 text-white text-xs px-2 py-1 rounded ml-2">
//                   Change
//                 </button>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-semibold mr-2">Status:</span>
//                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${userData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                   {userData.status || 'active'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//             <div>
//               <p><span className="font-semibold">Mobile:</span> {userData.phone_number}</p>
//               <p><span className="font-semibold">Creation Date:</span> {userData.creation_date}</p>
//               <p><span className="font-semibold">Last Login:</span> {userData.last_login}</p>
//             </div>
//             <div>
//               <p className="font-semibold text-lg mb-2">Available Balance: <span className="text-green-600">{Number(userData.wallet_balance || 0).toFixed(2)}</span></p>
//               <div className="flex space-x-2">
//                 <button
//                   className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex-1"
//                   onClick={handleAddFunds}
//                 >
//                   Add Money
//                 </button>
//                 <button
//                   className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex-1"
//                   onClick={handleWithdrawFunds}
//                 >
//                   Withdraw
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="bg-green-100 p-4 rounded">
//               <h3 className="font-semibold">Total Deposit</h3>
//               <p>{Number(userData.total_deposit || 0).toFixed(2)}</p>
//             </div>
//             <div className="bg-red-100 p-4 rounded">
//               <h3 className="font-semibold">Total Withdraw</h3>
//               <p>{Number(userData.total_withdraw || 0).toFixed(2)}</p>
//             </div>
//             <div className="bg-blue-100 p-4 rounded">
//               <h3 className="font-semibold">Total Bid</h3>
//               <p>{Number(userData.total_bid || 0).toFixed(2)}</p>
//             </div>
//             <div className="bg-yellow-100 p-4 rounded">
//               <h3 className="font-semibold">Total Winning</h3>
//               <p>{Number(userData.total_winning || 0).toFixed(2)}</p>
//             </div>
//           </div>
//         </div>

//         {/* Payment Information */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Payment Information</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p><span className="font-semibold">Bank Name:</span> {userData.bank_name || '-'}</p>
//               <p><span className="font-semibold">A/C Holder Name:</span> {userData.account_holder_name || '-'}</p>
//               <p><span className="font-semibold">UPI ID:</span> {userData.upi_id || '-'}</p>
//             </div>
//             <div>
//               <p><span className="font-semibold">A/C Number:</span> {userData.account_number || '-'}</p>
//               <p><span className="font-semibold">IFSC Code:</span> {userData.ifsc_code || '-'}</p>
//             </div>
//           </div>
//         </div>

//         {/* Fund Management */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Fund Management</h3>

//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Add/Withdraw Amount</h4>
//             <div className="flex items-center space-x-2 mb-4">
//               <button
//                 className="bg-red-500 text-white px-2 py-1 rounded-lg"
//                 onClick={handleDecrementAmount}
//               >
//                 <Minus size={16} />
//               </button>

//               <input
//                 type="number"
//                 className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={amount}
//                 onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
//                 placeholder="Enter amount"
//               />

//               <button
//                 className="bg-green-500 text-white px-2 py-1 rounded-lg"
//                 onClick={handleIncrementAmount}
//               >
//                 <Plus size={16} />
//               </button>
//             </div>

//             <div className="flex space-x-2">
//               <button
//                 className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex-1"
//                 onClick={handleAddFunds}
//               >
//                 Add Funds
//               </button>
//               <button
//                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex-1"
//                 onClick={handleWithdrawFunds}
//               >
//                 Withdraw Funds
//               </button>
//             </div>
//           </div>

//           {/* Fund Credit (Admin) */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Fund Credit (Admin)</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.credits && fundHistory.credits.length > 0 ? (
//                     fundHistory.credits.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Fund Debit (Admin) */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Fund Debit (Admin)</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Request Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.debits && fundHistory.debits.length > 0 ? (
//                     fundHistory.debits.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Add Fund Request */}
//           <div className="mb-6">
//             <h4 className="font-semibold mb-2">Add Fund Request (UPI)</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.requests && fundHistory.requests.length > 0 ? (
//                     fundHistory.requests.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Withdraw Fund */}
//           <div>
//             <h4 className="font-semibold mb-2">Withdraw Fund</h4>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2 text-left">#</th>
//                     <th className="border p-2 text-left">Request Amount</th>
//                     <th className="border p-2 text-left">Remark</th>
//                     <th className="border p-2 text-left">Request Date</th>
//                     <th className="border p-2 text-left">Time</th>
//                     <th className="border p-2 text-left">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fundHistory.withdrawals && fundHistory.withdrawals.length > 0 ? (
//                     fundHistory.withdrawals.map((item, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{index + 1}</td>
//                         <td className="border p-2">{item.amount}</td>
//                         <td className="border p-2">{item.remark}</td>
//                         <td className="border p-2">{item.date}</td>
//                         <td className="border p-2">{item.time}</td>
//                         <td className="border p-2">{item.status}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="border p-2 text-center">No data available in table</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Bid History */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Bid History</h3>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border p-2 text-left">#</th>
//                   <th className="border p-2 text-left">Game Name</th>
//                   <th className="border p-2 text-left">Game Type</th>
//                   <th className="border p-2 text-left">Session</th>
//                   <th className="border p-2 text-left">Open Digit</th>
//                   <th className="border p-2 text-left">Close Digit</th>
//                   <th className="border p-2 text-left">Open Panna</th>
//                   <th className="border p-2 text-left">Close Panna</th>
//                   <th className="border p-2 text-left">Points</th>
//                   <th className="border p-2 text-left">Status</th>
//                   <th className="border p-2 text-left">Date</th>
//                   <th className="border p-2 text-left">Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {bidHistory.length > 0 ? (
//                   bidHistory.map((item, index) => (
//                     <tr key={index}>
//                       <td className="border p-2">{index + 1}</td>
//                       <td className="border p-2">{item.game_name}</td>
//                       <td className="border p-2">{item.game_type}</td>
//                       <td className="border p-2">{item.session}</td>
//                       <td className="border p-2">{item.open_digit}</td>
//                       <td className="border p-2">{item.close_digit}</td>
//                       <td className="border p-2">{item.open_panna}</td>
//                       <td className="border p-2">{item.close_panna}</td>
//                       <td className="border p-2">{item.points}</td>
//                       <td className="border p-2">{item.status}</td>
//                       <td className="border p-2">{item.date}</td>
//                       <td className="border p-2">{item.time}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={12} className="border p-2 text-center">No data available in table</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Winning History */}
//         <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
//           <h3 className="text-lg md:text-xl font-semibold mb-4">Winning History Report</h3>
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border p-2 text-left">#</th>
//                   <th className="border p-2 text-left">Game Name</th>
//                   <th className="border p-2 text-left">Game Type</th>
//                   <th className="border p-2 text-left">Session</th>
//                   <th className="border p-2 text-left">Open Digit</th>
//                   <th className="border p-2 text-left">Close Digit</th>
//                   <th className="border p-2 text-left">Open Panna</th>
//                   <th className="border p-2 text-left">Close Panna</th>
//                   <th className="border p-2 text-left">Added Point</th>
//                   <th className="border p-2 text-left">Won Point</th>
//                   <th className="border p-2 text-left">Date</th>
//                   <th className="border p-2 text-left">Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {winningHistory.length > 0 ? (
//                   winningHistory.map((item, index) => (
//                     <tr key={index}>
//                       <td className="border p-2">{index + 1}</td>
//                       <td className="border p-2">{item.game_name}</td>
//                       <td className="border p-2">{item.game_type}</td>
//                       <td className="border p-2">{item.session}</td>
//                       <td className="border p-2">{item.open_digit}</td>
//                       <td className="border p-2">{item.close_digit}</td>
//                       <td className="border p-2">{item.open_panna}</td>
//                       <td className="border p-2">{item.close_panna}</td>
//                       <td className="border p-2">{item.added_point}</td>
//                       <td className="border p-2">{item.won_point}</td>
//                       <td className="border p-2">{item.date}</td>
//                       <td className="border p-2">{item.time}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={12} className="border p-2 text-center">No data available in table</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
