"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus, Sword, ShieldOff, MessageSquare, Phone, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import Image from 'next/image';

// --- सभी Interfaces और Helper Components ---
interface ModalData {
  user_id?: number | string | null;
  user: string;
  phone?: string;
  amount?: string | number;
  status?: string;
  date?: string;
  'Market Name'?: string;
  'Bet Digit'?: string;
  'Game Type'?: string;
  'Session'?: string;
  Points?: string;
  'Win/Loss'?: string;
  wallet?: string;
  withdrawal_id?: number;
  payment_method?: string;
  rawItem?: any;
}
interface ActionButton {
  label: string;
  onClick: (item: ModalData) => void;
  color: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: ModalData[];
  loading: boolean;
  onViewProfile: (userId: number) => void;
  actions: ActionButton[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
interface TopStats {
  overall_users: number;
  today_users: number;
  games: number;
  unique_emails_today: number;
  today_registered_players: number;
  total_bet_players: number;
  total_bet_not_players: number;
}
interface GameReportStats {
  total_bid_amount: number;
  total_winning_amount: number;
  total_profit: number;
  total_wallet_balance: number;
  withdraw_request: number;
  total_deposit_approved: number;
  add_funds_manually: number;
  total_withdraw: number;
}
interface SingleAnkBet {
  ank: number;
  total_open_points: number;
  total_closed_points: number;
  total_open_bets: number;
  total_closed_bets: number;
}
interface FundHistoryItem {
  id: number;
  email: string;
  phone_number: string;
  amount: number;
  createdat: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  user_id: number | string | null;
  full_name: string;
}

// ✅ LOCAL DATE HELPER (UTC नहीं)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // YYYY-MM-DD (local)
};

const extractUserId = (raw: any): number | null => {
  if (!raw) return null;
  const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
  if (possible === null || possible === undefined) return null;
  const n = typeof possible === 'string' ? Number(possible) : possible;
  return Number.isFinite(n) && n > 0 ? n : null;
};

const formatPhoneNumberForWhatsApp = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
};

const formatCurrency = (v: number | string | undefined) => {
  const n = typeof v === "string" ? Number(v) : v;
  if (isNaN(n ?? NaN)) return "₹0.00";
  return `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

// ---- DetailsModal Component ----
const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions, currentPage, totalPages, onPageChange }: DetailsModalProps) => {
  if (!isOpen) return null;

  const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id' && key !== 'rawItem') : [];

  const safeGoProfile = (anyItem: ModalData) => {
    const uid = extractUserId(anyItem);
    if (uid) onViewProfile(uid);
  };

  const hasActions = actions.length > 0;
  const hasContactActions = data.length > 0 && data[0].phone;
  const whatsappMessage = encodeURIComponent("Welcome To Gd Matka How Can I Help you");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all duration-300">
        <div className="p-5 border-b flex justify-between items-center bg-indigo-50 rounded-t-xl">
          <h2 className="text-xl font-extrabold text-indigo-800">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="close" className="text-gray-600 hover:text-red-500 text-2xl font-bold">&times;</Button>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 p-3 border-b bg-gray-50">
            <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-1" /> Previous
            </Button>
            <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
            <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">
              Next <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        <div className="p-4 flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-indigo-600 sticky top-0 z-10 shadow-md">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                  {(hasActions || hasContactActions) && (
                    <th className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((item, index) => {
                  const uid = extractUserId(item);
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {headers.map((header) => {
                        let displayValue = (item as any)[header];
                        let cellClass = "p-3 whitespace-nowrap text-sm text-gray-900";

                        if (header === 'Session') {
                          const is_open = displayValue === 'OPEN';
                          cellClass += is_open
                            ? ' font-extrabold text-green-700'
                            : ' font-extrabold text-red-700';
                          displayValue = (
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${is_open ? 'bg-green-100' : 'bg-red-100'}`}>
                              {displayValue}
                            </span>
                          );
                        }

                        if (header === 'status' && typeof displayValue === 'string') {
                          const statusText = displayValue.toUpperCase();
                          const statusColor = statusText === 'APPROVED' || statusText === 'SETTLED' ? 'bg-green-100 text-green-800' :
                            statusText === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              statusText === 'REJECTED' || statusText === 'DECLINED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

                          displayValue = (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                              {statusText}
                            </span>
                          );
                        }

                        if (header === 'amount' && typeof displayValue === 'string' && displayValue.startsWith('₹')) {
                          cellClass += ' font-bold text-indigo-700';
                        }

                        return (
                          <td key={header} className={cellClass}>
                            {header === 'user' && uid ? (
                              <span
                                className="cursor-pointer text-indigo-600 hover:underline font-medium"
                                onClick={() => safeGoProfile(item)}
                              >
                                {item.user}
                              </span>
                            ) : (
                              displayValue
                            )}
                          </td>
                        );
                      })}

                      {(hasActions || hasContactActions) && (
                        <td className="p-3 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            {actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                size="sm"
                                className={`p-2 h-auto text-xs font-semibold ${action.color} disabled:opacity-50`}
                                onClick={() => action.onClick(item)}
                                disabled={action.disabled}
                                title={action.label}
                              >
                                {action.icon ? <span className='mr-1'>{action.icon}</span> : null}
                                {action.label.includes('User') ? null : action.label}
                              </Button>
                            ))}

                            {hasContactActions && item.phone && (
                              <>
                                <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(item.phone!)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Send WhatsApp Message">
                                  <MessageSquare size={18} />
                                </a>
                                <a href={`tel:${item.phone}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Call User">
                                  <Phone size={18} />
                                </a>
                              </>
                            )}

                            {uid && actions.length === 0 && (
                              <Button size="sm" variant="outline" className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => safeGoProfile(item)}>
                                <User size={14} />View
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t flex justify-between items-center">
          {totalPages > 1 && (
            <div className="flex items-center space-x-4">
              <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
                <ArrowLeft size={16} className="mr-1" /> Previous
              </Button>
              <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
              <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">
                Next <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
          <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">Close</Button>
        </div>
      </div>
    </div>
  );
};

const ReportStat = ({ label, value, isProfit = false, onViewClick }: { label: string; value: number | undefined; isProfit?: boolean; onViewClick?: () => void; }) => {
  const numericValue = typeof value === 'number' ? value : 0;
  const formattedValue = numericValue.toLocaleString('en-IN');
  const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
  const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`p-3 rounded-lg flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
      <span className={`text-sm font-medium ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
      <div className="flex items-center space-x-2">
        <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
        {onViewClick && (
          <Button size="sm" variant="outline" onClick={onViewClick} className={`${isProfit ? 'bg-white text-gray-800 hover:bg-gray-100' : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}>
            View
          </Button>
        )}
      </div>
    </div>
  );
};

// --- Main Dashboard Page Component ---
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topStats, setTopStats] = useState<TopStats | null>(null);
  const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
  const [reportStats, setReportStats] = useState<GameReportStats | null>(null);

  // ✅ yahan pe LOCAL DATE use ho raha hai (ISO/UTC nahi)
  const [reportDate, setReportDate] = useState(getLocalDateString());
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedBetType, setSelectedBetType] = useState('All');
  const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [currentDate] = useState(getLocalDateString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalRawData, setModalRawData] = useState<any[]>([]);
  const [modalData, setModalData] = useState<ModalData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalActions, setModalActions] = useState<ActionButton[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 500;

  const currentModalData = useMemo(() => {
    if (!modalData || modalTitle !== "Bids") return modalData;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return modalData.slice(startIndex, endIndex);
  }, [modalData, currentPage, modalTitle]);

  const totalPages = useMemo(() => {
    if (!modalData || modalTitle !== "Bids") return 1;
    return Math.ceil(modalData.length / ITEMS_PER_PAGE);
  }, [modalData, modalTitle]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    const fetchData = async (date = currentDate) => {
      setLoading(true);
      try {
        const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
          fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setTopStats(data);
          setTodayStats(data);
        }
        if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
        if (marketsRes.ok) {
          const marketsData = await marketsRes.json();
          setMarkets(marketsData);
          if (marketsData.length > 0) setSelectedMarket(marketsData[0].market_name);
        }
      } catch (error) { console.error("Fetch failed:", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [router, currentDate]);

  const handleViewProfile = (userId: number) => { router.push(`/user-management/${userId}`); };

  const fetchAnkBets = async (marketName: string, date: string) => {
    if (!marketName || !date) return;
    setBetsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch ank bets');
      setSingleAnkBets(await response.json());
    } catch (error) { console.error("Error fetching ank bets:", error); setSingleAnkBets([]); }
    finally { setBetsLoading(false); }
  };

  useEffect(() => { if (selectedMarket && reportDate) fetchAnkBets(selectedMarket, reportDate); }, [selectedMarket, reportDate]);

  const handleGetReport = async () => {
    setIsReportLoading(true);
    setReportStats(null);
    setFundHistory([]);
    const token = localStorage.getItem('token');
    try {
      const [summaryRes, fundHistoryRes] = await Promise.all([
        fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (summaryRes.ok) setReportStats(await summaryRes.json());
      if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
    } catch (error) { console.error("Failed to fetch report:", error); }
    finally { setIsReportLoading(false); }
  };

  const handleWithdrawalAction = async (item: ModalData, action: 'approve' | 'decline') => {
    if (!item.withdrawal_id) { alert("Invalid Withdrawal ID"); return; }
    if (!window.confirm(`Are you sure you want to ${action} withdrawal ID #${item.withdrawal_id}?`)) return;

    setModalLoading(true);
    const token = localStorage.getItem('token');
    const endpoint = action === 'approve' ? 'approve' : 'decline';

    try {
      const res = await fetch(`https://backend.gdmatka.site/api/withdrawals/${endpoint}/${item.withdrawal_id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${action} withdrawal.`);
      }

      alert(`Withdrawal ID #${item.withdrawal_id} ${action}d successfully.`);

      setModalData(prevData => prevData.filter(d => d.withdrawal_id !== item.withdrawal_id));
      handleGetReport();
      if (modalData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error(`Withdrawal ${action} error:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewClick = async (type: string, title: string) => {
    const token = localStorage.getItem('token');
    setIsModalOpen(true);
    setModalTitle(title);
    setModalLoading(true);
    setModalActions([]);
    setCurrentPage(1);

    try {
      const url = `https://backend.gdmatka.site/api/${type}?date=${reportDate}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Failed to fetch ${type}`);
      const data: any[] = await response.json();

      setModalRawData(data);

      let formattedData: ModalData[] = [];
      let actions: ActionButton[] = [];

      if (type.startsWith('bids')) {
        formattedData = data.map((item: any) => ({
          user_id: item.user_id,
          user: item.full_name || item.phone_number || item.email,
          'Market Name': item.market_name,
          'Session': (item.game_name?.toLowerCase().includes('open')) ? 'OPEN' : (item.game_name?.toLowerCase().includes('close')) ? 'CLOSE' : (item.bet_type?.toLowerCase().includes('open')) ? 'OPEN' : (item.bet_type?.toLowerCase().includes('close')) ? 'CLOSE' : 'UNKNOWN',
          'Game Type': item.game_name,
          'Bet Digit': item.first_number + (item.second_number ? ` | ${item.second_number}` : ''),
          Points: formatCurrency(item.points),
          status: item.status,
          'Win/Loss': item.status === 'won' ? `+${formatCurrency(item.amount_won)}` : (item.status === 'lost' ? `-${formatCurrency(item.points)}` : 'N/A'),
          date: new Date(item.created_at || item.createdat).toLocaleString(),
        }));
      } else if (type === 'withdrawals/pending') {
        formattedData = data.map((item: any) => ({
          user_id: item.user_id,
          withdrawal_id: item.withdrawal_id,
          user: item.full_name || item.phone_number || 'N/A',
          phone: item.phone_number,
          amount: formatCurrency(item.amount || item.withdrawal_amount),
          status: item.status || item.withdrawal_status,
          date: new Date(item.created_at || item.createdat).toLocaleString(),
          payment_method: item.bank_name || item.phonepe_number ? 'Bank/UPI' : 'N/A',
        }));

        actions = [
          { label: "Accept", onClick: (item) => handleWithdrawalAction(item, 'approve'), color: 'bg-green-600 hover:bg-green-700', icon: <Check size={14} /> },
          { label: "Decline", onClick: (item) => handleWithdrawalAction(item, 'decline'), color: 'bg-red-600 hover:bg-red-700', icon: <X size={14} /> },
          { label: "View User", onClick: (item) => handleViewProfile(extractUserId(item)!), color: 'bg-indigo-600 hover:bg-indigo-700', icon: <User size={14} /> },
        ];
        setModalActions(actions);

      } else if (type.startsWith('users/')) {
        formattedData = data.map((item: any) => ({
          user_id: item.user_id,
          user: item.full_name || 'N/A',
          phone: item.phone_number,
          wallet: formatCurrency(item.wallet_balance || 0),
          status: item.status,
        }));
        actions = [
          { label: "View User", onClick: (item) => handleViewProfile(extractUserId(item)!), color: 'bg-indigo-600 hover:bg-indigo-700', icon: <User size={14} /> }
        ];
        setModalActions(actions);
      } else {
        formattedData = data.map((item: any) => ({
          user_id: item.user_id,
          user: item.full_name || item.phone_number || item.email,
          phone: item.phone_number,
          amount: formatCurrency(item.amount || item.withdrawal_amount || 0),
          status: item.status || item.withdrawal_status,
          date: new Date(item.created_at || item.createdat).toLocaleString(),
        }));
        actions = [
          { label: "View User", onClick: (item) => handleViewProfile(extractUserId(item)!), color: 'bg-indigo-600 hover:bg-indigo-700', icon: <User size={14} /> }
        ];
        setModalActions(actions);
      }
      setModalData(formattedData);
    } catch (error) { console.error(`Error fetching ${title}:`, error); setModalData([]); }
    finally { setModalLoading(false); }
  };

  const displayStats = reportStats || todayStats;

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  const reportItems = [
    { label: "Total Bid Amount", value: displayStats?.total_bid_amount, onClick: () => handleViewClick('bids/today', "Bids") },
    { label: "Withdraw Request", value: displayStats?.withdraw_request, onClick: () => handleViewClick('withdrawals/pending', "Pending Withdrawals") },
    { label: "Total Winning Amount", value: displayStats?.total_winning_amount, onClick: () => handleViewClick('bids/winning/today', "Winning Bids") },
    { label: "Total Deposit (Approved)", value: displayStats?.total_deposit_approved, onClick: () => handleViewClick('deposits/approved/today', "Approved Deposits") },
    { label: "Total Profit Amount", value: displayStats?.total_profit, isProfit: true },
    { label: "Add Funds ( Manually )", value: displayStats?.add_funds_manually, onClick: () => handleViewClick('funds/manual/today', "Manual Fund Additions") },
    { label: "Total Wallet Balance", value: displayStats?.total_wallet_balance },
    { label: "Total Withdraw", value: displayStats?.total_withdraw, onClick: () => handleViewClick('withdrawals/settled/today', "Settled Withdrawals") },
  ];

  return (
    <div className="space-y-6">
      <DetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        data={modalTitle === "Bids" ? currentModalData : modalData}
        loading={modalLoading}
        onViewProfile={handleViewProfile}
        actions={modalActions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Welcome Card */}
      <Card className="p-6 shadow-lg rounded-xl overflow-hidden border-t-4 border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="space-y-2 mb-4 md:mb-0 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800">नमस्ते, GD Matka Admin!</h1>
          </div>
          <div className="relative w-48 h-32 hidden md:block">
            <Image src="/admin.png" alt="Illustration" layout="fill" objectFit="contain" />
          </div>
        </div>
        <hr className="my-4" />
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image
                src="/jobprofile.png"
                alt="Admin Profile"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <p className="font-semibold text-gray-700">Admin GD MATKA</p>
          </div>
          <div className="flex gap-8 text-center mt-4 md:mt-0">
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-500">Unapproved Users</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
              <p className="text-sm text-gray-500">Approved Users</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: "Users", value: topStats?.overall_users, icon: Users, onClick: () => router.push('/user-management') },
          { title: "Today Registration", value: topStats?.today_users, icon: UserPlus, onClick: () => handleViewClick('users/registered-today', "Today's Registrations") },
          { title: "Games", value: 19, icon: Gamepad, onClick: () => { } },
          { title: "Players (Today)", value: topStats?.unique_emails_today, icon: ClipboardList, onClick: () => handleViewClick('users/active-today', "Today's Active Players") },
          { title: "Total Bet Player", value: topStats?.total_bet_players, icon: Sword, onClick: () => handleViewClick('users/total-bet-players', 'Total Bet Players') },
          { title: "Total Bet Not Player", value: topStats?.total_bet_not_players, icon: ShieldOff, onClick: () => handleViewClick('users/total-not-bet-players', 'Total Bet Not Players') },
          { title: "Today Reg. Player", value: topStats?.today_registered_players, icon: User, onClick: () => handleViewClick('users/today-registered-players', "Today's New Players") },
        ].map((card, index) => (
          <Card key={index} onClick={card.onClick} className="p-4 bg-white shadow-sm rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value ?? '0'}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Total Bids On Single Ank */}
      <Card className="p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-lg font-bold text-gray-700 mb-4">
          Total Bids On Single Ank Of Date {new Date(reportDate).toLocaleDateString('en-GB')}
        </h2>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select value={selectedBetType} onChange={(e) => setSelectedBetType(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full sm:w-auto focus:border-indigo-500 focus:ring-indigo-500 transition-colors">
            <option value="All">All</option>
            <option value="Open">Open</option>
            <option value="Close">Close</option>
          </select>
          <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full sm:w-auto focus:border-indigo-500 focus:ring-indigo-500 transition-colors">
            <option value="">-Select Market-</option>
            {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
          </select>
        </div>
        {betsLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" /></div> : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {singleAnkBets.map((bet) => {
              let totalBids = 0, totalAmount = 0;
              if (selectedBetType === 'Open') { totalBids = bet.total_open_bets; totalAmount = bet.total_open_points; }
              else if (selectedBetType === 'Close') { totalBids = bet.total_closed_bets; totalAmount = bet.total_closed_points; }
              else { totalBids = bet.total_open_bets + bet.total_closed_bets; totalAmount = bet.total_open_points + bet.total_closed_points; }

              const colorIndex = bet.ank % 5;
              const bgColor = ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][colorIndex];
              const ankColor = ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][colorIndex];

              return (
                <div key={bet.ank} className="p-4 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: bgColor }}>
                  <p className="text-sm text-gray-600">Total Bids: <span className="font-bold text-gray-800">{totalBids}</span></p>
                  <p className="text-sm text-gray-600">Total Bid Amount: <span className="font-bold text-gray-800">{totalAmount}</span></p>
                  <div className="mt-3 text-center font-extrabold text-2xl py-2 rounded-lg text-white shadow-md" style={{ backgroundColor: ankColor }}>
                    Ank {bet.ank}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Game Report */}
      <Card className="p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
          />
          <Button onClick={handleGetReport} disabled={isReportLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isReportLoading && <Loader2 className="animate-spin mr-2" size={16} />}
            Get Report
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setReportStats(null);
              const today = getLocalDateString(); // ✅ clear pe bhi local date
              setReportDate(today);
            }}
            className="text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            CLEAR
          </Button>
        </div>
        {isReportLoading ? <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin text-indigo-600" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportItems.map((item, index) => (
              <ReportStat
                key={index}
                label={item.label}
                value={item.value}
                isProfit={item.isProfit}
                onViewClick={item.onClick}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Fund Request Auto Deposit History */}
      <Card className="p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History (Approved)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">User</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fundHistory.filter(item => item.status === 'APPROVED').map((item, index) => {
                const uid = extractUserId(item);
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      {uid ? (
                        <span className="cursor-pointer text-indigo-600 hover:underline font-medium" onClick={() => handleViewProfile(uid)}>
                          {item.full_name || 'Unknown'}
                        </span>
                      ) : (
                        <span>{item.full_name || 'Unknown'}</span>
                      )}
                    </td>
                    <td className="p-3">{item.phone_number || 'N/A'}</td>
                    <td className="p-3 font-semibold text-green-700">₹{Number(item.amount).toFixed(2)}</td>
                    <td className="p-3 text-gray-600">{new Date(item.createdat).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => uid && handleViewProfile(uid)} disabled={!uid}>
                        <User size={14} />View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}



// "use client";

// import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus, Sword, ShieldOff, MessageSquare, Phone, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
// import Image from 'next/image';
// import Link from 'next/link';

// // --- सभी Interfaces और Helper Components ---
// interface ModalData {
//   user_id?: number | string | null;
//   user: string;
//   phone?: string;
//   amount?: string | number; // amount को number भी हो सकता है
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   'Session'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
//   // Actions के लिए आवश्यक नए फ़ील्ड
//   rawItem?: any;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: ModalData) => void;
//   color: string;
//   icon?: React.ReactNode;
//   disabled?: boolean;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
//   // Pagination Props
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
// }
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
//   total_bet_players: number;
//   total_bet_not_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// const formatPhoneNumberForWhatsApp = (phone: string) => {
//   if (!phone) return '';
//   const cleaned = phone.replace(/\D/g, "");
//   if (cleaned.length === 10) {
//     return `91${cleaned}`;
//   }
//   return cleaned;
// };

// const formatCurrency = (v: number | string | undefined) => {
//   const n = typeof v === "string" ? Number(v) : v;
//   if (isNaN(n ?? NaN)) return "₹0.00";
//   return `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// };

// // ---- बदला हुआ DetailsModal Component (पेजिनेशन और एक्शन के साथ) ----
// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions, currentPage, totalPages, onPageChange }: DetailsModalProps) => {
//   if (!isOpen) return null;

//   // केवल पहली वस्तु से हेडर निकालते हैं और 'user_id' और 'withdrawal_id' को फ़िल्टर करते हैं
//   const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id' && key !== 'rawItem') : [];

//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   const hasActions = actions.length > 0;
//   const hasContactActions = data.length > 0 && data[0].phone;
//   const whatsappMessage = encodeURIComponent("Welcome To Gd Matka How Can I Help you");

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all duration-300">
//         <div className="p-5 border-b flex justify-between items-center bg-indigo-50 rounded-t-xl">
//           <h2 className="text-xl font-extrabold text-indigo-800">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close" className="text-gray-600 hover:text-red-500 text-2xl font-bold">&times;</Button>
//         </div>

//         {/* Pagination Controls (Top) */}
//         {totalPages > 1 && (
//           <div className="flex justify-center items-center space-x-4 p-3 border-b bg-gray-50">
//             <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
//               <ArrowLeft size={16} className="mr-1" /> Previous
//             </Button>
//             <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
//             <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">
//               Next <ArrowRight size={16} className="ml-1" />
//             </Button>
//           </div>
//         )}

//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-100">
//               <thead className="bg-indigo-600 sticky top-0 z-10 shadow-md">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
//                       {header}
//                     </th>
//                   ))}
//                   {(hasActions || hasContactActions) && (
//                     <th className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
//                       Actions
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-100">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index} className="hover:bg-gray-50 transition-colors">
//                       {headers.map((header) => {
//                         let displayValue = (item as any)[header];
//                         let cellClass = "p-3 whitespace-nowrap text-sm text-gray-900";

//                         // Session Column Styling
//                         if (header === 'Session') {
//                           const is_open = displayValue === 'OPEN';
//                           cellClass += is_open
//                             ? ' font-extrabold text-green-700'
//                             : ' font-extrabold text-red-700';
//                           displayValue = (
//                             <span className={`px-2 py-1 text-xs font-bold rounded-full ${is_open ? 'bg-green-100' : 'bg-red-100'}`}>
//                               {displayValue}
//                             </span>
//                           );
//                         }

//                         // Status Column Styling
//                         if (header === 'status' && typeof displayValue === 'string') {
//                           const statusText = displayValue.toUpperCase();
//                           const statusColor = statusText === 'APPROVED' || statusText === 'SETTLED' ? 'bg-green-100 text-green-800' :
//                             statusText === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                               statusText === 'REJECTED' || statusText === 'DECLINED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

//                           displayValue = (
//                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
//                               {statusText}
//                             </span>
//                           );
//                         }
//                         // Amount Column Styling
//                         if (header === 'amount' && typeof displayValue === 'string' && displayValue.startsWith('₹')) {
//                           cellClass += ' font-bold text-indigo-700';
//                         }

//                         return (
//                           <td key={header} className={cellClass}>
//                             {header === 'user' && uid ? (
//                               <span
//                                 className="cursor-pointer text-indigo-600 hover:underline font-medium"
//                                 onClick={() => safeGoProfile(item)}
//                               >
//                                 {item.user}
//                               </span>
//                             ) : (
//                               displayValue
//                             )}
//                           </td>
//                         );
//                       })}

//                       {/* Actions Column */}
//                       {(hasActions || hasContactActions) && (
//                         <td className="p-3 whitespace-nowrap text-sm">
//                           <div className="flex items-center space-x-2">
//                             {/* Custom Actions (Accept/Decline) */}
//                             {actions.map((action, actionIndex) => (
//                               <Button
//                                 key={actionIndex}
//                                 size="sm"
//                                 className={`p-2 h-auto text-xs font-semibold ${action.color} disabled:opacity-50`}
//                                 onClick={() => action.onClick(item)}
//                                 disabled={action.disabled}
//                                 title={action.label}
//                               >
//                                 {action.icon ? <span className='mr-1'>{action.icon}</span> : null}
//                                 {action.label.includes('User') ? null : action.label} {/* छोटे स्क्रीन के लिए सिर्फ आइकन */}
//                               </Button>
//                             ))}

//                             {/* Contact Actions (WhatsApp/Call) */}
//                             {hasContactActions && item.phone && (
//                               <>
//                                 <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(item.phone!)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Send WhatsApp Message">
//                                   <MessageSquare size={18} />
//                                 </a>
//                                 <a href={`tel:${item.phone}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Call User">
//                                   <Phone size={18} />
//                                 </a>
//                               </>
//                             )}

//                             {/* View User Profile (अगर Custom Action नहीं है) */}
//                             {uid && actions.length === 0 && (
//                               <Button size="sm" variant="outline" className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => safeGoProfile(item)}>
//                                 <User size={14} />View
//                               </Button>
//                             )}
//                           </div>
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-between items-center">
//           {/* Pagination Controls (Bottom) */}
//           {totalPages > 1 && (
//             <div className="flex items-center space-x-4">
//               <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
//                 <ArrowLeft size={16} className="mr-1" /> Previous
//               </Button>
//               <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
//               <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">
//                 Next <ArrowRight size={16} className="ml-1" />
//               </Button>
//             </div>
//           )}
//           <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// };


// const ReportStat = ({ label, value, isProfit = false, onViewClick }: { label: string; value: number | undefined; isProfit?: boolean; onViewClick?: () => void; }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString('en-IN');
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-3 rounded-lg flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm font-medium ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick} className={`${isProfit ? 'bg-white text-gray-800 hover:bg-gray-100' : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [selectedBetType, setSelectedBetType] = useState('All');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);

//   // ▼▼▼ Modal/Pagination State ▼▼▼
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalRawData, setModalRawData] = useState<any[]>([]); // API से प्राप्त पूरा डेटा
//   const [modalData, setModalData] = useState<ModalData[]>([]); // फॉर्मेट किया हुआ डेटा
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const ITEMS_PER_PAGE = 500; // बिड के लिए 500 आइटम प्रति पेज
//   // ▲▲▲ Modal/Pagination State ▲▲▲


//   // ▼▼▼ Pagination Logic ▼▼▼
//   const currentModalData = useMemo(() => {
//     if (!modalData || modalTitle !== "Bids") return modalData; // सिर्फ Bids के लिए पेजिनेशन
//     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//     const endIndex = startIndex + ITEMS_PER_PAGE;
//     return modalData.slice(startIndex, endIndex);
//   }, [modalData, currentPage, modalTitle]);

//   const totalPages = useMemo(() => {
//     if (!modalData || modalTitle !== "Bids") return 1;
//     return Math.ceil(modalData.length / ITEMS_PER_PAGE);
//   }, [modalData, modalTitle]);
//   // ▲▲▲ Pagination Logic ▲▲▲

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/');
//       return;
//     }
//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);
//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats(data);
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) setSelectedMarket(marketsData[0].market_name);
//         }
//       } catch (error) { console.error("Fetch failed:", error); }
//       finally { setLoading(false); }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const handleViewProfile = (userId: number) => { router.push(`/user-management/${userId}`); };

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) { console.error("Error fetching ank bets:", error); setSingleAnkBets([]); }
//     finally { setBetsLoading(false); }
//   };

//   useEffect(() => { if (selectedMarket && reportDate) fetchAnkBets(selectedMarket, reportDate); }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]);
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) { console.error("Failed to fetch report:", error); }
//     finally { setIsReportLoading(false); }
//   };

//   // ▼▼▼ विथड्रॉल रिक्वेस्ट को हैंडल करने वाला नया फंक्शन ▼▼▼
//   const handleWithdrawalAction = async (item: ModalData, action: 'approve' | 'decline') => {
//     if (!item.withdrawal_id) { alert("Invalid Withdrawal ID"); return; }
//     if (!window.confirm(`Are you sure you want to ${action} withdrawal ID #${item.withdrawal_id}?`)) return;

//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     const endpoint = action === 'approve' ? 'approve' : 'decline';

//     try {
//       const res = await fetch(`https://backend.gdmatka.site/api/withdrawals/${endpoint}/${item.withdrawal_id}`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` }
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.message || `Failed to ${action} withdrawal.`);
//       }

//       alert(`Withdrawal ID #${item.withdrawal_id} ${action}d successfully.`);

//       // Modal data को लोकल रूप से अपडेट करें और रीलोड करें
//       setModalData(prevData => prevData.filter(d => d.withdrawal_id !== item.withdrawal_id));
//       handleGetReport(); // रिपोर्ट को रीफ्रेश करें
//       if (modalData.length === 1 && currentPage > 1) { // अगर आखिरी आइटम हट गया
//         setCurrentPage(currentPage - 1);
//       } else {
//         setCurrentPage(1); // पेजिनेशन को रीसेट करें
//       }
//     } catch (error: any) {
//       console.error(`Withdrawal ${action} error:`, error);
//       alert(`Error: ${error.message}`);
//     } finally {
//       setModalLoading(false);
//     }
//   };
//   // ▲▲▲ विथड्रॉल रिक्वेस्ट को हैंडल करने वाला नया फंक्शन ▲▲▲

//   // ▼▼▼ handleViewClick में बदलाव (पेजिनेशन और एक्शन सेट करने के लिए) ▼▼▼
//   const handleViewClick = async (type: string, title: string) => {
//     const token = localStorage.getItem('token');
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     setModalActions([]); // हर बार रीसेट करें
//     setCurrentPage(1); // हर बार रीसेट करें

//     try {
//       const url = `https://backend.gdmatka.site/api/${type}?date=${reportDate}`;
//       const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data: any[] = await response.json();

//       setModalRawData(data); // पूरे डेटा को स्टोर करें

//       let formattedData: ModalData[] = [];
//       let actions: ActionButton[] = [];

//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           'Market Name': item.market_name,
//           'Session': (item.game_name?.toLowerCase().includes('open')) ? 'OPEN' : (item.game_name?.toLowerCase().includes('close')) ? 'CLOSE' : (item.bet_type?.toLowerCase().includes('open')) ? 'OPEN' : (item.bet_type?.toLowerCase().includes('close')) ? 'CLOSE' : 'UNKNOWN',
//           'Game Type': item.game_name,
//           'Bet Digit': item.first_number + (item.second_number ? ` | ${item.second_number}` : ''),
//           Points: formatCurrency(item.points),
//           status: item.status,
//           'Win/Loss': item.status === 'won' ? `+${formatCurrency(item.amount_won)}` : (item.status === 'lost' ? `-${formatCurrency(item.points)}` : 'N/A'),
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//       } else if (type === 'withdrawals/pending') { // Withdrawal Request के लिए लॉजिक
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           withdrawal_id: item.withdrawal_id,
//           user: item.full_name || item.phone_number || 'N/A',
//           phone: item.phone_number,
//           amount: formatCurrency(item.amount || item.withdrawal_amount),
//           status: item.status || item.withdrawal_status,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//           payment_method: item.bank_name || item.phonepe_number ? 'Bank/UPI' : 'N/A',
//         }));

//         // Withdrawal Actions सेट करें
//         actions = [
//           { label: "Accept", onClick: (item) => handleWithdrawalAction(item, 'approve'), color: 'bg-green-600 hover:bg-green-700', icon: <Check size={14} /> },
//           { label: "Decline", onClick: (item) => handleWithdrawalAction(item, 'decline'), color: 'bg-red-600 hover:bg-red-700', icon: <X size={14} /> },
//           { label: "View User", onClick: (item) => handleViewProfile(extractUserId(item)!), color: 'bg-indigo-600 hover:bg-indigo-700', icon: <User size={14} /> },
//         ];
//         setModalActions(actions);

//       } else if (type.startsWith('users/')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || 'N/A',
//           phone: item.phone_number,
//           wallet: formatCurrency(item.wallet_balance || 0),
//           status: item.status,
//         }));
//         // User Actions सेट करें (केवल View)
//         actions = [
//           { label: "View User", onClick: (item) => handleViewProfile(extractUserId(item)!), color: 'bg-indigo-600 hover:bg-indigo-700', icon: <User size={14} /> }
//         ];
//         setModalActions(actions);
//       } else { // बाकी सभी के लिए सामान्य लॉजिक
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: formatCurrency(item.amount || item.withdrawal_amount || 0),
//           status: item.status || item.withdrawal_status,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//         // User Actions सेट करें (केवल View)
//         actions = [
//           { label: "View User", onClick: (item) => handleViewProfile(extractUserId(item)!), color: 'bg-indigo-600 hover:bg-indigo-700', icon: <User size={14} /> }
//         ];
//         setModalActions(actions);
//       }
//       setModalData(formattedData);
//     } catch (error) { console.error(`Error fetching ${title}:`, error); setModalData([]); }
//     finally { setModalLoading(false); }
//   };
//   // ▲▲▲ handleViewClick में बदलाव ▲▲▲

//   const displayStats = reportStats || todayStats;

//   if (loading) {
//     return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
//   }

//   const reportItems = [
//     { label: "Total Bid Amount", value: displayStats?.total_bid_amount, onClick: () => handleViewClick('bids/today', "Bids") },
//     { label: "Withdraw Request", value: displayStats?.withdraw_request, onClick: () => handleViewClick('withdrawals/pending', "Pending Withdrawals") },
//     { label: "Total Winning Amount", value: displayStats?.total_winning_amount, onClick: () => handleViewClick('bids/winning/today', "Winning Bids") },
//     { label: "Total Deposit (Approved)", value: displayStats?.total_deposit_approved, onClick: () => handleViewClick('deposits/approved/today', "Approved Deposits") },
//     { label: "Total Profit Amount", value: displayStats?.total_profit, isProfit: true },
//     { label: "Add Funds ( Manually )", value: displayStats?.add_funds_manually, onClick: () => handleViewClick('funds/manual/today', "Manual Fund Additions") },
//     { label: "Total Wallet Balance", value: displayStats?.total_wallet_balance },
//     { label: "Total Withdraw", value: displayStats?.total_withdraw, onClick: () => handleViewClick('withdrawals/settled/today', "Settled Withdrawals") },
//   ];

//   return (
//     <div className="space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         // Bid Data के लिए currentModalData का उपयोग करें, बाकी के लिए modalData का
//         data={modalTitle === "Bids" ? currentModalData : modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//         actions={modalActions}
//         // Pagination Props
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={setCurrentPage}
//       />

//       {/* Welcome Card */}
//       <Card className="p-6 shadow-lg rounded-xl overflow-hidden border-t-4 border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="flex flex-col md:flex-row justify-between items-center">
//           <div className="space-y-2 mb-4 md:mb-0 text-center md:text-left">
//             <h1 className="text-3xl font-bold text-gray-800">नमस्ते, GD Matka Admin!</h1>
//           </div>
//           <div className="relative w-48 h-32 hidden md:block">
//             <Image src="/admin.png" alt="Illustration" layout="fill" objectFit="contain" />
//           </div>
//         </div>
//         <hr className="my-4" />
//         <div className="flex flex-col md:flex-row justify-between items-center">
//           <div className="flex items-center gap-4">
//             <div className="relative w-12 h-12 rounded-full overflow-hidden">
//               <Image
//                 src="/jobprofile.png"
//                 alt="Admin Profile"
//                 layout="fill"
//                 objectFit="cover"
//               />
//             </div>
//             <p className="font-semibold text-gray-700">Admin GD MATKA</p>
//           </div>
//           <div className="flex gap-8 text-center mt-4 md:mt-0">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//         {[{ title: "Users", value: topStats?.overall_users, icon: Users, onClick: () => router.push('/user-management') }, { title: "Today Registration", value: topStats?.today_users, icon: UserPlus, onClick: () => handleViewClick('users/registered-today', "Today's Registrations") }, { title: "Games", value: 19, icon: Gamepad, onClick: () => { } }, { title: "Players (Today)", value: topStats?.unique_emails_today, icon: ClipboardList, onClick: () => handleViewClick('users/active-today', "Today's Active Players") }, { title: "Total Bet Player", value: topStats?.total_bet_players, icon: Sword, onClick: () => handleViewClick('users/total-bet-players', 'Total Bet Players') }, { title: "Total Bet Not Player", value: topStats?.total_bet_not_players, icon: ShieldOff, onClick: () => handleViewClick('users/total-not-bet-players', 'Total Bet Not Players') }, { title: "Today Reg. Player", value: topStats?.today_registered_players, icon: User, onClick: () => handleViewClick('users/today-registered-players', "Today's New Players") },].map((card, index) => (<Card key={index} onClick={card.onClick} className="p-4 bg-white shadow-sm rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"><div className="p-3 rounded-lg bg-indigo-100 text-indigo-600"><card.icon size={24} /></div><div><p className="text-gray-500 text-sm">{card.title}</p><p className="text-2xl font-bold text-gray-800">{card.value ?? '0'}</p></div></Card>))}
//       </div>

//       {/* Total Bids On Single Ank */}
//       <Card className="p-6 bg-white shadow-lg rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Total Bids On Single Ank Of Date {new Date(reportDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select value={selectedBetType} onChange={(e) => setSelectedBetType(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full sm:w-auto focus:border-indigo-500 focus:ring-indigo-500 transition-colors">
//             <option value="All">All</option>
//             <option value="Open">Open</option>
//             <option value="Close">Close</option>
//           </select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full sm:w-auto focus:border-indigo-500 focus:ring-indigo-500 transition-colors">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" /></div> : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               let totalBids = 0, totalAmount = 0;
//               if (selectedBetType === 'Open') { totalBids = bet.total_open_bets; totalAmount = bet.total_open_points; }
//               else if (selectedBetType === 'Close') { totalBids = bet.total_closed_bets; totalAmount = bet.total_closed_points; }
//               else { totalBids = bet.total_open_bets + bet.total_closed_bets; totalAmount = bet.total_open_points + bet.total_closed_points; }

//               const colorIndex = bet.ank % 5;
//               const bgColor = ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][colorIndex];
//               const ankColor = ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][colorIndex];

//               return (
//                 <div key={bet.ank} className="p-4 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: bgColor }}>
//                   <p className="text-sm text-gray-600">Total Bids: <span className="font-bold text-gray-800">{totalBids}</span></p>
//                   <p className="text-sm text-gray-600">Total Bid Amount: <span className="font-bold text-gray-800">{totalAmount}</span></p>
//                   <div className="mt-3 text-center font-extrabold text-2xl py-2 rounded-lg text-white shadow-md" style={{ backgroundColor: ankColor }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </Card>

//       {/* Game Report */}
//       <Card className="p-6 bg-white shadow-lg rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input
//             type="date"
//             value={reportDate}
//             onChange={(e) => setReportDate(e.target.value)}
//             className="p-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
//           />
//           <Button onClick={handleGetReport} disabled={isReportLoading} className="bg-indigo-600 hover:bg-indigo-700">
//             {isReportLoading && <Loader2 className="animate-spin mr-2" size={16} />}
//             Get Report
//           </Button>
//           <Button variant="outline" onClick={() => { setReportStats(null); setReportDate(currentDate); }} className="text-gray-600 border-gray-300 hover:bg-gray-100">
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin text-indigo-600" /></div> : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {reportItems.map((item, index) => (
//               <ReportStat
//                 key={index}
//                 label={item.label}
//                 value={item.value}
//                 isProfit={item.isProfit}
//                 onViewClick={item.onClick}
//               />
//             ))}
//           </div>
//         )}
//       </Card>

//       {/* Fund Request Auto Deposit History */}
//       <Card className="p-6 bg-white shadow-lg rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History (Approved)</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-100 sticky top-0">
//               <tr>
//                 <th className="p-3">#</th>
//                 <th className="p-3">User</th>
//                 <th className="p-3">Mobile</th>
//                 <th className="p-3">Amount</th>
//                 <th className="p-3">Date</th>
//                 <th className="p-3">Status</th>
//                 <th className="p-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory.filter(item => item.status === 'APPROVED').map((item, index) => {
//                 const uid = extractUserId(item);
//                 return (
//                   <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
//                     <td className="p-3">{index + 1}</td>
//                     <td className="p-3">
//                       {uid ? (
//                         <span className="cursor-pointer text-indigo-600 hover:underline font-medium" onClick={() => handleViewProfile(uid)}>
//                           {item.full_name || 'Unknown'}
//                         </span>
//                       ) : (
//                         <span>{item.full_name || 'Unknown'}</span>
//                       )}
//                     </td>
//                     <td className="p-3">{item.phone_number || 'N/A'}</td>
//                     <td className="p-3 font-semibold text-green-700">₹{Number(item.amount).toFixed(2)}</td>
//                     <td className="p-3 text-gray-600">{new Date(item.createdat).toLocaleString()}</td>
//                     <td className="p-3">
//                       <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
//                         {item.status}
//                       </span>
//                     </td>
//                     <td className="p-3">
//                       <Button size="sm" variant="outline" className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => uid && handleViewProfile(uid)} disabled={!uid}>
//                         <User size={14} />View
//                       </Button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }


// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus, Sword, ShieldOff, MessageSquare, Phone } from 'lucide-react';
// import Image from 'next/image';
// import Link from 'next/link';

// // --- सभी Interfaces और Helper Components ---
// interface ModalData {
//   user_id?: number | string | null;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   'Session'?: string; // <--- नया इंटरफेस फ़ील्ड
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
//   total_bet_players: number;
//   total_bet_not_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// // WhatsApp के लिए फ़ोन नंबर फॉर्मेट करने वाला फंक्शन
// const formatPhoneNumberForWhatsApp = (phone: string) => {
//   if (!phone) return '';
//   const cleaned = phone.replace(/\D/g, "");
//   if (cleaned.length === 10) {
//     return `91${cleaned}`;
//   }
//   return cleaned;
// };

// // ---- बदला हुआ DetailsModal Component ----
// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;
//   const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id') : [];
//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   const hasContactActions = data.length > 0 && data[0].phone;
//   const whatsappMessage = encodeURIComponent("Welcome To Gd Matka How Can I Help you");

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all duration-300">
//         <div className="p-5 border-b flex justify-between items-center bg-indigo-50 rounded-t-xl">
//           <h2 className="text-xl font-extrabold text-indigo-800">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close" className="text-gray-600 hover:text-red-500 text-2xl font-bold">&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-100">
//               <thead className="bg-indigo-600 sticky top-0 z-10 shadow-md">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                   {hasContactActions && (
//                     <th className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider">
//                       Actions
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-100">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index} className="hover:bg-gray-50 transition-colors">
//                       {headers.map((header) => {
//                         let displayValue = (item as any)[header];
//                         let cellClass = "p-3 whitespace-nowrap text-sm text-gray-900";

//                         // Session Column Styling
//                         if (header === 'Session') {
//                           const is_open = displayValue === 'OPEN';
//                           cellClass += is_open
//                             ? ' font-extrabold text-green-700'
//                             : ' font-extrabold text-red-700';
//                           displayValue = (
//                             <span className={`px-2 py-1 text-xs font-bold rounded-full ${is_open ? 'bg-green-100' : 'bg-red-100'}`}>
//                               {displayValue}
//                             </span>
//                           );
//                         }

//                         // Status Column Styling
//                         if (header === 'status' && typeof displayValue === 'string') {
//                           const statusText = displayValue.toUpperCase();
//                           const statusColor = statusText === 'APPROVED' ? 'bg-green-100 text-green-800' :
//                             statusText === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                               statusText === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

//                           displayValue = (
//                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
//                               {statusText}
//                             </span>
//                           );
//                         }

//                         return (
//                           <td key={header} className={cellClass}>
//                             {header === 'user' && uid ? (
//                               <span
//                                 className="cursor-pointer text-indigo-600 hover:underline font-medium"
//                                 onClick={() => safeGoProfile(item)}
//                               >
//                                 {item.user}
//                               </span>
//                             ) : (
//                               displayValue
//                             )}
//                           </td>
//                         );
//                       })}

//                       {/* WhatsApp and Call Buttons */}
//                       {hasContactActions && (
//                         <td className="p-3 whitespace-nowrap text-sm">
//                           <div className="flex items-center space-x-2">
//                             <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(item.phone!)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Send WhatsApp Message">
//                               <MessageSquare size={18} />
//                             </a>
//                             <a href={`tel:${item.phone}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Call User">
//                               <Phone size={18} />
//                             </a>
//                           </div>
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end"><Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">Close</Button></div>
//       </div>
//     </div>
//   );
// };

// const ReportStat = ({ label, value, isProfit = false, onViewClick }: { label: string; value: number | undefined; isProfit?: boolean; onViewClick?: () => void; }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString('en-IN');
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-3 rounded-lg flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm font-medium ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick} className={`${isProfit ? 'bg-white text-gray-800 hover:bg-gray-100' : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [selectedBetType, setSelectedBetType] = useState('All');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/');
//       return;
//     }
//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);
//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats(data);
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) setSelectedMarket(marketsData[0].market_name);
//         }
//       } catch (error) { console.error("Fetch failed:", error); }
//       finally { setLoading(false); }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const handleViewProfile = (userId: number) => { router.push(`/user-management/${userId}`); };

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) { console.error("Error fetching ank bets:", error); setSingleAnkBets([]); }
//     finally { setBetsLoading(false); }
//   };

//   useEffect(() => { if (selectedMarket && reportDate) fetchAnkBets(selectedMarket, reportDate); }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]);
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) { console.error("Failed to fetch report:", error); }
//     finally { setIsReportLoading(false); }
//   };
//   // ▼▼▼ यह फंक्शन बदला गया है ▼▼▼
//   const handleViewClick = async (type: string, title: string) => {
//     const token = localStorage.getItem('token');
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     try {
//       const url = `https://backend.gdmatka.site/api/${type}?date=${reportDate}`;
//       const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData: ModalData[] = [];

//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           'Market Name': item.market_name,
//           'Session': (item.game_name?.toLowerCase().includes('open')) ? 'OPEN' : (item.game_name?.toLowerCase().includes('close')) ? 'CLOSE' : (item.bet_type?.toLowerCase().includes('open')) ? 'OPEN' : (item.bet_type?.toLowerCase().includes('close')) ? 'CLOSE' : 'UNKNOWN',
//           'Game Type': item.game_name,
//           'Bet Digit': item.first_number + (item.second_number ? ` | ${item.second_number}` : ''),
//           'Points': `₹${Number(item.points).toFixed(2)}`,
//           status: item.status,
//           'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//       } else if (type.startsWith('users/')) { // यूज़र लिस्ट के लिए नया लॉजिक
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || 'N/A',
//           phone: item.phone_number,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`, // वॉलेट बैलेंस जोड़ा गया
//           status: item.status,
//         }));
//       } else { // बाकी सभी के लिए पुराना लॉजिक
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount || item.withdrawal_amount || 0).toFixed(2)}`,
//           status: item.status || item.withdrawal_status,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) { console.error(`Error fetching ${title}:`, error); setModalData([]); }
//     finally { setModalLoading(false); }
//   };
//   // ▲▲▲ बदलाव यहाँ समाप्त ▲▲▲


//   const displayStats = reportStats || todayStats;

//   if (loading) {
//     return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
//   }

//   const reportItems = [
//     { label: "Total Bid Amount", value: displayStats?.total_bid_amount, onClick: () => handleViewClick('bids/today', "Bids") },
//     { label: "Withdraw Request", value: displayStats?.withdraw_request, onClick: () => handleViewClick('withdrawals/pending', "Pending Withdrawals") },
//     { label: "Total Winning Amount", value: displayStats?.total_winning_amount, onClick: () => handleViewClick('bids/winning/today', "Winning Bids") },
//     { label: "Total Deposit (Approved)", value: displayStats?.total_deposit_approved, onClick: () => handleViewClick('deposits/approved/today', "Approved Deposits") },
//     { label: "Total Profit Amount", value: displayStats?.total_profit, isProfit: true },
//     { label: "Add Funds ( Manually )", value: displayStats?.add_funds_manually, onClick: () => handleViewClick('funds/manual/today', "Manual Fund Additions") },
//     { label: "Total Wallet Balance", value: displayStats?.total_wallet_balance },
//     { label: "Total Withdraw", value: displayStats?.total_withdraw, onClick: () => handleViewClick('withdrawals/settled/today', "Settled Withdrawals") },
//   ];

//   return (
//     <div className="space-y-6">
//       <DetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} data={modalData} loading={modalLoading} onViewProfile={handleViewProfile} actions={[]} />

//       {/* Welcome Card */}
//       <Card className="p-6 shadow-lg rounded-xl overflow-hidden border-t-4 border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="flex flex-col md:flex-row justify-between items-center">
//           <div className="space-y-2 mb-4 md:mb-0 text-center md:text-left">
//             <h1 className="text-3xl font-bold text-gray-800">नमस्ते, GD Matka Admin!</h1> {/* <--- यहाँ टेक्स्ट बदला गया */}
//           </div>
//           <div className="relative w-48 h-32 hidden md:block">
//             <Image src="/admin.png" alt="Illustration" layout="fill" objectFit="contain" />
//           </div>
//         </div>
//         <hr className="my-4" />
//         <div className="flex flex-col md:flex-row justify-between items-center">
//           <div className="flex items-center gap-4">
//             <div className="relative w-12 h-12 rounded-full overflow-hidden">
//               <Image
//                 src="/jobprofile.png"
//                 alt="Admin Profile"
//                 layout="fill"
//                 objectFit="cover"
//               />
//             </div>
//             <p className="font-semibold text-gray-700">Admin GD MATKA</p>
//           </div>
//           <div className="flex gap-8 text-center mt-4 md:mt-0">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//         {[{ title: "Users", value: topStats?.overall_users, icon: Users, onClick: () => router.push('/user-management') }, { title: "Today Registration", value: topStats?.today_users, icon: UserPlus, onClick: () => handleViewClick('users/registered-today', "Today's Registrations") }, { title: "Games", value: 19, icon: Gamepad, onClick: () => { } }, { title: "Players (Today)", value: topStats?.unique_emails_today, icon: ClipboardList, onClick: () => handleViewClick('users/active-today', "Today's Active Players") }, { title: "Total Bet Player", value: topStats?.total_bet_players, icon: Sword, onClick: () => handleViewClick('users/total-bet-players', 'Total Bet Players') }, { title: "Total Bet Not Player", value: topStats?.total_bet_not_players, icon: ShieldOff, onClick: () => handleViewClick('users/total-not-bet-players', 'Total Bet Not Players') }, { title: "Today Reg. Player", value: topStats?.today_registered_players, icon: User, onClick: () => handleViewClick('users/today-registered-players', "Today's New Players") },].map((card, index) => (<Card key={index} onClick={card.onClick} className="p-4 bg-white shadow-sm rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"><div className="p-3 rounded-lg bg-indigo-100 text-indigo-600"><card.icon size={24} /></div><div><p className="text-gray-500 text-sm">{card.title}</p><p className="text-2xl font-bold text-gray-800">{card.value ?? '0'}</p></div></Card>))}
//       </div>

//       {/* Total Bids On Single Ank */}
//       <Card className="p-6 bg-white shadow-lg rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Total Bids On Single Ank Of Date {new Date(reportDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select value={selectedBetType} onChange={(e) => setSelectedBetType(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full sm:w-auto focus:border-indigo-500 focus:ring-indigo-500 transition-colors">
//             <option value="All">All</option>
//             <option value="Open">Open</option>
//             <option value="Close">Close</option>
//           </select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border border-gray-300 rounded-md w-full sm:w-auto focus:border-indigo-500 focus:ring-indigo-500 transition-colors">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" /></div> : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               let totalBids = 0, totalAmount = 0;
//               if (selectedBetType === 'Open') { totalBids = bet.total_open_bets; totalAmount = bet.total_open_points; }
//               else if (selectedBetType === 'Close') { totalBids = bet.total_closed_bets; totalAmount = bet.total_closed_points; }
//               else { totalBids = bet.total_open_bets + bet.total_closed_bets; totalAmount = bet.total_open_points + bet.total_closed_points; }

//               const colorIndex = bet.ank % 5;
//               const bgColor = ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][colorIndex];
//               const ankColor = ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][colorIndex];

//               return (
//                 <div key={bet.ank} className="p-4 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: bgColor }}>
//                   <p className="text-sm text-gray-600">Total Bids: <span className="font-bold text-gray-800">{totalBids}</span></p>
//                   <p className="text-sm text-gray-600">Total Bid Amount: <span className="font-bold text-gray-800">{totalAmount}</span></p>
//                   <div className="mt-3 text-center font-extrabold text-2xl py-2 rounded-lg text-white shadow-md" style={{ backgroundColor: ankColor }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </Card>

//       {/* Game Report */}
//       <Card className="p-6 bg-white shadow-lg rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input
//             type="date"
//             value={reportDate}
//             onChange={(e) => setReportDate(e.target.value)}
//             className="p-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
//           />
//           <Button onClick={handleGetReport} disabled={isReportLoading} className="bg-indigo-600 hover:bg-indigo-700">
//             {isReportLoading && <Loader2 className="animate-spin mr-2" size={16} />}
//             Get Report
//           </Button>
//           <Button variant="outline" onClick={() => { setReportStats(null); setReportDate(currentDate); }} className="text-gray-600 border-gray-300 hover:bg-gray-100">
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin text-indigo-600" /></div> : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {reportItems.map((item, index) => (
//               <ReportStat
//                 key={index}
//                 label={item.label}
//                 value={item.value}
//                 isProfit={item.isProfit}
//                 onViewClick={item.onClick}
//               />
//             ))}
//           </div>
//         )}
//       </Card>

//       {/* Fund Request Auto Deposit History */}
//       <Card className="p-6 bg-white shadow-lg rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History (Approved)</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-100 sticky top-0">
//               <tr>
//                 <th className="p-3">#</th>
//                 <th className="p-3">User</th>
//                 <th className="p-3">Mobile</th>
//                 <th className="p-3">Amount</th>
//                 <th className="p-3">Date</th>
//                 <th className="p-3">Status</th>
//                 <th className="p-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory.filter(item => item.status === 'APPROVED').map((item, index) => {
//                 const uid = extractUserId(item);
//                 return (
//                   <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
//                     <td className="p-3">{index + 1}</td>
//                     <td className="p-3">
//                       {uid ? (
//                         <span className="cursor-pointer text-indigo-600 hover:underline font-medium" onClick={() => handleViewProfile(uid)}>
//                           {item.full_name || 'Unknown'}
//                         </span>
//                       ) : (
//                         <span>{item.full_name || 'Unknown'}</span>
//                       )}
//                     </td>
//                     <td className="p-3">{item.phone_number || 'N/A'}</td>
//                     <td className="p-3 font-semibold text-green-700">₹{Number(item.amount).toFixed(2)}</td>
//                     <td className="p-3 text-gray-600">{new Date(item.createdat).toLocaleString()}</td>
//                     <td className="p-3">
//                       <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
//                         {item.status}
//                       </span>
//                     </td>
//                     <td className="p-3">
//                       <Button size="sm" variant="outline" className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => uid && handleViewProfile(uid)} disabled={!uid}>
//                         <User size={14} />View
//                       </Button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus, Sword, ShieldOff, MessageSquare, Phone } from 'lucide-react'; // MessageSquare और Phone आइकॉन जोड़े गए
// import Image from 'next/image';

// // --- सभी Interfaces और Helper Components ---
// interface ModalData {
//   user_id?: number | string | null;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
//   total_bet_players: number;
//   total_bet_not_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// // WhatsApp के लिए फ़ोन नंबर फॉर्मेट करने वाला फंक्शन
// const formatPhoneNumberForWhatsApp = (phone: string) => {
//   if (!phone) return '';
//   const cleaned = phone.replace(/\D/g, "");
//   if (cleaned.length === 10) {
//     return `91${cleaned}`;
//   }
//   return cleaned;
// };

// // ---- बदला हुआ DetailsModal Component ----
// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;
//   const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id') : [];
//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   // यह चेक करेगा कि डेटा में फ़ोन नंबर है या नहीं, ताकि Actions कॉलम दिखाया जा सके
//   const hasContactActions = data.length > 0 && data[0].phone;
//   const whatsappMessage = encodeURIComponent("Welcome To Gd Matka How Can I Help you");

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close">&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" size={32} /></div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {headers.map((header) => (<th key={header} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>))}
//                   {/* अगर फ़ोन नंबर है तो ही Actions कॉलम दिखाएँ */}
//                   {hasContactActions && (<th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>)}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index}>
//                       {headers.map((header) => (<td key={header} className="p-2 whitespace-nowrap text-sm text-gray-900">{header === 'user' && uid ? <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => safeGoProfile(item)}>{item.user}</span> : (item as any)[header]}</td>))}
//                       {/* व्हाट्सएप और कॉल बटन यहाँ जोड़े गए हैं */}
//                       {hasContactActions && (
//                         <td className="p-2 whitespace-nowrap text-sm">
//                           <div className="flex items-center space-x-2">
//                             <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(item.phone!)}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Send WhatsApp Message">
//                               <MessageSquare size={18} />
//                             </a>
//                             <a href={`tel:${item.phone}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Call User">
//                               <Phone size={18} />
//                             </a>
//                           </div>
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end"><Button onClick={onClose}>Close</Button></div>
//       </div>
//     </div>
//   );
// };

// const ReportStat = ({ label, value, isProfit = false, onViewClick }: { label: string; value: number | undefined; isProfit?: boolean; onViewClick?: () => void; }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString('en-IN');
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-lg flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [selectedBetType, setSelectedBetType] = useState('All');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/');
//       return;
//     }
//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);
//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats(data);
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) setSelectedMarket(marketsData[0].market_name);
//         }
//       } catch (error) { console.error("Fetch failed:", error); }
//       finally { setLoading(false); }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const handleViewProfile = (userId: number) => { router.push(`/user-management/${userId}`); };

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) { console.error("Error fetching ank bets:", error); setSingleAnkBets([]); }
//     finally { setBetsLoading(false); }
//   };

//   useEffect(() => { if (selectedMarket && reportDate) fetchAnkBets(selectedMarket, reportDate); }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]);
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, { headers: { 'Authorization': `Bearer ${token}` } })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) { console.error("Failed to fetch report:", error); }
//     finally { setIsReportLoading(false); }
//   };

//   const handleViewClick = async (type: string, title: string) => {
//     const token = localStorage.getItem('token');
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     try {
//       let url = `https://backend.gdmatka.site/api/${type}?date=${reportDate}`;
//       const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData: ModalData[] = [];

//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           'Market Name': item.market_name,
//           'Game Type': item.game_name,
//           'Bet Digit': item.first_number + (item.second_number ? item.second_number : ''),
//           'Points': `₹${Number(item.points).toFixed(2)}`,
//           status: item.status,
//           'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//       } else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount || item.withdrawal_amount || 0).toFixed(2)}`,
//           status: item.status || item.withdrawal_status,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) { console.error(`Error fetching ${title}:`, error); setModalData([]); }
//     finally { setModalLoading(false); }
//   };


//   const displayStats = reportStats || todayStats;

//   if (loading) {
//     return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
//   }

//   const reportItems = [
//     { label: "Total Bid Amount", value: displayStats?.total_bid_amount, onClick: () => handleViewClick('bids/today', "Bids") },
//     { label: "Withdraw Request", value: displayStats?.withdraw_request, onClick: () => handleViewClick('withdrawals/pending', "Pending Withdrawals") },
//     { label: "Total Winning Amount", value: displayStats?.total_winning_amount, onClick: () => handleViewClick('bids/winning/today', "Winning Bids") },
//     { label: "Total Deposit (Approved)", value: displayStats?.total_deposit_approved, onClick: () => handleViewClick('deposits/approved/today', "Approved Deposits") },
//     { label: "Total Profit Amount", value: displayStats?.total_profit, isProfit: true },
//     { label: "Add Funds ( Manually )", value: displayStats?.add_funds_manually, onClick: () => handleViewClick('funds/manual/today', "Manual Fund Additions") },
//     // ---- नया बदलाव यहाँ है ----
//     { label: "Total Wallet Balance", value: displayStats?.total_wallet_balance },
//     { label: "Total Withdraw", value: displayStats?.total_withdraw, onClick: () => handleViewClick('withdrawals/settled/today', "Settled Withdrawals") },
//   ];

//   return (
//     <div className="space-y-6">
//       <DetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} data={modalData} loading={modalLoading} onViewProfile={handleViewProfile} actions={[]} />

//       {/* Welcome Card */}
//       <Card className="p-6 shadow-sm rounded-xl overflow-hidden border-t-4 border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="flex flex-col md:flex-row justify-between items-center">
//           <div className="space-y-2 mb-4 md:mb-0 text-center md:text-left">

//             <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
//           </div>
//           <div className="relative w-48 h-32 hidden md:block">
//             <Image src="/admin.png" alt="Illustration" layout="fill" objectFit="contain" />
//           </div>
//         </div>
//         <hr className="my-4" />
//         <div className="flex flex-col md:flex-row justify-between items-center">
//           <div className="flex items-center gap-4">
//             <div className="relative w-12 h-12 rounded-full overflow-hidden">
//               <Image
//                 src="/jobprofile.png"
//                 alt="Admin Profile"
//                 layout="fill"
//                 objectFit="cover"
//               />
//             </div>
//             <p className="font-semibold text-gray-700">Admin GD MATKA</p>
//           </div>
//           <div className="flex gap-8 text-center mt-4 md:mt-0">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//         {[{ title: "Users", value: topStats?.overall_users, icon: Users, onClick: () => router.push('/user-management') }, { title: "Today Registration", value: topStats?.today_users, icon: UserPlus, onClick: () => handleViewClick('users/registered-today', "Today's Registrations") }, { title: "Games", value: 19, icon: Gamepad, onClick: () => { } }, { title: "Players (Today)", value: topStats?.unique_emails_today, icon: ClipboardList, onClick: () => handleViewClick('users/active-today', "Today's Active Players") }, { title: "Total Bet Player", value: topStats?.total_bet_players, icon: Sword, onClick: () => handleViewClick('users/total-bet-players', 'Total Bet Players') }, { title: "Total Bet Not Player", value: topStats?.total_bet_not_players, icon: ShieldOff, onClick: () => handleViewClick('users/total-not-bet-players', 'Total Bet Not Players') }, { title: "Today Reg. Player", value: topStats?.today_registered_players, icon: User, onClick: () => handleViewClick('users/today-registered-players', "Today's New Players") },].map((card, index) => (<Card key={index} onClick={card.onClick} className="p-4 bg-white shadow-sm rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"><div className="p-3 rounded-lg bg-blue-100 text-blue-600"><card.icon size={24} /></div><div><p className="text-gray-500 text-sm">{card.title}</p><p className="text-2xl font-bold text-gray-800">{card.value ?? '0'}</p></div></Card>))}
//       </div>

//       {/* Total Bids On Single Ank */}
//       <Card className="p-6 bg-white shadow-sm rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4"><select value={selectedBetType} onChange={(e) => setSelectedBetType(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto"><option value="All">All</option><option value="Open">Open</option><option value="Close">Close</option></select><select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto"><option value="">-Select Market-</option>{markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}</select></div>
//         {betsLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div> : (<div className="grid grid-cols-2 md:grid-cols-5 gap-4">{singleAnkBets.map((bet) => { let totalBids = 0, totalAmount = 0; if (selectedBetType === 'Open') { totalBids = bet.total_open_bets; totalAmount = bet.total_open_points; } else if (selectedBetType === 'Close') { totalBids = bet.total_closed_bets; totalAmount = bet.total_closed_points; } else { totalBids = bet.total_open_bets + bet.total_closed_bets; totalAmount = bet.total_open_points + bet.total_closed_points; } return (<div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}><p>Total Bids: <span className="font-bold">{totalBids}</span></p><p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p><div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>Ank {bet.ank}</div></div>); })}</div>)}
//       </Card>

//       {/* Game Report */}
//       <Card className="p-6 bg-white shadow-sm rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4"><input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" /><Button onClick={handleGetReport} disabled={isReportLoading}>{isReportLoading && <Loader2 className="animate-spin mr-2" size={16} />}Get Report</Button><Button variant="outline" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>CLEAR</Button></div>
//         {isReportLoading ? <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div> : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{reportItems.map((item, index) => (<ReportStat key={index} label={item.label} value={item.value} isProfit={item.isProfit} onViewClick={item.onClick} />))}</div>)}
//       </Card>

//       {/* Fund Request Auto Deposit History */}
//       <Card className="p-6 bg-white shadow-sm rounded-xl">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr><th className="p-2">#</th><th className="p-2">User</th><th className="p-2">Mobile</th><th className="p-2">Amount</th><th className="p-2">Date</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead><tbody>{fundHistory.filter(item => item.status === 'APPROVED').map((item, index) => { const uid = extractUserId(item); return (<tr key={item.id} className="border-b"><td className="p-2">{index + 1}</td><td className="p-2">{uid ? <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => handleViewProfile(uid)}>{item.full_name || 'Unknown'}</span> : <span>{item.full_name || 'Unknown'}</span>}</td><td className="p-2">{item.phone_number || 'N/A'}</td><td className="p-2 font-semibold">₹{Number(item.amount).toFixed(2)}</td><td className="p-2">{new Date(item.createdat).toLocaleString()}</td><td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></td><td className="p-2"><Button size="sm" variant="outline" className="gap-1" onClick={() => uid && handleViewProfile(uid)} disabled={!uid}><User size={14} />View</Button></td></tr>); })}</tbody></table></div>
//       </Card>
//     </div>
//   );
// }
// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus, Sword, ShieldOff } from 'lucide-react';

// // Details Modal component
// interface ModalData {
//   user_id?: number | string | null;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }

// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;

//   const headers = data.length > 0
//     ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id')
//     : [];

//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close">&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40">
//               <Loader2 className="animate-spin" size={32} />
//             </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                   {actions.length > 0 && (
//                     <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index}>
//                       {headers.map((header) => (
//                         <td key={header} className="p-2 whitespace-nowrap text-sm text-gray-900">
//                           {header === 'user' && uid ? (
//                             <span
//                               className="cursor-pointer text-blue-600 hover:underline"
//                               onClick={() => safeGoProfile(item)}
//                             >
//                               {item.user}
//                             </span>
//                           ) : (
//                             (item as any)[header]
//                           )}
//                         </td>
//                       ))}
//                       {actions.length > 0 && (
//                         <td className="p-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                           {actions.map((action, actionIndex) => (
//                             <Button
//                               key={actionIndex}
//                               onClick={() => action.onClick(item)}
//                               className={action.color}
//                               size="sm"
//                             >
//                               {action.label}
//                             </Button>
//                           ))}
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end">
//           <Button onClick={onClose}>Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Interfaces ---
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
//   total_bet_players: number;
//   total_bet_not_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();

//   // --- States ---
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [selectedBetType, setSelectedBetType] = useState('All');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   // --- Data Fetching & Handlers ---
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/admin/login');
//       return;
//     }

//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);

//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats(data);
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) {
//             setSelectedMarket(marketsData[0].market_name);
//           }
//         }
//       } catch (error) {
//         console.error("Initial data fetch failed:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) {
//       console.error("Error fetching ank bets:", error);
//       setSingleAnkBets([]);
//     } finally {
//       setBetsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedMarket && reportDate) {
//       fetchAnkBets(selectedMarket, reportDate);
//     }
//   }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]);
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) {
//       console.error("Failed to fetch report:", error);
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   const handleWithdrawalAction = async (withdrawalId: number, action: 'settle' | 'decline') => {
//     const token = localStorage.getItem('token');
//     setModalLoading(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/admin/withdrawals/update`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ withdrawalId, action }),
//       });
//       if (!response.ok) throw new Error(`Failed to ${action} withdrawal`);

//       setModalData(prevData =>
//         prevData.map(item =>
//           item.withdrawal_id === withdrawalId
//             ? { ...item, status: action === 'settle' ? 'Settled' : 'Declined' }
//             : item
//         )
//       );
//     } catch (error) {
//       console.error(`Error processing withdrawal action:`, error);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const displayStats = reportStats || todayStats;

//   const handleViewClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     setModalActions([]);
//     const token = localStorage.getItem('token');
//     const dateForApi = reportStats ? reportDate : currentDate;

//     try {
//       let url = `https://backend.gdmatka.site/api/${type}`;
//       if (type.includes('/today')) {
//         url += `?date=${dateForApi}`;
//       } else if (type.includes('bids')) {
//         url = `https://backend.gdmatka.site/api/bids/today?date=${dateForApi}`;
//       } else if (type.includes('withdrawals') || type.includes('deposits') || type.includes('funds')) {
//         url += `?date=${dateForApi}`;
//       }

//       const response = await fetch(url, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData: ModalData[] = [];
//       let actions: ActionButton[] = [];

//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           'Market Name': item.market_name,
//           'Game Type': item.game_name,
//           'Bet Digit': item.first_number + (item.second_number ? item.second_number : ''),
//           'Points': `₹${Number(item.points).toFixed(2)}`,
//           status: item.status,
//           'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//           date: new Date(item.created_at || item.createdat).toLocaleString(),
//         }));
//       }
//       else if (type.startsWith('funds') || type.startsWith('deposits')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount).toFixed(2)}`,
//           status: item.status,
//           date: new Date(item.createdat).toLocaleString(),
//         }));
//       }
//       else if (type.startsWith('withdrawals')) {
//         formattedData = data.map((item: any) => ({
//           withdrawal_id: item.withdrawal_id,
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.withdrawal_amount).toFixed(2)}`,
//           status: item.withdrawal_status,
//           date: new Date(item.created_at).toLocaleString(),
//           payment_method: item.provider,
//         }));

//         if (type === 'withdrawals/pending') {
//           actions = [
//             {
//               label: 'Accept',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'settle'),
//               color: 'bg-green-500 hover:bg-green-600 text-white'
//             },
//             {
//               label: 'Decline',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'decline'),
//               color: 'bg-red-500 hover:bg-red-600 text-white'
//             }
//           ];
//         }
//         setModalActions(actions);
//       }
//       else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number,
//           phone: item.phone_number,
//           status: item.status,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleViewProfile = (userIdLike: any) => {
//     const uid = extractUserId({ user_id: userIdLike });
//     if (!uid) return;
//     router.push(`/user-management/${uid}`);
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-[calc(100vh-80px)]">
//         <Loader2 className="animate-spin text-blue-600" size={48} />
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         data={modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//         actions={modalActions}
//       />

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

//         <div onClick={() => router.push('/user-management')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>

//         <div onClick={() => handleViewClick('users/registered-today', "Today's Registrations")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>

//         <Card className="p-4 flex items-center space-x-4 shadow h-full">
//           <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gamepad size={24} /></div>
//           <div>
//             <p className="text-gray-500">Games</p>
//             <p className="text-2xl font-bold text-gray-800">{topStats?.games ?? '0'}</p>
//           </div>
//         </Card>

//         <div onClick={() => handleViewClick('users/active-today', "Today's Active Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-pink-100 text-pink-600"><ClipboardList size={24} /></div>
//             <div>
//               <p className="text-gray-500">Players (Today)</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.unique_emails_today ?? '0'}</p>
//             </div>
//           </Card>
//         </div>

//         <div onClick={() => handleViewClick('users/today-registered-players', "Today's New Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 h-full">
//             <div className="p-3 rounded-full bg-teal-100 text-teal-600"><UserPlus size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Reg. Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_registered_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>

//         <div onClick={() => handleViewClick('users/total-bet-players', 'Total Bet Players')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-green-100 text-green-600"><Sword size={24} /></div>
//             <div>
//               <p className="text-gray-500">Total Bet Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.total_bet_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>

//         <div onClick={() => handleViewClick('users/total-not-bet-players', 'Total Bet Not Players')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-red-100 text-red-600"><ShieldOff size={24} /></div>
//             <div>
//               <p className="text-gray-500">Total Bet Not Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.total_bet_not_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//       </div>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-2">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select value={selectedBetType} onChange={(e) => setSelectedBetType(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="All">All</option>
//             <option value="Open">Open</option>
//             <option value="Close">Close</option>
//           </select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? (
//           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               let totalBids = 0;
//               let totalAmount = 0;

//               if (selectedBetType === 'Open') {
//                 totalBids = bet.total_open_bets;
//                 totalAmount = bet.total_open_points;
//               } else if (selectedBetType === 'Close') {
//                 totalBids = bet.total_closed_bets;
//                 totalAmount = bet.total_closed_points;
//               } else {
//                 totalBids = bet.total_open_bets + bet.total_closed_bets;
//                 totalAmount = bet.total_open_points + bet.total_closed_points;
//               }

//               return (
//                 <div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}>
//                   <p>Total Bids: <span className="font-bold">{totalBids}</span></p>
//                   <p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p>
//                   <div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" />
//           <select className="p-2 border rounded-md"><option>All</option></select>
//           <Button onClick={handleGetReport} disabled={isReportLoading}>
//             {isReportLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//             Get Report
//           </Button>
//           <Button variant="outline" className="text-red-500 border-red-500" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? (
//           <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
//             <ReportStat label="Total Bid Amount" value={displayStats?.total_bid_amount} onViewClick={() => handleViewClick('bids/today', "Bids")} />
//             <ReportStat label="Withdraw Request" value={displayStats?.withdraw_request} onViewClick={() => handleViewClick('withdrawals/pending', "Pending Withdrawals")} />
//             <ReportStat label="Total Winning Amount" value={displayStats?.total_winning_amount} onViewClick={() => handleViewClick('bids/winning/today', "Winning Bids")} />
//             <ReportStat label="Total Deposit (Approved)" value={displayStats?.total_deposit_approved} onViewClick={() => handleViewClick('deposits/approved/today', "Approved Deposits")} />
//             <ReportStat label="Total Profit Amount" value={displayStats?.total_profit} isProfit />
//             <ReportStat label="Add Funds ( Manually )" value={displayStats?.add_funds_manually} onViewClick={() => handleViewClick('funds/manual/today', "Manual Fund Additions")} />
//             <ReportStat label="Total Wallet Balance" value={displayStats?.total_wallet_balance} />
//             <ReportStat label="Total Withdraw" value={displayStats?.total_withdraw} onViewClick={() => handleViewClick('withdrawals/settled/today', "Settled Withdrawals")} />
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">User</th>
//                 <th className="p-2">Mobile</th>
//                 <th className="p-2">Amount</th>
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory
//                 .filter(item => item.status === 'APPROVED')
//                 .map((item, index) => {
//                   const displayUser =
//                     item.full_name?.trim() ||
//                     item.phone_number?.trim() ||
//                     item.email?.trim() ||
//                     'Unknown User';

//                   const displayPhone = item.phone_number?.trim() || 'N/A';
//                   const uid = extractUserId(item);

//                   return (
//                     <tr key={item.id} className="border-b">
//                       <td className="p-2">{index + 1}</td>
//                       <td className="p-2">
//                         {uid ? (
//                           <span
//                             className="cursor-pointer text-blue-600 hover:underline"
//                             onClick={() => handleViewProfile(uid)}
//                             title={displayUser}
//                           >
//                             {displayUser}
//                           </span>
//                         ) : (
//                           <span className="text-gray-700" title="User ID not available">
//                             {displayUser}
//                           </span>
//                         )}
//                       </td>
//                       <td className="p-2">{displayPhone}</td>
//                       <td className="p-2 font-semibold">₹{Number(item.amount).toFixed(2)}</td>
//                       <td className="p-2">{new Date(item.createdat).toLocaleString()}</td>
//                       <td className="p-2">
//                         <span
//                           className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED'
//                             ? 'bg-green-100 text-green-800'
//                             : item.status === 'REJECTED'
//                               ? 'bg-red-100 text-red-800'
//                               : 'bg-yellow-100 text-yellow-800'
//                             }`}
//                         >
//                           {item.status}
//                         </span>
//                       </td>
//                       <td className="p-2">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           className="gap-1"
//                           onClick={() => uid && handleViewProfile(uid)}
//                           disabled={!uid}
//                           title={uid ? 'View user profile' : 'User ID not available'}
//                         >
//                           <User size={14} />
//                           View
//                         </Button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // Helper component
// const ReportStat = ({
//   label,
//   value,
//   isProfit = false,
//   onViewClick
// }: {
//   label: string;
//   value: number | undefined;
//   isProfit?: boolean;
//   onViewClick?: () => void;
// }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString();
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-md flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };


// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus } from 'lucide-react';

// // ... DetailsModal और सभी Interfaces वैसे ही रहेंगे ...
// // Details Modal component
// // ------------------------------------
// interface ModalData {
//   user_id?: number | string | null;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }

// // --- helpers ---
// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;

//   const headers = data.length > 0
//     ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id')
//     : [];

//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close">&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40">
//               <Loader2 className="animate-spin" size={32} />
//             </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                   {actions.length > 0 && (
//                     <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index}>
//                       {headers.map((header) => (
//                         <td key={header} className="p-2 whitespace-nowrap text-sm text-gray-900">
//                           {header === 'user' && uid ? (
//                             <span
//                               className="cursor-pointer text-blue-600 hover:underline"
//                               onClick={() => safeGoProfile(item)}
//                             >
//                               {item.user}
//                             </span>
//                           ) : (
//                             (item as any)[header]
//                           )}
//                         </td>
//                       ))}
//                       {actions.length > 0 && (
//                         <td className="p-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                           {actions.map((action, actionIndex) => (
//                             <Button
//                               key={actionIndex}
//                               onClick={() => action.onClick(item)}
//                               className={action.color}
//                               size="sm"
//                             >
//                               {action.label}
//                             </Button>
//                           ))}
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end">
//           <Button onClick={onClose}>Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Interfaces ---
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();

//   // --- States ---
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);

//   // States for today's data vs. selected report date data
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   // States for "Single Ank" section
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [selectedBetType, setSelectedBetType] = useState('All'); // **बदलाव 1.a: नया स्टेट**
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);

//   // Details Modal States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   // --- Data Fetching & Handlers ---
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/admin/login');
//       return;
//     }

//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);

//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats({
//             overall_users: data.overall_users,
//             today_users: data.today_users,
//             games: 19,
//             unique_emails_today: data.unique_emails_today,
//             today_registered_players: data.today_registered_players
//           });
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) {
//             setSelectedMarket(marketsData[0].market_name);
//           }
//         }
//       } catch (error) {
//         console.error("Initial data fetch failed:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) {
//       console.error("Error fetching ank bets:", error);
//       setSingleAnkBets([]);
//     } finally {
//       setBetsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedMarket && reportDate) {
//       fetchAnkBets(selectedMarket, reportDate);
//     }
//   }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]); // Clear old fund history
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) {
//       console.error("Failed to fetch report:", error);
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   const handleWithdrawalAction = async (withdrawalId: number, action: 'settle' | 'decline') => {
//     const token = localStorage.getItem('token');
//     setModalLoading(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/admin/withdrawals/update`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ withdrawalId, action }),
//       });
//       if (!response.ok) throw new Error(`Failed to ${action} withdrawal`);

//       setModalData(prevData =>
//         prevData.map(item =>
//           item.withdrawal_id === withdrawalId
//             ? { ...item, status: action === 'settle' ? 'Settled' : 'Declined' }
//             : item
//         )
//       );
//     } catch (error) {
//       console.error(`Error processing withdrawal action:`, error);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const displayStats = reportStats || todayStats;

//   const handleViewClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     setModalActions([]); // Reset actions
//     const token = localStorage.getItem('token');
//     const dateForApi = reportStats ? reportDate : currentDate;

//     try {
//       let url = `https://backend.gdmatka.site/api/${type}`;
//       if (type.includes('/today')) {
//         url += `?date=${dateForApi}`;
//       } else if (type.includes('bids')) {
//         url = `https://backend.gdmatka.site/api/bids/today?date=${dateForApi}`;
//       } else if (type.includes('withdrawals') || type.includes('deposits') || type.includes('funds')) {
//         url += `?date=${dateForApi}`;
//       }

//       const response = await fetch(url, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData: ModalData[] = [];
//       let actions: ActionButton[] = [];

//       // Bids
//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => {
//           const betDigit = item.first_number + (item.second_number ? item.second_number : '');
//           return {
//             user_id: item.user_id,
//             user: item.full_name || item.phone_number || item.email,
//             'Market Name': item.market_name,
//             'Game Type': item.game_name,
//             'Bet Digit': betDigit,
//             'Points': `₹${Number(item.points).toFixed(2)}`,
//             status: item.status,
//             'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//             date: new Date(item.created_at || item.createdat).toLocaleString(),
//           };
//         });
//       }
//       // Funds / Deposits
//       else if (type.startsWith('funds') || type.startsWith('deposits')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount).toFixed(2)}`,
//           status: item.status,
//           date: new Date(item.createdat).toLocaleString(),
//         }));
//       }
//       // Withdrawals
//       else if (type.startsWith('withdrawals')) {
//         formattedData = data.map((item: any) => ({
//           withdrawal_id: item.withdrawal_id,
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.withdrawal_amount).toFixed(2)}`,
//           status: item.withdrawal_status,
//           date: new Date(item.created_at).toLocaleString(),
//           payment_method: item.provider,
//         }));

//         if (type === 'withdrawals/pending') {
//           actions = [
//             {
//               label: 'Accept',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'settle'),
//               color: 'bg-green-500 hover:bg-green-600 text-white'
//             },
//             {
//               label: 'Decline',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'decline'),
//               color: 'bg-red-500 hover:bg-red-600 text-white'
//             }
//           ];
//         }
//         setModalActions(actions);
//       }
//       // Users default
//       else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number,
//           phone: item.phone_number,
//           status: item.status,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleCardClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();
//       const formattedData = data.map((item: any) => ({
//         user_id: item.user_id,
//         user: item.full_name || item.phone_number,
//         phone: item.phone_number,
//         status: item.status,
//         wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//       }));
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleViewProfile = (userIdLike: any) => {
//     const uid = extractUserId({ user_id: userIdLike });
//     if (!uid) return;
//     router.push(`/user-management/${uid}`);
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-[calc(100vh-80px)]">
//         <Loader2 className="animate-spin text-blue-600" size={48} />
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         data={modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//         actions={modalActions}
//       />

//       <Card className="p-4 bg-white shadow-md">
//         <div className="flex justify-between items-start">
//           <div>
//             <p className="text-sm text-gray-500">Dashboards / Dashboard</p>
//             <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
//             <p className="text-gray-500">Admin Dashboard</p>
//           </div>
//           <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300"></div>
//         </div>
//         <div className="flex justify-between items-center mt-4">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
//               <User size={24} className="text-gray-600" />
//             </div>
//             <p className="font-semibold">Admin</p>
//           </div>
//           <div className="flex gap-8 text-center">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div onClick={() => router.push('/user-management')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleViewClick('users/registered-today', "Today's Registrations")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Registration</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <Card className="p-4 flex items-center space-x-4 shadow h-full">
//           <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gamepad size={24} /></div>
//           <div>
//             <p className="text-gray-500">Games</p>
//             <p className="text-2xl font-bold text-gray-800">{topStats?.games ?? '0'}</p>
//           </div>
//         </Card>
//         <div onClick={() => handleViewClick('users/active-today', "Today's Active Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-pink-100 text-pink-600"><ClipboardList size={24} /></div>
//             <div>
//               <p className="text-gray-500">Players ( Today )</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.unique_emails_today ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleViewClick('users/today-registered-players', "Today's New Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 h-full">
//             <div className="p-3 rounded-full bg-teal-100 text-teal-600"><UserPlus size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Reg. Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_registered_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//       </div>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-2">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           {/* **बदलाव 1.b: Select Game Name ड्रॉपडाउन को बदलें** */}
//           <select value={selectedBetType} onChange={(e) => setSelectedBetType(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="All">All</option>
//             <option value="Open">Open</option>
//             <option value="Close">Close</option>
//           </select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? (
//           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               // **बदलाव 1.c: selectedBetType के आधार पर गणना**
//               let totalBids = 0;
//               let totalAmount = 0;

//               if (selectedBetType === 'Open') {
//                 totalBids = bet.total_open_bets;
//                 totalAmount = bet.total_open_points;
//               } else if (selectedBetType === 'Close') {
//                 totalBids = bet.total_closed_bets;
//                 totalAmount = bet.total_closed_points;
//               } else { // 'All' के लिए
//                 totalBids = bet.total_open_bets + bet.total_closed_bets;
//                 totalAmount = bet.total_open_points + bet.total_closed_points;
//               }

//               return (
//                 <div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}>
//                   <p>Total Bids: <span className="font-bold">{totalBids}</span></p>
//                   <p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p>
//                   <div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" />
//           <select className="p-2 border rounded-md"><option>All</option></select>
//           <Button onClick={handleGetReport} disabled={isReportLoading}>
//             {isReportLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//             Get Report
//           </Button>
//           <Button variant="outline" className="text-red-500 border-red-500" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? (
//           <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
//             <ReportStat label="Total Bid Amount" value={displayStats?.total_bid_amount} onViewClick={() => handleViewClick('bids/today', "Bids")} />
//             <ReportStat label="Withdraw Request" value={displayStats?.withdraw_request} onViewClick={() => handleViewClick('withdrawals/pending', "Pending Withdrawals")} />
//             <ReportStat label="Total Winning Amount" value={displayStats?.total_winning_amount} onViewClick={() => handleViewClick('bids/winning/today', "Winning Bids")} />
//             <ReportStat label="Total Deposit (Approved)" value={displayStats?.total_deposit_approved} onViewClick={() => handleViewClick('deposits/approved/today', "Approved Deposits")} />
//             <ReportStat label="Total Profit Amount" value={displayStats?.total_profit} isProfit />
//             <ReportStat label="Add Funds ( Manually )" value={displayStats?.add_funds_manually} onViewClick={() => handleViewClick('funds/manual/today', "Manual Fund Additions")} />
//             <ReportStat label="Total Wallet Balance" value={displayStats?.total_wallet_balance} />
//             <ReportStat label="Total Withdraw" value={displayStats?.total_withdraw} onViewClick={() => handleViewClick('withdrawals/settled/today', "Settled Withdrawals")} />
//           </div>
//         )}
//       </Card>

//       {/* --------- Fund History with View Action (safe) --------- */}
//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">User</th>
//                 <th className="p-2">Mobile</th>
//                 <th className="p-2">Amount</th>
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {/* **बदलाव 2: सिर्फ 'APPROVED' स्टेटस वाले आइटम दिखाने के लिए फिल्टर** */}
//               {fundHistory
//                 .filter(item => item.status === 'APPROVED')
//                 .map((item, index) => {
//                   const displayUser =
//                     item.full_name?.trim() ||
//                     item.phone_number?.trim() ||
//                     item.email?.trim() ||
//                     'Unknown User';

//                   const displayPhone = item.phone_number?.trim() || 'N/A';
//                   const uid = extractUserId(item);

//                   return (
//                     <tr key={item.id} className="border-b">
//                       <td className="p-2">{index + 1}</td>

//                       {/* User (clickable only if uid is valid) */}
//                       <td className="p-2">
//                         {uid ? (
//                           <span
//                             className="cursor-pointer text-blue-600 hover:underline"
//                             onClick={() => handleViewProfile(uid)}
//                             title={displayUser}
//                           >
//                             {displayUser}
//                           </span>
//                         ) : (
//                           <span className="text-gray-700" title="User ID not available">
//                             {displayUser}
//                           </span>
//                         )}
//                       </td>

//                       {/* Mobile */}
//                       <td className="p-2">{displayPhone}</td>

//                       {/* Amount */}
//                       <td className="p-2 font-semibold">₹{Number(item.amount).toFixed(2)}</td>

//                       {/* Date */}
//                       <td className="p-2">{new Date(item.createdat).toLocaleString()}</td>

//                       {/* Status */}
//                       <td className="p-2">
//                         <span
//                           className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED'
//                             ? 'bg-green-100 text-green-800'
//                             : item.status === 'REJECTED'
//                               ? 'bg-red-100 text-red-800'
//                               : 'bg-yellow-100 text-yellow-800'
//                             }`}
//                         >
//                           {item.status}
//                         </span>
//                       </td>

//                       {/* Actions -> View (disabled when uid missing) */}
//                       <td className="p-2">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           className="gap-1"
//                           onClick={() => uid && handleViewProfile(uid)}
//                           disabled={!uid}
//                           title={uid ? 'View user profile' : 'User ID not available'}
//                         >
//                           <User size={14} />
//                           View
//                         </Button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // Helper component
// const ReportStat = ({
//   label,
//   value,
//   isProfit = false,
//   onViewClick
// }: {
//   label: string;
//   value: number | undefined;
//   isProfit?: boolean;
//   onViewClick?: () => void;
// }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString();
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-md flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };

// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus } from 'lucide-react';

// // ------------------------------------
// // Details Modal component
// // ------------------------------------
// interface ModalData {
//   user_id?: number | string | null;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }

// // --- helpers ---
// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;

//   const headers = data.length > 0
//     ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id')
//     : [];

//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close">&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40">
//               <Loader2 className="animate-spin" size={32} />
//             </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                   {actions.length > 0 && (
//                     <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index}>
//                       {headers.map((header) => (
//                         <td key={header} className="p-2 whitespace-nowrap text-sm text-gray-900">
//                           {header === 'user' && uid ? (
//                             <span
//                               className="cursor-pointer text-blue-600 hover:underline"
//                               onClick={() => safeGoProfile(item)}
//                             >
//                               {item.user}
//                             </span>
//                           ) : (
//                             (item as any)[header]
//                           )}
//                         </td>
//                       ))}
//                       {actions.length > 0 && (
//                         <td className="p-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                           {actions.map((action, actionIndex) => (
//                             <Button
//                               key={actionIndex}
//                               onClick={() => action.onClick(item)}
//                               className={action.color}
//                               size="sm"
//                             >
//                               {action.label}
//                             </Button>
//                           ))}
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end">
//           <Button onClick={onClose}>Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Interfaces ---
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();

//   // --- States ---
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);

//   // States for today's data vs. selected report date data
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   // States for "Single Ank" section
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);

//   // Details Modal States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   // --- Data Fetching & Handlers ---
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/admin/login');
//       return;
//     }

//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);

//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats({
//             overall_users: data.overall_users,
//             today_users: data.today_users,
//             games: 19,
//             unique_emails_today: data.unique_emails_today,
//             today_registered_players: data.today_registered_players
//           });
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) {
//             setSelectedMarket(marketsData[0].market_name);
//           }
//         }
//       } catch (error) {
//         console.error("Initial data fetch failed:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) {
//       console.error("Error fetching ank bets:", error);
//       setSingleAnkBets([]);
//     } finally {
//       setBetsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedMarket && reportDate) {
//       fetchAnkBets(selectedMarket, reportDate);
//     }
//   }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]); // Clear old fund history
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) {
//       console.error("Failed to fetch report:", error);
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   const handleWithdrawalAction = async (withdrawalId: number, action: 'settle' | 'decline') => {
//     const token = localStorage.getItem('token');
//     setModalLoading(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/admin/withdrawals/update`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ withdrawalId, action }),
//       });
//       if (!response.ok) throw new Error(`Failed to ${action} withdrawal`);

//       setModalData(prevData =>
//         prevData.map(item =>
//           item.withdrawal_id === withdrawalId
//             ? { ...item, status: action === 'settle' ? 'Settled' : 'Declined' }
//             : item
//         )
//       );
//     } catch (error) {
//       console.error(`Error processing withdrawal action:`, error);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const displayStats = reportStats || todayStats;

//   const handleViewClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     setModalActions([]); // Reset actions
//     const token = localStorage.getItem('token');
//     const dateForApi = reportStats ? reportDate : currentDate;

//     try {
//       let url = `https://backend.gdmatka.site/api/${type}`;
//       if (type.includes('/today')) {
//         url += `?date=${dateForApi}`;
//       } else if (type.includes('bids')) {
//         url = `https://backend.gdmatka.site/api/bids/today?date=${dateForApi}`;
//       } else if (type.includes('withdrawals') || type.includes('deposits') || type.includes('funds')) {
//         url += `?date=${dateForApi}`;
//       }

//       const response = await fetch(url, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData: ModalData[] = [];
//       let actions: ActionButton[] = [];

//       // Bids
//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => {
//           const betDigit = item.first_number + (item.second_number ? item.second_number : '');
//           return {
//             user_id: item.user_id,
//             user: item.full_name || item.phone_number || item.email,
//             'Market Name': item.market_name,
//             'Game Type': item.game_name,
//             'Bet Digit': betDigit,
//             'Points': `₹${Number(item.points).toFixed(2)}`,
//             status: item.status,
//             'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//             date: new Date(item.created_at || item.createdat).toLocaleString(),
//           };
//         });
//       }
//       // Funds / Deposits
//       else if (type.startsWith('funds') || type.startsWith('deposits')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount).toFixed(2)}`,
//           status: item.status,
//           date: new Date(item.createdat).toLocaleString(),
//         }));
//       }
//       // Withdrawals
//       else if (type.startsWith('withdrawals')) {
//         formattedData = data.map((item: any) => ({
//           withdrawal_id: item.withdrawal_id,
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.withdrawal_amount).toFixed(2)}`,
//           status: item.withdrawal_status,
//           date: new Date(item.created_at).toLocaleString(),
//           payment_method: item.provider,
//         }));

//         if (type === 'withdrawals/pending') {
//           actions = [
//             {
//               label: 'Accept',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'settle'),
//               color: 'bg-green-500 hover:bg-green-600 text-white'
//             },
//             {
//               label: 'Decline',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'decline'),
//               color: 'bg-red-500 hover:bg-red-600 text-white'
//             }
//           ];
//         }
//         setModalActions(actions);
//       }
//       // Users default
//       else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number,
//           phone: item.phone_number,
//           status: item.status,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleCardClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();
//       const formattedData = data.map((item: any) => ({
//         user_id: item.user_id,
//         user: item.full_name || item.phone_number,
//         phone: item.phone_number,
//         status: item.status,
//         wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//       }));
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleViewProfile = (userIdLike: any) => {
//     const uid = extractUserId({ user_id: userIdLike });
//     if (!uid) return;
//     router.push(`/user-management/${uid}`);
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-[calc(100vh-80px)]">
//         <Loader2 className="animate-spin text-blue-600" size={48} />
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         data={modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//         actions={modalActions}
//       />

//       <Card className="p-4 bg-white shadow-md">
//         <div className="flex justify-between items-start">
//           <div>
//             <p className="text-sm text-gray-500">Dashboards / Dashboard</p>
//             <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
//             <p className="text-gray-500">Admin Dashboard</p>
//           </div>
//           <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300"></div>
//         </div>
//         <div className="flex justify-between items-center mt-4">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
//               <User size={24} className="text-gray-600" />
//             </div>
//             <p className="font-semibold">Admin</p>
//           </div>
//           <div className="flex gap-8 text-center">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div onClick={() => router.push('/user-management')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleViewClick('users/registered-today', "Today's Registrations")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Registration</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <Card className="p-4 flex items-center space-x-4 shadow h-full">
//           <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gamepad size={24} /></div>
//           <div>
//             <p className="text-gray-500">Games</p>
//             <p className="text-2xl font-bold text-gray-800">{topStats?.games ?? '0'}</p>
//           </div>
//         </Card>
//         <div onClick={() => handleViewClick('users/active-today', "Today's Active Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-pink-100 text-pink-600"><ClipboardList size={24} /></div>
//             <div>
//               <p className="text-gray-500">Players ( Today )</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.unique_emails_today ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleViewClick('users/today-registered-players', "Today's New Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 h-full">
//             <div className="p-3 rounded-full bg-teal-100 text-teal-600"><UserPlus size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Reg. Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_registered_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//       </div>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-2">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select className="p-2 border rounded-md w-full sm:w-auto"><option>-Select Game Name-</option></select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? (
//           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               const totalBids = bet.total_open_bets + bet.total_closed_bets;
//               const totalAmount = bet.total_open_points + bet.total_closed_points;
//               return (
//                 <div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}>
//                   <p>Total Bids: <span className="font-bold">{totalBids}</span></p>
//                   <p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p>
//                   <div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" />
//           <select className="p-2 border rounded-md"><option>All</option></select>
//           <Button onClick={handleGetReport} disabled={isReportLoading}>
//             {isReportLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//             Get Report
//           </Button>
//           <Button variant="outline" className="text-red-500 border-red-500" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? (
//           <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
//             <ReportStat label="Total Bid Amount" value={displayStats?.total_bid_amount} onViewClick={() => handleViewClick('bids/today', "Bids")} />
//             <ReportStat label="Withdraw Request" value={displayStats?.withdraw_request} onViewClick={() => handleViewClick('withdrawals/pending', "Pending Withdrawals")} />
//             <ReportStat label="Total Winning Amount" value={displayStats?.total_winning_amount} onViewClick={() => handleViewClick('bids/winning/today', "Winning Bids")} />
//             <ReportStat label="Total Deposit (Approved)" value={displayStats?.total_deposit_approved} onViewClick={() => handleViewClick('deposits/approved/today', "Approved Deposits")} />
//             <ReportStat label="Total Profit Amount" value={displayStats?.total_profit} isProfit />
//             <ReportStat label="Add Funds ( Manually )" value={displayStats?.add_funds_manually} onViewClick={() => handleViewClick('funds/manual/today', "Manual Fund Additions")} />
//             <ReportStat label="Total Wallet Balance" value={displayStats?.total_wallet_balance} />
//             <ReportStat label="Total Withdraw" value={displayStats?.total_withdraw} onViewClick={() => handleViewClick('withdrawals/settled/today', "Settled Withdrawals")} />
//           </div>
//         )}
//       </Card>

//       {/* --------- Fund History with View Action (safe) --------- */}
//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">User</th>
//                 <th className="p-2">Mobile</th>
//                 <th className="p-2">Amount</th>
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory.map((item, index) => {
//                 const displayUser =
//                   item.full_name?.trim() ||
//                   item.phone_number?.trim() ||
//                   item.email?.trim() ||
//                   'Unknown User';

//                 const displayPhone = item.phone_number?.trim() || 'N/A';
//                 const uid = extractUserId(item);

//                 return (
//                   <tr key={item.id} className="border-b">
//                     <td className="p-2">{index + 1}</td>

//                     {/* User (clickable only if uid is valid) */}
//                     <td className="p-2">
//                       {uid ? (
//                         <span
//                           className="cursor-pointer text-blue-600 hover:underline"
//                           onClick={() => handleViewProfile(uid)}
//                           title={displayUser}
//                         >
//                           {displayUser}
//                         </span>
//                       ) : (
//                         <span className="text-gray-700" title="User ID not available">
//                           {displayUser}
//                         </span>
//                       )}
//                     </td>

//                     {/* Mobile */}
//                     <td className="p-2">{displayPhone}</td>

//                     {/* Amount */}
//                     <td className="p-2 font-semibold">₹{Number(item.amount).toFixed(2)}</td>

//                     {/* Date */}
//                     <td className="p-2">{item.createdat_ist}</td>

//                     {/* Status */}
//                     <td className="p-2">
//                       <span
//                         className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED'
//                           ? 'bg-green-100 text-green-800'
//                           : item.status === 'REJECTED'
//                             ? 'bg-red-100 text-red-800'
//                             : 'bg-yellow-100 text-yellow-800'
//                           }`}
//                       >
//                         {item.status}
//                       </span>
//                     </td>

//                     {/* Actions -> View (disabled when uid missing) */}
//                     <td className="p-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         className="gap-1"
//                         onClick={() => uid && handleViewProfile(uid)}
//                         disabled={!uid}
//                         title={uid ? 'View user profile' : 'User ID not available'}
//                       >
//                         <User size={14} />
//                         View
//                       </Button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // Helper component
// const ReportStat = ({
//   label,
//   value,
//   isProfit = false,
//   onViewClick
// }: {
//   label: string;
//   value: number | undefined;
//   isProfit?: boolean;
//   onViewClick?: () => void;
// }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString();
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-md flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };



// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus } from 'lucide-react';

// // ------------------------------------
// // Details Modal component
// // ------------------------------------
// interface ModalData {
//   user_id?: number | string | null;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   'Game Type'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
//   payment_method?: string;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }

// // --- helpers ---
// const extractUserId = (raw: any): number | null => {
//   if (!raw) return null;
//   const possible = raw.user_id ?? raw.userId ?? raw.userid ?? raw.user?.id ?? null;
//   if (possible === null || possible === undefined) return null;
//   const n = typeof possible === 'string' ? Number(possible) : possible;
//   return Number.isFinite(n) && n > 0 ? n : null;
// };

// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;

//   const headers = data.length > 0
//     ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id')
//     : [];

//   const safeGoProfile = (anyItem: ModalData) => {
//     const uid = extractUserId(anyItem);
//     if (uid) onViewProfile(uid);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <Button variant="ghost" onClick={onClose} aria-label="close">&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40">
//               <Loader2 className="animate-spin" size={32} />
//             </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                   {actions.length > 0 && (
//                     <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {data.map((item, index) => {
//                   const uid = extractUserId(item);
//                   return (
//                     <tr key={index}>
//                       {headers.map((header) => (
//                         <td key={header} className="p-2 whitespace-nowrap text-sm text-gray-900">
//                           {header === 'user' && uid ? (
//                             <span
//                               className="cursor-pointer text-blue-600 hover:underline"
//                               onClick={() => safeGoProfile(item)}
//                             >
//                               {item.user}
//                             </span>
//                           ) : (
//                             (item as any)[header]
//                           )}
//                         </td>
//                       ))}
//                       {actions.length > 0 && (
//                         <td className="p-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                           {actions.map((action, actionIndex) => (
//                             <Button
//                               key={actionIndex}
//                               onClick={() => action.onClick(item)}
//                               className={action.color}
//                               size="sm"
//                             >
//                               {action.label}
//                             </Button>
//                           ))}
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end">
//           <Button onClick={onClose}>Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Interfaces ---
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
//   user_id: number | string | null;
//   full_name: string;
// }

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();

//   // --- States ---
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);

//   // States for today's data vs. selected report date data
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   // States for "Single Ank" section
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);

//   // Details Modal States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   // --- Data Fetching & Handlers ---
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/admin/login');
//       return;
//     }

//     const fetchData = async (date = currentDate) => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch(`https://backend.gdmatka.site/api/getdetails?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);

//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats({
//             overall_users: data.overall_users,
//             today_users: data.today_users,
//             games: 19,
//             unique_emails_today: data.unique_emails_today,
//             today_registered_players: data.today_registered_players
//           });
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) {
//             setSelectedMarket(marketsData[0].market_name);
//           }
//         }
//       } catch (error) {
//         console.error("Initial data fetch failed:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [router, currentDate]);

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) {
//       console.error("Error fetching ank bets:", error);
//       setSingleAnkBets([]);
//     } finally {
//       setBetsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedMarket && reportDate) {
//       fetchAnkBets(selectedMarket, reportDate);
//     }
//   }, [selectedMarket, reportDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     setFundHistory([]); // Clear old fund history
//     const token = localStorage.getItem('token');
//     try {
//       const [summaryRes, fundHistoryRes] = await Promise.all([
//         fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         }),
//         fetch(`https://backend.gdmatka.site/funds/today?date=${reportDate}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//       ]);
//       if (summaryRes.ok) setReportStats(await summaryRes.json());
//       if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//     } catch (error) {
//       console.error("Failed to fetch report:", error);
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   const handleWithdrawalAction = async (withdrawalId: number, action: 'settle' | 'decline') => {
//     const token = localStorage.getItem('token');
//     setModalLoading(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/admin/withdrawals/update`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ withdrawalId, action }),
//       });
//       if (!response.ok) throw new Error(`Failed to ${action} withdrawal`);

//       setModalData(prevData =>
//         prevData.map(item =>
//           item.withdrawal_id === withdrawalId
//             ? { ...item, status: action === 'settle' ? 'Settled' : 'Declined' }
//             : item
//         )
//       );
//     } catch (error) {
//       console.error(`Error processing withdrawal action:`, error);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const displayStats = reportStats || todayStats;

//   const handleViewClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     setModalActions([]); // Reset actions
//     const token = localStorage.getItem('token');
//     const dateForApi = reportStats ? reportDate : currentDate;

//     try {
//       let url = `https://backend.gdmatka.site/api/${type}`;
//       if (type.includes('/today')) {
//         url += `?date=${dateForApi}`;
//       } else if (type.includes('bids')) {
//         url = `https://backend.gdmatka.site/api/bids/today?date=${dateForApi}`;
//       } else if (type.includes('withdrawals') || type.includes('deposits') || type.includes('funds')) {
//         url += `?date=${dateForApi}`;
//       }

//       const response = await fetch(url, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData: ModalData[] = [];
//       let actions: ActionButton[] = [];

//       // Bids
//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => {
//           const betDigit = item.first_number + (item.second_number ? item.second_number : '');
//           return {
//             user_id: item.user_id,
//             user: item.full_name || item.phone_number || item.email,
//             'Market Name': item.market_name,
//             'Game Type': item.game_name,
//             'Bet Digit': betDigit,
//             'Points': `₹${Number(item.points).toFixed(2)}`,
//             status: item.status,
//             'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//             date: new Date(item.created_at || item.createdat).toLocaleString(),
//           };
//         });
//       }
//       // Funds / Deposits
//       else if (type.startsWith('funds') || type.startsWith('deposits')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount).toFixed(2)}`,
//           status: item.status,
//           date: new Date(item.createdat).toLocaleString(),
//         }));
//       }
//       // Withdrawals
//       else if (type.startsWith('withdrawals')) {
//         formattedData = data.map((item: any) => ({
//           withdrawal_id: item.withdrawal_id,
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.withdrawal_amount).toFixed(2)}`,
//           status: item.withdrawal_status,
//           date: new Date(item.created_at).toLocaleString(),
//           payment_method: item.provider,
//         }));

//         if (type === 'withdrawals/pending') {
//           actions = [
//             {
//               label: 'Accept',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'settle'),
//               color: 'bg-green-500 hover:bg-green-600 text-white'
//             },
//             {
//               label: 'Decline',
//               onClick: (item: ModalData) => handleWithdrawalAction(Number(item.withdrawal_id!), 'decline'),
//               color: 'bg-red-500 hover:bg-red-600 text-white'
//             }
//           ];
//         }
//         setModalActions(actions);
//       }
//       // Users default
//       else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number,
//           phone: item.phone_number,
//           status: item.status,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleCardClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();
//       const formattedData = data.map((item: any) => ({
//         user_id: item.user_id,
//         user: item.full_name || item.phone_number,
//         phone: item.phone_number,
//         status: item.status,
//         wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//       }));
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleViewProfile = (userIdLike: any) => {
//     const uid = extractUserId({ user_id: userIdLike });
//     if (!uid) return;
//     router.push(`/user-management/${uid}`);
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-[calc(100vh-80px)]">
//         <Loader2 className="animate-spin text-blue-600" size={48} />
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         data={modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//         actions={modalActions}
//       />

//       <Card className="p-4 bg-white shadow-md">
//         <div className="flex justify-between items-start">
//           <div>
//             <p className="text-sm text-gray-500">Dashboards / Dashboard</p>
//             <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
//             <p className="text-gray-500">Admin Dashboard</p>
//           </div>
//           <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300"></div>
//         </div>
//         <div className="flex justify-between items-center mt-4">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
//               <User size={24} className="text-gray-600" />
//             </div>
//             <p className="font-semibold">Admin</p>
//           </div>
//           <div className="flex gap-8 text-center">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div onClick={() => router.push('/user-management')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleViewClick('users/registered-today', "Today's Registrations")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Registration</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <Card className="p-4 flex items-center space-x-4 shadow h-full">
//           <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gamepad size={24} /></div>
//           <div>
//             <p className="text-gray-500">Games</p>
//             <p className="text-2xl font-bold text-gray-800">{topStats?.games ?? '0'}</p>
//           </div>
//         </Card>
//         <div onClick={() => handleViewClick('users/active-today', "Today's Active Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-pink-100 text-pink-600"><ClipboardList size={24} /></div>
//             <div>
//               <p className="text-gray-500">Players ( Today )</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.unique_emails_today ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleViewClick('users/today-registered-players', "Today's New Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 h-full">
//             <div className="p-3 rounded-full bg-teal-100 text-teal-600"><UserPlus size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Reg. Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_registered_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//       </div>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-2">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select className="p-2 border rounded-md w-full sm:w-auto"><option>-Select Game Name-</option></select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? (
//           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               const totalBids = bet.total_open_bets + bet.total_closed_bets;
//               const totalAmount = bet.total_open_points + bet.total_closed_points;
//               return (
//                 <div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}>
//                   <p>Total Bids: <span className="font-bold">{totalBids}</span></p>
//                   <p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p>
//                   <div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" />
//           <select className="p-2 border rounded-md"><option>All</option></select>
//           <Button onClick={handleGetReport} disabled={isReportLoading}>
//             {isReportLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//             Get Report
//           </Button>
//           <Button variant="outline" className="text-red-500 border-red-500" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? (
//           <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
//             <ReportStat label="Total Bid Amount" value={displayStats?.total_bid_amount} onViewClick={() => handleViewClick('bids/today', "Bids")} />
//             <ReportStat label="Withdraw Request" value={displayStats?.withdraw_request} onViewClick={() => handleViewClick('withdrawals/pending', "Pending Withdrawals")} />
//             <ReportStat label="Total Winning Amount" value={displayStats?.total_winning_amount} onViewClick={() => handleViewClick('bids/winning/today', "Winning Bids")} />
//             <ReportStat label="Total Deposit (Approved)" value={displayStats?.total_deposit_approved} onViewClick={() => handleViewClick('deposits/approved/today', "Approved Deposits")} />
//             <ReportStat label="Total Profit Amount" value={displayStats?.total_profit} isProfit />
//             <ReportStat label="Add Funds ( Manually )" value={displayStats?.add_funds_manually} onViewClick={() => handleViewClick('funds/manual/today', "Manual Fund Additions")} />
//             <ReportStat label="Total Wallet Balance" value={displayStats?.total_wallet_balance} />
//             <ReportStat label="Total Withdraw" value={displayStats?.total_withdraw} onViewClick={() => handleViewClick('withdrawals/settled/today', "Settled Withdrawals")} />
//           </div>
//         )}
//       </Card>

//       {/* --------- Fund History with View Action (safe) --------- */}
//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">User</th>
//                 <th className="p-2">Mobile</th>
//                 <th className="p-2">Amount</th>
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory.map((item, index) => {
//                 const displayUser =
//                   item.full_name?.trim() ||
//                   item.phone_number?.trim() ||
//                   item.email?.trim() ||
//                   'Unknown User';

//                 const displayPhone = item.phone_number?.trim() || 'N/A';
//                 const uid = extractUserId(item);

//                 return (
//                   <tr key={item.id} className="border-b">
//                     <td className="p-2">{index + 1}</td>

//                     {/* User (clickable only if uid is valid) */}
//                     <td className="p-2">
//                       {uid ? (
//                         <span
//                           className="cursor-pointer text-blue-600 hover:underline"
//                           onClick={() => handleViewProfile(uid)}
//                           title={displayUser}
//                         >
//                           {displayUser}
//                         </span>
//                       ) : (
//                         <span className="text-gray-700" title="User ID not available">
//                           {displayUser}
//                         </span>
//                       )}
//                     </td>

//                     {/* Mobile */}
//                     <td className="p-2">{displayPhone}</td>

//                     {/* Amount */}
//                     <td className="p-2 font-semibold">₹{Number(item.amount).toFixed(2)}</td>

//                     {/* Date */}
//                     <td className="p-2">{item.createdat_ist}</td>

//                     {/* Status */}
//                     <td className="p-2">
//                       <span
//                         className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED'
//                             ? 'bg-green-100 text-green-800'
//                             : item.status === 'REJECTED'
//                               ? 'bg-red-100 text-red-800'
//                               : 'bg-yellow-100 text-yellow-800'
//                           }`}
//                       >
//                         {item.status}
//                       </span>
//                     </td>

//                     {/* Actions -> View (disabled when uid missing) */}
//                     <td className="p-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         className="gap-1"
//                         onClick={() => uid && handleViewProfile(uid)}
//                         disabled={!uid}
//                         title={uid ? 'View user profile' : 'User ID not available'}
//                       >
//                         <User size={14} />
//                         View
//                       </Button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // Helper component
// const ReportStat = ({
//   label,
//   value,
//   isProfit = false,
//   onViewClick
// }: {
//   label: string;
//   value: number | undefined;
//   isProfit?: boolean;
//   onViewClick?: () => void;
// }) => {
//   const numericValue = typeof value === 'number' ? value : 0;
//   const formattedValue = numericValue.toLocaleString();
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (numericValue ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-md flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && (
//           <Button size="sm" variant="outline" onClick={onViewClick}>
//             View
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };


// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus } from 'lucide-react';
// import DetailsModal from '@/components/DetailsModal'; // This is a mock import, the component is defined below

// // --- Interfaces ---
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
// }
// interface ModalData {
//   user_id?: number;
//   user?: string;
//   phone?: string;
//   amount?: string;
//   status?: string;
//   date?: string;
//   'Market Name'?: string;
//   'Bet Digit'?: string;
//   Points?: string;
//   'Win/Loss'?: string;
//   wallet?: string;
//   withdrawal_id?: number;
// }
// interface ActionButton {
//   label: string;
//   onClick: (item: any) => void;
//   color: string;
// }

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();

//   // --- States ---
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);

//   // States for today's data vs. selected report date data
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   // States for "Single Ank" section
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);

//   // Details Modal States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState<ModalData[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalActions, setModalActions] = useState<ActionButton[]>([]);

//   // --- Data Fetching & Handlers ---
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       router.push('/admin/login');
//       return;
//     }

//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch('https://backend.gdmatka.site/api/getdetails', { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${currentDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);

//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats({
//             overall_users: data.overall_users,
//             today_users: data.today_users,
//             games: 19,
//             unique_emails_today: data.unique_emails_today,
//             today_registered_players: data.today_registered_players
//           });
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) {
//             setSelectedMarket(marketsData[0].market_name);
//           }
//         }
//       } catch (error) {
//         console.error("Initial data fetch failed:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [router]);

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) {
//       console.error("Error fetching ank bets:", error);
//       setSingleAnkBets([]);
//     } finally {
//       setBetsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedMarket && currentDate) {
//       fetchAnkBets(selectedMarket, currentDate);
//     }
//   }, [selectedMarket, currentDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error("Failed to fetch report");
//       setReportStats(await response.json());
//     } catch (error) {
//       console.error("Failed to fetch report:", error);
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   const handleWithdrawalAction = async (withdrawalId: number, action: 'settle' | 'decline') => {
//     const token = localStorage.getItem('token');
//     setModalLoading(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/admin/withdrawals/update`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ withdrawalId, action }),
//       });
//       if (!response.ok) throw new Error(`Failed to ${action} withdrawal`);

//       // Update local state to reflect the change
//       setModalData(prevData =>
//         prevData.map(item =>
//           item.withdrawal_id === withdrawalId
//             ? { ...item, status: action === 'settle' ? 'Settled' : 'Declined' }
//             : item
//         )
//       );
//     } catch (error) {
//       console.error(`Error processing withdrawal action:`, error);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const displayStats = reportStats || todayStats;
//   const handleViewClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     setModalActions([]); // Reset actions
//     const token = localStorage.getItem('token');
//     const dateForApi = reportStats ? reportDate : currentDate;

//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}?date=${dateForApi}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData = [];
//       let actions = [];

//       // Bids के लिए विशेष लॉजिक
//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => {
//           const betDigit = item.first_number + (item.second_number ? item.second_number : '');
//           return {
//             user_id: item.user_id,
//             user: item.full_name || item.phone_number || item.email,
//             'Market Name': item.market_name,
//             'Bet Digit': betDigit,
//             'Points': `₹${Number(item.points).toFixed(2)}`,
//             'Status': item.status,
//             'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//             date: new Date(item.created_at || item.createdat).toLocaleString(),
//           };
//         });
//       }
//       // Funds के लिए विशेष लॉजिक (manual, approved deposits)
//       else if (type.startsWith('funds') || type.startsWith('deposits')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount).toFixed(2)}`,
//           status: item.status,
//           date: new Date(item.createdat).toLocaleString(),
//         }));
//       }
//       // Withdrawals के लिए विशेष लॉजिक
//       else if (type.startsWith('withdrawals')) {
//         formattedData = data.map((item: any) => ({
//           withdrawal_id: item.withdrawal_id,
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.withdrawal_amount).toFixed(2)}`,
//           status: item.withdrawal_status,
//           date: new Date(item.created_at).toLocaleString(),
//           payment_method: item.provider,
//         }));

//         // Add action buttons only for pending withdrawals
//         if (type === 'withdrawals/pending') {
//           actions = [
//             {
//               label: 'Accept',
//               onClick: (item: ModalData) => handleWithdrawalAction(item.withdrawal_id!, 'settle'),
//               color: 'bg-green-500 hover:bg-green-600 text-white'
//             },
//             {
//               label: 'Decline',
//               onClick: (item: ModalData) => handleWithdrawalAction(item.withdrawal_id!, 'decline'),
//               color: 'bg-red-500 hover:bg-red-600 text-white'
//             }
//           ];
//         }
//         setModalActions(actions);

//       }
//       // Users के लिए डिफ़ॉल्ट लॉजिक
//       else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number,
//           phone: item.phone_number,
//           status: item.status,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleCardClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();
//       const formattedData = data.map((item: any) => ({
//         user_id: item.user_id,
//         user: item.full_name || item.phone_number,
//         phone: item.phone_number,
//         status: item.status,
//         wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//       }));
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleViewProfile = (userId: number) => {
//     router.push(`/user-management/${userId}`);
//   };

//   if (loading) {
//     return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         data={modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//         actions={modalActions}
//       />

//       <Card className="p-4 bg-white shadow-md">
//         <div className="flex justify-between items-start">
//           <div>
//             <p className="text-sm text-gray-500">Dashboards / Dashboard</p>
//             <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
//             <p className="text-gray-500">Admin Dashboard</p>
//           </div>
//           <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300"></div>
//         </div>
//         <div className="flex justify-between items-center mt-4">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
//               <User size={24} className="text-gray-600" />
//             </div>
//             <p className="font-semibold">Admin</p>
//           </div>
//           <div className="flex gap-8 text-center">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div onClick={() => router.push('/user-management')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleCardClick('users/registered-today', "Today's Registrations")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Registration</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <Card className="p-4 flex items-center space-x-4 shadow h-full">
//           <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gamepad size={24} /></div>
//           <div>
//             <p className="text-gray-500">Games</p>
//             <p className="text-2xl font-bold text-gray-800">{topStats?.games ?? '0'}</p>
//           </div>
//         </Card>
//         <div onClick={() => handleCardClick('users/active-today', "Today's Active Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-pink-100 text-pink-600"><ClipboardList size={24} /></div>
//             <div>
//               <p className="text-gray-500">Players ( Today )</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.unique_emails_today ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleCardClick('users/today-registered-players', "Today's New Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 h-full">
//             <div className="p-3 rounded-full bg-teal-100 text-teal-600"><UserPlus size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Reg. Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_registered_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//       </div>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-2">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select className="p-2 border rounded-md w-full sm:w-auto"><option>-Select Game Name-</option></select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? (
//           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               const totalBids = bet.total_open_bets + bet.total_closed_bets;
//               const totalAmount = bet.total_open_points + bet.total_closed_points;
//               return (
//                 <div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}>
//                   <p>Total Bids: <span className="font-bold">{totalBids}</span></p>
//                   <p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p>
//                   <div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" />
//           <select className="p-2 border rounded-md"><option>All</option></select>
//           <Button onClick={handleGetReport} disabled={isReportLoading}>
//             {isReportLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//             Get Report
//           </Button>
//           <Button variant="outline" className="text-red-500 border-red-500" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? (
//           <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
//             <ReportStat label="Total Bid Amount" value={displayStats?.total_bid_amount} onViewClick={() => handleViewClick('bids/today', "Bids")} />
//             <ReportStat label="Withdraw Request" value={displayStats?.withdraw_request} onViewClick={() => handleViewClick('withdrawals/pending', "Pending Withdrawals")} />
//             <ReportStat label="Total Winning Amount" value={displayStats?.total_winning_amount} onViewClick={() => handleViewClick('bids/winning/today', "Winning Bids")} />
//             <ReportStat label="Total Deposit (Approved)" value={displayStats?.total_deposit_approved} onViewClick={() => handleViewClick('deposits/approved/today', "Approved Deposits")} />
//             <ReportStat label="Total Profit Amount" value={displayStats?.total_profit} isProfit />
//             <ReportStat label="Add Funds ( Manually )" value={displayStats?.add_funds_manually} onViewClick={() => handleViewClick('funds/manual/today', "Manual Fund Additions")} />
//             <ReportStat label="Total Wallet Balance" value={displayStats?.total_wallet_balance} />
//             <ReportStat label="Total Withdraw" value={displayStats?.total_withdraw} onViewClick={() => handleViewClick('withdrawals/settled/today', "Settled Withdrawals")} />
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">User Name</th>
//                 <th className="p-2">Mobile</th>
//                 <th className="p-2">Amount</th>
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory.map((item, index) => (
//                 <tr key={item.id} className="border-b">
//                   <td className="p-2">{index + 1}</td>
//                   <td className="p-2">{item.email.split('@')[0]}</td>
//                   <td className="p-2">{item.phone_number || 'N/A'}</td>
//                   <td className="p-2 font-semibold">₹{item.amount}</td>
//                   <td className="p-2">{new Date(item.createdat).toLocaleString()}</td>
//                   <td className="p-2">
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
//                       'bg-yellow-100 text-yellow-800'
//                       }`}>
//                       {item.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // Helper component
// const ReportStat = ({ label, value, isProfit = false, onViewClick }: { label: string; value: number; isProfit?: boolean; onViewClick?: () => void; }) => {
//   const formattedValue = typeof value === 'number' ? value.toLocaleString() : '0';
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (value ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-md flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && <Button size="sm" variant="outline" onClick={onViewClick}>View</Button>}
//       </div>
//     </div>
//   );
// };


// // ------------------------------------
// // Details Modal component
// // This component has been added to make the file self-contained
// // ------------------------------------
// interface DetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   data: ModalData[];
//   loading: boolean;
//   onViewProfile: (userId: number) => void;
//   actions: ActionButton[];
// }

// const DetailsModal = ({ isOpen, onClose, title, data, loading, onViewProfile, actions }: DetailsModalProps) => {
//   if (!isOpen) return null;

//   const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'withdrawal_id') : [];

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold">{title}</h2>
//           <Button variant="ghost" onClick={onClose}>&times;</Button>
//         </div>
//         <div className="p-4 flex-grow overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" size={32} /></div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {headers.map((header) => (
//                     <th key={header} className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                   {actions.length > 0 && (
//                     <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {data.map((item, index) => (
//                   <tr key={index}>
//                     {headers.map((header) => (
//                       <td key={header} className="p-2 whitespace-nowrap text-sm text-gray-900">
//                         {item[header as keyof ModalData]}
//                       </td>
//                     ))}
//                     {actions.length > 0 && (
//                       <td className="p-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                         {actions.map((action, actionIndex) => (
//                           <Button key={actionIndex} onClick={() => action.onClick(item)} className={action.color} size="sm">{action.label}</Button>
//                         ))}
//                       </td>
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//         <div className="p-4 border-t flex justify-end">
//           <Button onClick={onClose}>Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// "use client";

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Loader2, Users, Gamepad, ClipboardList, User, UserPlus } from 'lucide-react';
// import DetailsModal from '@/components/DetailsModal';

// // --- Interfaces ---
// interface TopStats {
//   overall_users: number;
//   today_users: number;
//   games: number;
//   unique_emails_today: number;
//   today_registered_players: number;
// }
// interface GameReportStats {
//   total_bid_amount: number;
//   total_winning_amount: number;
//   total_profit: number;
//   total_wallet_balance: number;
//   withdraw_request: number;
//   total_deposit_approved: number;
//   add_funds_manually: number;
//   total_withdraw: number;
// }
// interface SingleAnkBet {
//   ank: number;
//   total_open_points: number;
//   total_closed_points: number;
//   total_open_bets: number;
//   total_closed_bets: number;
// }
// interface FundHistoryItem {
//   id: number;
//   email: string;
//   phone_number: string;
//   amount: number;
//   createdat: string;
//   status: 'APPROVED' | 'PENDING' | 'REJECTED';
// }

// // --- Main Dashboard Page Component ---
// export default function DashboardPage() {
//   const router = useRouter();

//   // --- States ---
//   const [loading, setLoading] = useState(true);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const [fundHistory, setFundHistory] = useState<FundHistoryItem[]>([]);
//   const [markets, setMarkets] = useState<any[]>([]);

//   // States for today's data vs. selected report date data
//   const [todayStats, setTodayStats] = useState<GameReportStats | null>(null);
//   const [reportStats, setReportStats] = useState<GameReportStats | null>(null);
//   const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
//   const [isReportLoading, setIsReportLoading] = useState(false);

//   // States for "Single Ank" section
//   const [selectedMarket, setSelectedMarket] = useState('');
//   const [singleAnkBets, setSingleAnkBets] = useState<SingleAnkBet[]>([]);
//   const [betsLoading, setBetsLoading] = useState(false);
//   const [currentDate] = useState(new Date().toISOString().split('T')[0]);

//   // Details Modal States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState('');
//   const [modalData, setModalData] = useState([]);
//   const [modalLoading, setModalLoading] = useState(false);

//   // --- Data Fetching & Handlers ---
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) return;

//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [summaryRes, fundHistoryRes, marketsRes] = await Promise.all([
//           fetch('https://backend.gdmatka.site/api/getdetails', { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch(`https://backend.gdmatka.site/funds/today?date=${currentDate}`, { headers: { 'Authorization': `Bearer ${token}` } }),
//           fetch('https://backend.gdmatka.site/api/market', { headers: { 'Authorization': `Bearer ${token}` } })
//         ]);

//         if (summaryRes.ok) {
//           const data = await summaryRes.json();
//           setTopStats({
//             overall_users: data.overall_users,
//             today_users: data.today_users,
//             games: 19,
//             unique_emails_today: data.unique_emails_today,
//             today_registered_players: data.today_registered_players
//           });
//           setTodayStats(data);
//         }
//         if (fundHistoryRes.ok) setFundHistory(await fundHistoryRes.json());
//         if (marketsRes.ok) {
//           const marketsData = await marketsRes.json();
//           setMarkets(marketsData);
//           if (marketsData.length > 0) {
//             setSelectedMarket(marketsData[0].market_name);
//           }
//         }
//       } catch (error) {
//         console.error("Initial data fetch failed:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const fetchAnkBets = async (marketName: string, date: string) => {
//     if (!marketName || !date) return;
//     setBetsLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/bets?market_name=${encodeURIComponent(marketName)}&market_date=${date}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error('Failed to fetch ank bets');
//       setSingleAnkBets(await response.json());
//     } catch (error) {
//       console.error("Error fetching ank bets:", error);
//       setSingleAnkBets([]);
//     } finally {
//       setBetsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedMarket && currentDate) {
//       fetchAnkBets(selectedMarket, currentDate);
//     }
//   }, [selectedMarket, currentDate]);

//   const handleGetReport = async () => {
//     setIsReportLoading(true);
//     setReportStats(null);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/getdetails?date=${reportDate}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) throw new Error("Failed to fetch report");
//       setReportStats(await response.json());
//     } catch (error) {
//       console.error("Failed to fetch report:", error);
//     } finally {
//       setIsReportLoading(false);
//     }
//   };

//   const displayStats = reportStats || todayStats;
//   const handleViewClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     const dateForApi = reportStats ? reportDate : currentDate;

//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}?date=${dateForApi}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();

//       let formattedData = [];

//       // Bids के लिए विशेष लॉजिक
//       if (type.startsWith('bids')) {
//         formattedData = data.map((item: any) => {
//           const betDigit = item.first_number + (item.second_number ? item.second_number : '');
//           return {
//             user_id: item.user_id,
//             user: item.full_name || item.phone_number || item.email,
//             'Market Name': item.market_name,
//             'Bet Digit': betDigit,
//             'Points': `₹${Number(item.points).toFixed(2)}`,
//             'Status': item.status,
//             'Win/Loss': item.status === 'won' ? `+₹${Number(item.amount_won).toFixed(2)}` : `-₹${Number(item.points).toFixed(2)}`,
//             date: new Date(item.created_at || item.createdat).toLocaleString(),
//           };
//         });
//       }
//       // Funds के लिए विशेष लॉजिक (manual, approved deposits)
//       else if (type.startsWith('funds') || type.startsWith('deposits')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           phone: item.phone_number,
//           amount: `₹${Number(item.amount).toFixed(2)}`,
//           status: item.status,
//           date: new Date(item.createdat).toLocaleString(),
//         }));
//       }
//       // Withdrawals के लिए विशेष लॉजिक
//       else if (type.startsWith('withdrawals')) {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number || item.email,
//           amount: `₹${Number(item.withdrawal_amount).toFixed(2)}`,
//           status: item.withdrawal_status,
//           date: new Date(item.created_at).toLocaleString(),
//         }));
//       }
//       // Users के लिए डिफ़ॉल्ट लॉजिक
//       else {
//         formattedData = data.map((item: any) => ({
//           user_id: item.user_id,
//           user: item.full_name || item.phone_number,
//           phone: item.phone_number,
//           status: item.status,
//           wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//         }));
//       }
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };
//   const handleCardClick = async (type: string, title: string) => {
//     setIsModalOpen(true);
//     setModalTitle(title);
//     setModalLoading(true);
//     const token = localStorage.getItem('token');
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/${type}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error(`Failed to fetch ${type}`);
//       const data = await response.json();
//       const formattedData = data.map((item: any) => ({
//         user_id: item.user_id,
//         user: item.full_name || item.phone_number,
//         phone: item.phone_number,
//         status: item.status,
//         wallet: `₹${Number(item.wallet_balance || 0).toFixed(2)}`
//       }));
//       setModalData(formattedData);
//     } catch (error) {
//       console.error(`Error fetching ${title}:`, error);
//       setModalData([]);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleViewProfile = (userId: number) => {
//     router.push(`/user-management/${userId}`);
//   };

//   if (loading) {
//     return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <DetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={modalTitle}
//         data={modalData}
//         loading={modalLoading}
//         onViewProfile={handleViewProfile}
//       />

//       <Card className="p-4 bg-white shadow-md">
//         <div className="flex justify-between items-start">
//           <div>
//             <p className="text-sm text-gray-500">Dashboards / Dashboard</p>
//             <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
//             <p className="text-gray-500">Admin Dashboard</p>
//           </div>
//           <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300"></div>
//         </div>
//         <div className="flex justify-between items-center mt-4">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
//               <User size={24} className="text-gray-600" />
//             </div>
//             <p className="font-semibold">Admin</p>
//           </div>
//           <div className="flex gap-8 text-center">
//             <div>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//               <p className="text-sm text-gray-500">Approved Users</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-800">0</p>
//               <p className="text-sm text-gray-500">Unapproved Users</p>
//             </div>
//           </div>
//         </div>
//       </Card>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div onClick={() => router.push('/user-management')} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Users</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleCardClick('users/registered-today', "Today's Registrations")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Users size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Registration</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_users ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <Card className="p-4 flex items-center space-x-4 shadow h-full">
//           <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gamepad size={24} /></div>
//           <div>
//             <p className="text-gray-500">Games</p>
//             <p className="text-2xl font-bold text-gray-800">{topStats?.games ?? '0'}</p>
//           </div>
//         </Card>
//         <div onClick={() => handleCardClick('users/active-today', "Today's Active Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 transition-colors h-full">
//             <div className="p-3 rounded-full bg-pink-100 text-pink-600"><ClipboardList size={24} /></div>
//             <div>
//               <p className="text-gray-500">Players ( Today )</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.unique_emails_today ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//         <div onClick={() => handleCardClick('users/today-registered-players', "Today's New Players")} className="cursor-pointer">
//           <Card className="p-4 flex items-center space-x-4 shadow hover:bg-gray-50 h-full">
//             <div className="p-3 rounded-full bg-teal-100 text-teal-600"><UserPlus size={24} /></div>
//             <div>
//               <p className="text-gray-500">Today Reg. Player</p>
//               <p className="text-2xl font-bold text-gray-800">{topStats?.today_registered_players ?? '0'}</p>
//             </div>
//           </Card>
//         </div>
//       </div>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-2">Total Bids On Single Ank Of Date {new Date(currentDate).toLocaleDateString('en-GB')}</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <select className="p-2 border rounded-md w-full sm:w-auto"><option>-Select Game Name-</option></select>
//           <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="p-2 border rounded-md w-full sm:w-auto">
//             <option value="">-Select Market-</option>
//             {markets.map((m) => <option key={m.market_id} value={m.market_name}>{m.market_name}</option>)}
//           </select>
//         </div>
//         {betsLoading ? (
//           <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//             {singleAnkBets.map((bet) => {
//               const totalBids = bet.total_open_bets + bet.total_closed_bets;
//               const totalAmount = bet.total_open_points + bet.total_closed_points;
//               return (
//                 <div key={bet.ank} className="p-3 rounded-lg border" style={{ backgroundColor: ['#e0f2fe', '#dcfce7', '#fef3c7', '#ffe4e6', '#f3e8ff'][bet.ank % 5] }}>
//                   <p>Total Bids: <span className="font-bold">{totalBids}</span></p>
//                   <p>Total Bid Amount: <span className="font-bold">{totalAmount}</span></p>
//                   <div className="mt-2 text-center font-bold text-xl py-2 rounded-lg" style={{ backgroundColor: ['#38bdf8', '#4ade80', '#facc15', '#fb7185', '#c084fc'][bet.ank % 5] }}>
//                     Ank {bet.ank}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Game Report</h2>
//         <div className="flex flex-wrap items-center gap-4 mb-4">
//           <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="p-2 border rounded-md" />
//           <select className="p-2 border rounded-md"><option>All</option></select>
//           <Button onClick={handleGetReport} disabled={isReportLoading}>
//             {isReportLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//             Get Report
//           </Button>
//           <Button variant="outline" className="text-red-500 border-red-500" onClick={() => { setReportStats(null); setReportDate(currentDate); }}>
//             CLEAR
//           </Button>
//         </div>
//         {isReportLoading ? (
//           <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
//             <ReportStat label="Total Bid Amount" value={displayStats?.total_bid_amount} onViewClick={() => handleViewClick('bids/today', "Bids")} />
//             <ReportStat label="Withdraw Request" value={displayStats?.withdraw_request} onViewClick={() => handleViewClick('withdrawals/pending', "Pending Withdrawals")} />
//             <ReportStat label="Total Winning Amount" value={displayStats?.total_winning_amount} onViewClick={() => handleViewClick('bids/winning/today', "Winning Bids")} />
//             <ReportStat label="Total Deposit (Approved)" value={displayStats?.total_deposit_approved} onViewClick={() => handleViewClick('deposits/approved/today', "Approved Deposits")} />
//             <ReportStat label="Total Profit Amount" value={displayStats?.total_profit} isProfit />
//             <ReportStat label="Add Funds ( Manually )" value={displayStats?.add_funds_manually} onViewClick={() => handleViewClick('funds/manual/today', "Manual Fund Additions")} />
//             <ReportStat label="Total Wallet Balance" value={displayStats?.total_wallet_balance} />
//             <ReportStat label="Total Withdraw" value={displayStats?.total_withdraw} onViewClick={() => handleViewClick('withdrawals/settled/today', "Settled Withdrawals")} />
//           </div>
//         )}
//       </Card>

//       <Card className="p-4 bg-white shadow-md">
//         <h2 className="text-lg font-bold text-gray-700 mb-4">Fund Request Auto Deposit History</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">User Name</th>
//                 <th className="p-2">Mobile</th>
//                 <th className="p-2">Amount</th>
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fundHistory.map((item, index) => (
//                 <tr key={item.id} className="border-b">
//                   <td className="p-2">{index + 1}</td>
//                   <td className="p-2">{item.email.split('@')[0]}</td>
//                   <td className="p-2">{item.phone_number || 'N/A'}</td>
//                   <td className="p-2 font-semibold">₹{item.amount}</td>
//                   <td className="p-2">{new Date(item.createdat).toLocaleString()}</td>
//                   <td className="p-2">
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
//                       'bg-yellow-100 text-yellow-800'
//                       }`}>
//                       {item.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // Helper component
// const ReportStat = ({ label, value, isProfit = false, onViewClick }: { label: string; value: number; isProfit?: boolean; onViewClick?: () => void; }) => {
//   const formattedValue = typeof value === 'number' ? value.toLocaleString() : '0';
//   const displayValue = `${label.toLowerCase().includes('request') ? '' : '₹'}${formattedValue}`;
//   const profitColor = (value ?? 0) >= 0 ? 'bg-green-600' : 'bg-red-600';

//   return (
//     <div className={`p-2 rounded-md flex justify-between items-center border ${isProfit ? profitColor : 'bg-gray-50'}`}>
//       <span className={`text-sm ${isProfit ? 'text-white' : 'text-gray-600'}`}>{label}</span>
//       <div className="flex items-center space-x-2">
//         <span className={`font-bold text-right ${isProfit ? 'text-white' : 'text-gray-800'}`}>{displayValue}</span>
//         {onViewClick && <Button size="sm" variant="outline" onClick={onViewClick}>View</Button>}
//       </div>
//     </div>
//   );
// };
