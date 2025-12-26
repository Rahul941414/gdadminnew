"use client";
import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Check, X, Clock, DollarSign, User, Zap, Wallet, Eye, IndianRupee, Calendar, Mail, Phone, Building, CreditCard, FileText, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WRow = {
  withdrawal_id: number;
  user_email: string;
  full_name: string;
  phone_number: string;
  withdrawal_amount: number;
  withdrawal_status: string;
  withdrawal_type: string;
  provider: 'bank' | 'phonepe' | 'gpay' | 'paytm';
  wallet_number?: string | null;
  account_holder_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  created_at: string;
};

// --- Helper Components ---
const formatAmount = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ProviderBadge = ({ p }: { p: WRow['provider'] }) => {
  switch (p) {
    case 'bank':    return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">🏦 Bank Transfer</Badge>;
    case 'phonepe': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">💜 PhonePe UPI</Badge>;
    case 'gpay':    return <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-200">💚 Google Pay</Badge>;
    case 'paytm':   return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">💙 Paytm Wallet</Badge>;
    default:        return <Badge variant="secondary">{p}</Badge>;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  let className = "";
  
  if (s === "settled") {
    className = "bg-green-100 text-green-800 hover:bg-green-200";
  } else if (s === "declined") {
    className = "bg-red-100 text-red-800 hover:bg-red-200";
  } else if (s === "pending") {
    className = "bg-amber-100 text-amber-800 hover:bg-amber-200";
  }
  
  return (
    <Badge variant="secondary" className={`capitalize ${className}`}>
      {s === "pending" && <Clock className="w-3 h-3 mr-1" />}
      {s === "settled" && <Check className="w-3 h-3 mr-1" />}
      {s === "declined" && <X className="w-3 h-3 mr-1" />}
      {status}
    </Badge>
  );
};

/* ---------------------------- Main Component ---------------------------- */

const AdminWithdrawalsPage = () => {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WRow[]>([]);
  const [historyWithdrawals, setHistoryWithdrawals] = useState<WRow[]>([]);
  const [activeTab, setActiveTab] = useState<"pending"|"history">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [token, setToken] = useState<string|null>(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalSettled: 0,
    totalDeclined: 0,
    totalAmount: 0
  });
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) {
      fetchWithdrawals();
    }
  }, [token]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("https://backend.gdmatka.site/admin/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch withdrawals.");
      const data: WRow[] = await response.json();

      const pending = data.filter(w => (w.withdrawal_status || '').toLowerCase() === "pending");
      const history = data.filter(w =>
        (w.withdrawal_status || '').toLowerCase() === "settled" ||
        (w.withdrawal_status || '').toLowerCase() === "declined"
      );

      const sortLatest = (a: WRow, b: WRow) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      
      setPendingWithdrawals(pending.sort(sortLatest));
      setHistoryWithdrawals(history.sort(sortLatest));

      // Calculate statistics
      setStats({
        totalPending: pending.length,
        totalSettled: data.filter(w => w.withdrawal_status?.toLowerCase() === "settled").length,
        totalDeclined: data.filter(w => w.withdrawal_status?.toLowerCase() === "declined").length,
        totalAmount: data.reduce((sum, w) => sum + (w.withdrawal_amount || 0), 0)
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch withdrawals data.");
      setLoading(false);
    }
  };

  const handleAction = async (withdrawalId: number, action: "settle"|"decline") => {
    const confirmMessage = action === "settle"
      ? "Are you sure you want to settle this withdrawal?"
      : "Are you sure you want to decline this withdrawal?";
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        "https://backend.gdmatka.site/admin/withdrawals/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ withdrawalId, action }),
        }
      );

      if (!response.ok) throw new Error("Failed to update withdrawal.");
      alert(`Withdrawal successfully ${action === "settle" ? "settled" : "declined"}.`);
      fetchWithdrawals();
    } catch (err) {
      console.error(err);
      alert("Failed to update withdrawal.");
    }
  };

  const handleUserProfileClick = (userEmail: string, userName: string) => {
    // Navigate to user profile page with search parameter
    router.push(`/user-management?search=${encodeURIComponent(userEmail)}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderUserDetails = (w: WRow) => {
    return (
      <div className="space-y-2">
        {/* Clickable User Name */}
        <Button
          variant="ghost"
          className="p-0 h-auto text-left font-semibold text-blue-600 hover:text-blue-800 hover:bg-transparent"
          onClick={() => handleUserProfileClick(w.user_email, w.full_name)}
        >
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-bold">{w.full_name}</span>
          </div>
        </Button>
        
        {/* User Contact Information */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="w-3 h-3" />
            <span className="truncate">{w.user_email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Phone className="w-3 h-3" />
            <span>{w.phone_number}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{w.created_at.split(' ')[0]} • {w.created_at.split(' ')[1]}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPayoutDetails = (w: WRow) => {
    if (w.provider === 'bank') {
      return (
        <div className="space-y-3">
          {/* Bank Transfer Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Account Holder:</span>
                <p className="font-medium text-gray-900">{w.account_holder_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Bank Name:</span>
                <p className="font-medium text-gray-900">{w.bank_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Account Number:</span>
                <p className="font-mono font-medium text-gray-900">
                  {w.account_number ? `****${w.account_number.slice(-4)}` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">IFSC Code:</span>
                <p className="font-mono font-medium text-gray-900">{w.ifsc_code || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // UPI/Wallet Details
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-gray-900">
              {w.provider === 'phonepe' ? 'PhonePe UPI' :
               w.provider === 'gpay' ? 'Google Pay UPI' :
               w.provider === 'paytm' ? 'Paytm Wallet' : 'Digital Wallet'}
            </span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-500">Wallet/UPI ID:</span>
              <p className="font-mono font-medium text-gray-900 break-all">
                {w.wallet_number || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Transfer Type:</span>
              <p className="font-medium text-gray-900">Instant UPI Transfer</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWithdrawalsTable = (withdrawals: WRow[], showActions = true) => {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900 w-[15%]">User Details</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[10%]">Withdrawal ID</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[10%]">Method</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[12%] text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[8%] text-center">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[30%]">Payout Information</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[15%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {activeTab === "pending" ? 'No Pending Withdrawals' : 'No History Found'}
                      </h3>
                      <p className="text-gray-500">
                        {activeTab === "pending" 
                          ? 'All withdrawal requests have been processed.' 
                          : 'No settlement or decline history available.'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((w) => (
                    <TableRow key={w.withdrawal_id} className="hover:bg-blue-50/50 transition-colors border-b">
                      {/* User Details - First Column */}
                      <TableCell>
                        {renderUserDetails(w)}
                      </TableCell>

                      {/* Withdrawal ID */}
                      <TableCell>
                        <div className="text-center">
                          <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            #{w.withdrawal_id}
                          </span>
                        </div>
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell>
                        <ProviderBadge p={w.provider} />
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <IndianRupee className="w-4 h-4 text-red-500" />
                          <span className="text-lg font-bold text-red-600">
                            {Number(w.withdrawal_amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <StatusBadge status={w.withdrawal_status} />
                      </TableCell>

                      {/* Payout Information - Complete Details */}
                      <TableCell>
                        {renderPayoutDetails(w)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        {showActions ? (
                          <div className="flex flex-col space-y-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              onClick={() => handleAction(w.withdrawal_id, "settle")}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => handleAction(w.withdrawal_id, "decline")}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Processed
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <Eye className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="animate-spin text-blue-600 w-12 h-12" />
          <p className="text-xl font-semibold text-gray-700">Loading Withdrawals...</p>
          <p className="text-gray-500">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <X className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchWithdrawals} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Section */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleGoBack}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold text-white">Withdrawals Management</CardTitle>
                  <p className="text-blue-100 mt-1">Manage user withdrawal requests efficiently</p>
                </div>
              </div>
              <Button
                onClick={fetchWithdrawals}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-amber-500 to-orange-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pending Requests</p>
                  <p className="text-2xl font-bold">{stats.totalPending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-emerald-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Approved</p>
                  <p className="text-2xl font-bold">{stats.totalSettled}</p>
                </div>
                <Check className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-red-500 to-pink-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Declined</p>
                  <p className="text-2xl font-bold">{stats.totalDeclined}</p>
                </div>
                <X className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-cyan-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pending" | "history")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="pending" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Requests</span>
                  <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                    {pendingWithdrawals.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Transaction History</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {renderWithdrawalsTable(pendingWithdrawals, true)}
              </TabsContent>

              <TabsContent value="history">
                {renderWithdrawalsTable(historyWithdrawals, false)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWithdrawalsPage;



// "use client";
// import React, { useState, useEffect } from 'react';
// import { RefreshCw, ArrowLeft, Check, X, Clock, DollarSign, User, Zap, Wallet } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// type WRow = {
//   withdrawal_id: number;
//   user_email: string;
//   full_name: string;
//   phone_number: string;
//   withdrawal_amount: number;
//   withdrawal_status: string;   // Pending | Settled | Declined
//   withdrawal_type: string;     // wallet | bank
//   provider: 'bank' | 'phonepe' | 'gpay' | 'paytm';
//   wallet_number?: string | null;
//   account_holder_name?: string | null;
//   bank_name?: string | null;
//   account_number?: string | null;
//   ifsc_code?: string | null;
//   created_at: string;          // already IST formatted by backend
// };

// // --- Sub-Components & Helpers (बाहर रखे गए) ---

// // राशि को INR फॉर्मेट में दिखाना
// const formatAmount = (n: number) =>
//   `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// // Payout Method का Badge दिखाना
// const ProviderBadge = ({ p }: { p: WRow['provider'] }) => {
//   const base = "px-2 py-0.5 rounded-full text-xs font-semibold";
//   switch (p) {
//     case 'bank':    return <span className={`${base} bg-blue-100 text-blue-700`}>Bank</span>;
//     case 'phonepe': return <span className={`${base} bg-violet-100 text-violet-700`}>PhonePe</span>;
//     case 'gpay':    return <span className={`${base} bg-emerald-100 text-emerald-700`}>GPay</span>;
//     case 'paytm':   return <span className={`${base} bg-indigo-100 text-indigo-700`}>Paytm</span>;
//     default:        return <span className={`${base} bg-gray-100 text-gray-700`}>{p}</span>;
//   }
// };

// // Status Badge
// const StatusBadge = ({ status }: { status: string }) => {
//   const s = status.toLowerCase();
//   let color = "bg-gray-100 text-gray-700";
//   if (s === "settled") color = "bg-green-100 text-green-700";
//   if (s === "declined") color = "bg-red-100 text-red-700";
//   if (s === "pending") color = "bg-amber-100 text-amber-700";
//   return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color} capitalize`}>{status}</span>;
// };


// /* ---------------------------- Main Component ---------------------------- */

// const AdminWithdrawalsPage = () => {
//   const [pendingWithdrawals, setPendingWithdrawals] = useState<WRow[]>([]);
//   const [historyWithdrawals, setHistoryWithdrawals] = useState<WRow[]>([]);
//   const [activeTab, setActiveTab] = useState<"pending"|"history">("pending");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string|null>(null);
//   const [token, setToken] = useState<string|null>(null);
//   const router = useRouter();

//   // Token localStorage से लेना
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   // जब token आए तब data fetch करो
//   useEffect(() => {
//     if (token) {
//       fetchWithdrawals();
//     }
//   }, [token]);

//   // Withdrawals API से data लाना
//   const fetchWithdrawals = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch("https://backend.gdmatka.site/admin/withdrawals", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         cache: "no-store",
//       });

//       if (!response.ok) throw new Error("Failed to fetch withdrawals.");

//       const data: WRow[] = await response.json();

//       // Filter: Pending और History अलग-अलग
//       const pending = data.filter(w => (w.withdrawal_status || '').toLowerCase() === "pending");
//       const history = data.filter(w =>
//         (w.withdrawal_status || '').toLowerCase() === "settled" ||
//         (w.withdrawal_status || '').toLowerCase() === "declined"
//       );

//       // Sort by latest created_at
//       const sortLatest = (a: WRow, b: WRow) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      
//       setPendingWithdrawals(pending.sort(sortLatest));
//       setHistoryWithdrawals(history.sort(sortLatest));
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setError("Withdrawals data fetch करने में विफल रहा।");
//       setLoading(false);
//     }
//   };

//   // Withdrawals पर कोई action (settle / decline) लेना
//   const handleAction = async (withdrawalId: number, action: "settle"|"decline") => {
//     const confirmMessage = action === "settle"
//       ? "क्या आप वाकई इस Withdrawal को Settled करना चाहते हैं?"
//       : "क्या आप वाकई इस Withdrawal को Declined करना चाहते हैं?";
      
//     if (!window.confirm(confirmMessage)) return;

//     try {
//       const response = await fetch(
//         "https://backend.gdmatka.site/admin/withdrawals/update",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ withdrawalId, action }),
//         }
//       );

//       if (!response.ok) throw new Error("Failed to update withdrawal.");

//       alert(`Withdrawal सफलतापूर्वक ${action === "settle" ? "Settled" : "Declined"} हो गया।`);
//       fetchWithdrawals(); // data फिर से लाओ
//     } catch (err) {
//       console.error(err);
//       alert("Withdrawal को अपडेट करने में विफल रहा।");
//     }
//   };

//   const handleGoBack = () => {
//     router.back();
//   };

//   // --- Render Functions (Table Row Detail) ---
//   const renderPayoutDetails = (w: WRow) => {
//     if (w.provider === 'bank') {
//       return (
//         <div className="text-xs leading-4">
//           <p className="font-semibold text-gray-800">{w.account_holder_name || '-'}</p>
//           <p className="text-gray-500">{w.bank_name || '-'}</p>
//           <p className="text-gray-500 text-[10px]">{w.account_number || '-'} ({w.ifsc_code || '-'})</p>
//         </div>
//       );
//     }
//     return (
//       <div className="text-xs leading-4">
//         <p className="font-semibold text-gray-800">{String(w.provider).toUpperCase()} Wallet</p>
//         <p className="text-gray-600">{w.wallet_number || <span className="text-red-500">नंबर नहीं मिला</span>}</p>
//       </div>
//     );
//   };
  
//   const renderUserContact = (w: WRow) => {
//     return (
//       <div className="text-xs leading-4">
//         <p className="font-semibold text-gray-800">{w.full_name}</p>
//         <p className="text-gray-600">{w.phone_number}</p>
//         <p className="text-gray-500 text-[10px]">{w.user_email}</p>
//       </div>
//     );
//   };

//   const renderWithdrawalsTable = (withdrawals: WRow[], showActions = true) => {
//     return (
//       <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
//             <tr>
//               <th className="p-3 text-left w-[5%]">ID</th>
//               <th className="p-3 text-left w-[15%]">Date/Time</th>
//               <th className="p-3 text-left w-[10%]">Method</th>
//               <th className="p-3 text-right w-[15%]">Amount</th>
//               <th className="p-3 text-left w-[20%]">User & Contact</th>
//               <th className="p-3 text-left w-[25%]">Payout Details</th>
//               <th className="p-3 text-center w-[10%]">{showActions ? 'Actions' : 'Status'}</th>
//             </tr>
//           </thead>
//           <tbody>
//             {withdrawals.length === 0 ? (
//               <tr>
//                 <td colSpan={7} className="p-10 text-center text-gray-500 text-lg">
//                   <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
//                   {activeTab === "pending" ? 'कोई Pending Withdrawal रिकॉर्ड नहीं है।' : 'History में कोई रिकॉर्ड नहीं मिला।'}
//                 </td>
//               </tr>
//             ) : (
//               withdrawals.map((w, index) => (
//                 <tr key={w.withdrawal_id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50/50 transition duration-150`}>
//                   <td className="p-3 text-center text-gray-500">{w.withdrawal_id}</td>
//                   <td className="p-3 text-left text-xs">
//                     <p className="font-semibold text-gray-800">{w.created_at.split(' ')[0]}</p>
//                     <p className="text-gray-500">{w.created_at.split(' ')[1]}</p>
//                   </td>
//                   <td className="p-3 text-left">
//                     <ProviderBadge p={w.provider} />
//                   </td>
//                   <td className="p-3 text-right text-lg font-bold text-red-600">
//                     {formatAmount(w.withdrawal_amount)}
//                   </td>
//                   <td className="p-3 text-left">
//                     {renderUserContact(w)}
//                   </td>
//                   <td className="p-3 text-left">
//                     {renderPayoutDetails(w)}
//                   </td>

//                   <td className="p-3 text-center">
//                     {showActions ? (
//                       <div className="flex flex-col space-y-2">
//                         <button
//                           className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center justify-center transition"
//                           onClick={() => handleAction(w.withdrawal_id, "settle")}
//                           title="Set as Settled"
//                         >
//                           <Check size={14} className="mr-1" /> Settle
//                         </button>
//                         <button
//                           className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center justify-center transition"
//                           onClick={() => handleAction(w.withdrawal_id, "decline")}
//                           title="Decline Withdrawal"
//                         >
//                           <X size={14} className="mr-1" /> Decline
//                         </button>
//                       </div>
//                     ) : (
//                       <StatusBadge status={w.withdrawal_status || 'Unknown'} />
//                     )}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   // --- Guards ---
//   if (!token) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-8 rounded-xl shadow-2xl text-xl font-semibold text-gray-700">
//           कृपया लॉगिन करें।
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-xl">
//           <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
//           <div className="text-xl font-semibold text-gray-800">डेटा लोड हो रहा है...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-8 rounded-xl shadow-xl text-red-600 text-center font-semibold">
//           Error: {error}
//         </div>
//       </div>
//     );
//   }

//   // --- Main UI ---
//   return (
//     <div className="p-3 md:p-6 bg-slate-50 min-h-screen">
//       <div className="container mx-auto max-w-7xl">
        
//         {/* Header and Controls */}
//         <div className="sticky top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 mb-6 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-100">
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={handleGoBack}
//               className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-600 transition"
//               title="Back"
//             >
//               <ArrowLeft size={20} />
//             </button>
//             <h2 className="text-xl md:text-3xl font-extrabold text-gray-900">
//               Withdrawals Admin Panel
//             </h2>
//           </div>
          
//           <div className="flex items-center space-x-3">
//              {/* Tab Buttons */}
//             <div className="flex space-x-2">
//                 <button
//                     onClick={() => setActiveTab("pending")}
//                     className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "pending" ? "bg-red-500 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
//                 >
//                     <span className='mr-1'>Pending</span> 
//                     <span className="bg-white text-red-500 px-2 rounded-full ml-1 font-bold">{pendingWithdrawals.length}</span>
//                 </button>
//                 <button
//                     onClick={() => setActiveTab("history")}
//                     className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "history" ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
//                 >
//                     History
//                 </button>
//             </div>
            
//             <button
//               onClick={fetchWithdrawals}
//               className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition"
//               title="Refresh"
//             >
//               <RefreshCw size={20} />
//             </button>
//           </div>
//         </div>
        
//         {/* Main Content Area - Table */}
//         <h3 className="text-2xl font-semibold mb-4 text-gray-700">
//             {activeTab === "pending" ? 'Pending Withdrawals (Verification Needed)' : 'Withdrawal History (Settled/Declined)'}
//         </h3>
        
//         {activeTab === "pending"
//           ? renderWithdrawalsTable(pendingWithdrawals, true)
//           : renderWithdrawalsTable(historyWithdrawals, false)
//         }
//       </div>
//     </div>
//   );
// };

// export default AdminWithdrawalsPage;

// "use client";
// import React, { useState, useEffect } from 'react';
// import { RefreshCw, ArrowLeft, Check, X } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// type WRow = {
//   withdrawal_id: number;
//   user_email: string;
//   full_name: string;
//   phone_number: string;
//   withdrawal_amount: number;
//   withdrawal_status: string;   // Pending | Settled | Declined
//   withdrawal_type: string;     // wallet | bank
//   provider: 'bank' | 'phonepe' | 'gpay' | 'paytm';
//   wallet_number?: string | null;
//   account_holder_name?: string | null;
//   bank_name?: string | null;
//   account_number?: string | null;
//   ifsc_code?: string | null;
//   created_at: string;          // already IST formatted by backend
// };

// const AdminWithdrawalsPage = () => {
//   const [pendingWithdrawals, setPendingWithdrawals] = useState<WRow[]>([]);
//   const [historyWithdrawals, setHistoryWithdrawals] = useState<WRow[]>([]);
//   const [activeTab, setActiveTab] = useState<"pending"|"history">("pending");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string|null>(null);
//   const [token, setToken] = useState<string|null>(null);
//   const router = useRouter();

//   // Token localStorage से लेना
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   // जब token आए तब data fetch करो
//   useEffect(() => {
//     if (token) {
//       fetchWithdrawals();
//     }
//   }, [token]);

//   // Helpers
//   const formatAmount = (n: number) =>
//     `₹${Number(n || 0).toLocaleString('en-IN')}`;

//   const maskAccount = (acc?: string | null) => {
//     if (!acc) return '';
//     const s = String(acc);
//     return s.length > 4 ? `****${s.slice(-4)}` : s;
//   };

//   const providerBadge = (p: WRow['provider']) => {
//     const base = "px-2 py-1 rounded-full text-xs font-semibold";
//     switch (p) {
//       case 'bank':    return <span className={`${base} bg-blue-100 text-blue-700`}>Bank</span>;
//       case 'phonepe': return <span className={`${base} bg-violet-100 text-violet-700`}>PhonePe</span>;
//       case 'gpay':    return <span className={`${base} bg-emerald-100 text-emerald-700`}>GPay</span>;
//       case 'paytm':   return <span className={`${base} bg-indigo-100 text-indigo-700`}>Paytm</span>;
//       default:        return <span className={`${base} bg-gray-100 text-gray-700`}>{p}</span>;
//     }
//   };

//   // Withdrawals API से data लाना
//   const fetchWithdrawals = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch("https://backend.gdmatka.site/admin/withdrawals", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to fetch withdrawals.");

//       const data: WRow[] = await response.json();

//       // Filter: Pending और History अलग-अलग
//       const pending = data.filter(w => (w.withdrawal_status || '').toLowerCase() === "pending");
//       const history = data.filter(w =>
//         (w.withdrawal_status || '').toLowerCase() === "settled" ||
//         (w.withdrawal_status || '').toLowerCase() === "declined"
//       );

//       setPendingWithdrawals(pending);
//       setHistoryWithdrawals(history);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to fetch withdrawals.");
//       setLoading(false);
//     }
//   };

//   // Withdrawals पर कोई action (settle / decline) लेना
//   const handleAction = async (withdrawalId: number, action: "settle"|"decline") => {
//     try {
//       const response = await fetch(
//         "https://backend.gdmatka.site/admin/withdrawals/update",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ withdrawalId, action }),
//         }
//       );

//       if (!response.ok) throw new Error("Failed to update withdrawal.");

//       alert(`Withdrawal ${action === "settle" ? "settled" : "declined"} successfully.`);
//       fetchWithdrawals(); // data फिर से लाओ
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update withdrawal.");
//     }
//   };

//   const handleGoBack = () => {
//     router.push('/dashboard');
//   };

//   // अगर Token ना हो तो लॉगिन बोलो
//   if (!token) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-base md:text-xl font-semibold">
//           कृपया लॉगिन करें।
//         </div>
//       </div>
//     );
//   }

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="flex flex-col items-center">
//           <RefreshCw className="animate-spin text-blue-500 mb-4" size={36} />
//           <div className="text-lg md:text-xl font-semibold">लोड हो रहा है...</div>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-red-500 text-center">
//           {error}
//         </div>
//       </div>
//     );
//   }

//   // नए कॉलम्स:
//   // ID | Date/Time | Method | Amount | User | Email | Phone | Payout Details | Action/Status
//   const renderWithdrawals = (withdrawals: WRow[], showActions = true) => {
//     return (
//       <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
//         <table className="w-full text-sm md:text-base">
//           <thead className="bg-gray-100 border-b">
//             <tr>
//               <th className="p-3 text-center">ID</th>
//               <th className="p-3 text-center">Date/Time</th>
//               <th className="p-3 text-center">Method</th>
//               <th className="p-3 text-center">Amount</th>
//               <th className="p-3 text-center">User</th>
//               <th className="p-3 text-center">Email</th>
//               <th className="p-3 text-center">Phone</th>
//               <th className="p-3 text-center">Payout Details</th>
//               {showActions
//                 ? <th className="p-3 text-center">Action</th>
//                 : <th className="p-3 text-center">Status</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {withdrawals.length === 0 ? (
//               <tr>
//                 <td colSpan={9} className="p-6 text-center text-gray-500">
//                   कोई रिकॉर्ड नहीं मिला।
//                 </td>
//               </tr>
//             ) : (
//               withdrawals.map((w) => (
//                 <tr key={w.withdrawal_id} className="border-b hover:bg-gray-50">
//                   <td className="p-3 text-center">{w.withdrawal_id}</td>
//                   <td className="p-3 text-center">{w.created_at}</td>
//                   <td className="p-3 text-center">{providerBadge(w.provider)}</td>
//                   <td className="p-3 text-center text-green-600 font-semibold">{formatAmount(w.withdrawal_amount)}</td>
//                   <td className="p-3 text-center">{w.full_name}</td>
//                   <td className="p-3 text-center">{w.user_email}</td>
//                   <td className="p-3 text-center">{w.phone_number}</td>

//                   <td className="p-3 text-left">
//                     {w.provider === 'bank' ? (
//                       <div className="text-sm leading-5">
//                         <p><b>धारक:</b> {w.account_holder_name || '-'}</p>
//                         <p><b>बैंक:</b> {w.bank_name || '-'}</p>
//                         <p><b>खाता:</b> {w.account_number || '-'}</p>
//                         <p><b>IFSC:</b> {w.ifsc_code || '-'}</p>
//                       </div>
//                     ) : (
//                       <div className="text-sm leading-5">
//                         <p><b>{String(w.provider).toUpperCase()} नंबर:</b> {w.wallet_number || <span className="text-red-500">नहीं मिला</span>}</p>
//                       </div>
//                     )}
//                   </td>

//                   {showActions ? (
//                     <td className="p-3 text-center">
//                       <div className="flex flex-col items-center space-y-2">
//                         <button
//                           className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center"
//                           onClick={() => handleAction(w.withdrawal_id, "settle")}
//                         >
//                           <Check size={16} className="mr-1" /> Settle
//                         </button>
//                         <button
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center"
//                           onClick={() => handleAction(w.withdrawal_id, "decline")}
//                         >
//                           <X size={16} className="mr-1" /> Decline
//                         </button>
//                       </div>
//                     </td>
//                   ) : (
//                     <td className="p-3 text-center capitalize text-sm font-medium text-gray-600">
//                       {w.withdrawal_status}
//                     </td>
//                   )}
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   return (
//     <div className="p-3 md:p-6 bg-gray-100 min-h-screen">
//       <div className="container mx-auto">
//         {/* टॉप हेडर */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={handleGoBack}
//               className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
//               title="Back"
//             >
//               <ArrowLeft size={20} />
//             </button>
//             <h2 className="text-xl md:text-3xl font-bold text-gray-800">
//               Withdrawals Admin Panel
//             </h2>
//           </div>
//           <button
//             onClick={fetchWithdrawals}
//             className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
//             title="Refresh"
//           >
//             <RefreshCw size={20} />
//           </button>
//         </div>

//         {/* टैब बटन */}
//         <div className="flex space-x-2 mb-6">
//           <button
//             onClick={() => setActiveTab("pending")}
//             className={`px-4 py-2 rounded-full ${activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
//           >
//             Pending
//           </button>
//           <button
//             onClick={() => setActiveTab("history")}
//             className={`px-4 py-2 rounded-full ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
//           >
//             History
//           </button>
//         </div>

//         {/* Withdrawal Table */}
//         {activeTab === "pending"
//           ? renderWithdrawals(pendingWithdrawals, true)
//           : renderWithdrawals(historyWithdrawals, false)
//         }
//       </div>
//     </div>
//   );
// };

// export default AdminWithdrawalsPage;




// "use client";
// import React, { useState, useEffect } from 'react';
// import { RefreshCw, ArrowLeft, Check, X } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// const AdminWithdrawalsPage = () => {
//   const [pendingWithdrawals, setPendingWithdrawals] = useState([]); // pending वाले
//   const [historyWithdrawals, setHistoryWithdrawals] = useState([]); // settled या declined वाले
//   const [activeTab, setActiveTab] = useState("pending"); // कौनसा टैब दिखाना है
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [token, setToken] = useState(null);
//   const router = useRouter();

//   // Token localStorage से लेना
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   // जब token आए तब data fetch करो
//   useEffect(() => {
//     if (token) {
//       fetchWithdrawals();
//     }
//   }, [token]);

//   // Withdrawals API से data लाना
//   const fetchWithdrawals = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch("https://backend.gdmatka.site/admin/withdrawals", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to fetch withdrawals.");

//       const data = await response.json();

//       // Filter: Pending और History अलग-अलग
//       const pending = data.filter(w => w.withdrawal_status.toLowerCase() === "pending");
//       const history = data.filter(w =>
//         w.withdrawal_status.toLowerCase() === "settled" ||
//         w.withdrawal_status.toLowerCase() === "declined"
//       );

//       setPendingWithdrawals(pending);
//       setHistoryWithdrawals(history);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to fetch withdrawals.");
//       setLoading(false);
//     }
//   };

//   // Withdrawals पर कोई action (settle / decline) लेना
//   const handleAction = async (withdrawalId, action) => {
//     try {
//       const response = await fetch(
//         "https://backend.gdmatka.site/admin/withdrawals/update",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ withdrawalId, action }),
//         }
//       );

//       if (!response.ok) throw new Error("Failed to update withdrawal.");

//       alert(`Withdrawal ${action === "settle" ? "settled" : "declined"} successfully.`);
//       fetchWithdrawals(); // data फिर से लाओ
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update withdrawal.");
//     }
//   };

//   const handleGoBack = () => {
//     router.push('/dashboard');
//   };

//   // अगर Token ना हो तो लॉगिन बोलो
//   if (!token) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-base md:text-xl font-semibold">
//           कृपया लॉगिन करें।
//         </div>
//       </div>
//     );
//   }

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="flex flex-col items-center">
//           <RefreshCw className="animate-spin text-blue-500 mb-4" size={36} />
//           <div className="text-lg md:text-xl font-semibold">लोड हो रहा है...</div>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-red-500 text-center">
//           {error}
//         </div>
//       </div>
//     );
//   }

//   // कार्ड या टेबल जो withdrawal दिखाता है
//   const renderWithdrawals = (withdrawals, showActions = true) => {
//     return (
//       <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
//         <table className="w-full text-sm md:text-base">
//           <thead className="bg-gray-100 border-b">
//             <tr>
//               <th className="p-3 text-center">ID</th>
//               <th className="p-3 text-center">यूज़र</th>
//               <th className="p-3 text-center">ईमेल</th>
//               <th className="p-3 text-center">फोन</th>
//               <th className="p-3 text-center">राशि</th>
//               <th className="p-3 text-center">बैंक/UPI</th>
//               {showActions && <th className="p-3 text-center">एक्शन</th>}
//               {!showActions && <th className="p-3 text-center">स्थिति</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {withdrawals.length === 0 ? (
//               <tr>
//                 <td colSpan={showActions ? 7 : 7} className="p-6 text-center text-gray-500">
//                   कोई रिकॉर्ड नहीं मिला।
//                 </td>
//               </tr>
//             ) : (
//               withdrawals.map((w) => (
//                 <tr key={w.withdrawal_id} className="border-b hover:bg-gray-50">
//                   <td className="p-3 text-center">{w.withdrawal_id}</td>
//                   <td className="p-3 text-center">{w.full_name}</td>
//                   <td className="p-3 text-center">{w.user_email}</td>
//                   <td className="p-3 text-center">{w.phone_number}</td>
//                   <td className="p-3 text-center text-green-600 font-semibold">₹{w.withdrawal_amount}</td>
//                   <td className="p-3 text-left">
//                     {w.bank_name ? (
//                       <div className="text-sm">
//                         <p><b>धारक:</b> {w.account_holder_name}</p>
//                         <p><b>बैंक:</b> {w.bank_name}</p>
//                         <p><b>खाता:</b> {w.account_number}</p>
//                         <p><b>IFSC:</b> {w.ifsc_code}</p>
//                       </div>
//                     ) : w.upi_id ? (
//                       <p><b>UPI:</b> {w.upi_id}</p>
//                     ) : (
//                       <p className="text-red-500">बैंक/UPI डिटेल नहीं है</p>
//                     )}
//                   </td>
//                   {showActions ? (
//                     <td className="p-3 text-center">
//                       <div className="flex flex-col items-center space-y-2">
//                         <button
//                           className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center"
//                           onClick={() => handleAction(w.withdrawal_id, "settle")}
//                         >
//                           <Check size={16} className="mr-1" /> Settle
//                         </button>
//                         <button
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center"
//                           onClick={() => handleAction(w.withdrawal_id, "decline")}
//                         >
//                           <X size={16} className="mr-1" /> Decline
//                         </button>
//                       </div>
//                     </td>
//                   ) : (
//                     <td className="p-3 text-center capitalize text-sm font-medium text-gray-600">
//                       {w.withdrawal_status}
//                     </td>
//                   )}
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   return (
//     <div className="p-3 md:p-6 bg-gray-100 min-h-screen">
//       <div className="container mx-auto">
//         {/* टॉप हेडर */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={handleGoBack}
//               className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
//               title="Back"
//             >
//               <ArrowLeft size={20} />
//             </button>
//             <h2 className="text-xl md:text-3xl font-bold text-gray-800">
//               Withdrawals Admin Panel
//             </h2>
//           </div>
//           <button
//             onClick={fetchWithdrawals}
//             className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
//             title="Refresh"
//           >
//             <RefreshCw size={20} />
//           </button>
//         </div>

//         {/* टैब बटन */}
//         <div className="flex space-x-2 mb-6">
//           <button
//             onClick={() => setActiveTab("pending")}
//             className={`px-4 py-2 rounded-full ${activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
//           >
//             Pending
//           </button>
//           <button
//             onClick={() => setActiveTab("history")}
//             className={`px-4 py-2 rounded-full ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
//           >
//             History
//           </button>
//         </div>

//         {/* Withdrawal Table */}
//         {activeTab === "pending"
//           ? renderWithdrawals(pendingWithdrawals, true)
//           : renderWithdrawals(historyWithdrawals, false)
//         }
//       </div>
//     </div>
//   );
// };

// export default AdminWithdrawalsPage;



// "use client";
// import React, { useState, useEffect } from 'react';
// import { RefreshCw, ArrowLeft, Check, X } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// const AdminWithdrawalsPage = () => {
//   const [withdrawals, setWithdrawals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [token, setToken] = useState(null);

//   const router = useRouter();

//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   useEffect(() => {
//     if (token) {
//       fetchWithdrawals();
//     }
//   }, [token]);

//   const fetchWithdrawals = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch("https://backend.gdmatka.site/admin/withdrawals", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to fetch withdrawals.");

//       const data = await response.json();
//       console.log(data);

//       // Ensure case-insensitive matching for status
//       const pendingWithdrawals = data.filter(
//         (withdrawal) => withdrawal.withdrawal_status.toLowerCase() === "pending"
//       );
//       setWithdrawals(pendingWithdrawals);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to fetch withdrawals.");
//       setLoading(false);
//     }
//   };

//   const handleAction = async (withdrawalId, action) => {
//     try {
//       const response = await fetch(
//         "https://backend.gdmatka.site/admin/withdrawals/update",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ withdrawalId, action }),
//         }
//       );

//       if (!response.ok) throw new Error("Failed to update withdrawal.");

//       alert(
//         `Withdrawal ${action === "settle" ? "settled" : "declined"
//         } successfully.`
//       );
//       fetchWithdrawals();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update withdrawal.");
//     }
//   };

//   const handleGoBack = () => {
//     router.push('/dashboard');
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
//         <div className="text-lg md:text-xl font-semibold">Loading Withdrawals...</div>
//       </div>
//     </div>
//   );

//   if (error) return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-4 md:p-8 rounded-lg shadow-md text-red-500 text-center">
//         {error}
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-3 md:p-6 bg-gray-100 min-h-screen">
//       <div className="container mx-auto">
//         <div className="flex items-center justify-between mb-4 md:mb-6">
//           <div className="flex items-center space-x-2 md:space-x-4">
//             <button
//               onClick={handleGoBack}
//               className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
//               title="Go Back"
//             >
//               <ArrowLeft className="text-gray-700" size={20} />
//             </button>
//             <h2 className="text-xl md:text-3xl font-bold text-gray-800">Pending Withdrawals</h2>
//           </div>
//           <button 
//             onClick={fetchWithdrawals} 
//             className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
//             title="Refresh"
//           >
//             <RefreshCw size={20} />
//           </button>
//         </div>

//         {/* Mobile card view for small screens */}
//         <div className="block md:hidden">
//           {withdrawals.length === 0 ? (
//             <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
//               No pending withdrawals at the moment.
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {withdrawals.map((withdrawal) => (
//                 <div key={withdrawal.withdrawal_id} className="bg-white rounded-lg shadow-lg p-4">
//                   <div className="mb-4">
//                     <div className="font-semibold text-gray-600">Withdrawal ID</div>
//                     <div>{withdrawal.withdrawal_id}</div>
//                   </div>
                  
//                   <div className="mb-4">
//                     <div className="font-semibold text-gray-600">User Details</div>
//                     <div>{withdrawal.full_name}</div>
//                     <div>{withdrawal.user_email}</div>
//                     <div>{withdrawal.phone_number}</div>
//                   </div>
                  
//                   <div className="mb-4">
//                     <div className="font-semibold text-gray-600">Amount</div>
//                     <div className="font-semibold text-green-600">₹{withdrawal.withdrawal_amount}</div>
//                   </div>
                  
//                   <div className="mb-4">
//                     <div className="font-semibold text-gray-600">Bank/UPI Details</div>
//                     {withdrawal.bank_name && withdrawal.account_number ? (
//                       <div className="text-sm">
//                         <p><span className="font-semibold">Account Holder:</span> {withdrawal.account_holder_name}</p>
//                         <p><span className="font-semibold">Bank:</span> {withdrawal.bank_name}</p>
//                         <p><span className="font-semibold">Account Number:</span> {withdrawal.account_number}</p>
//                         <p><span className="font-semibold">IFSC:</span> {withdrawal.ifsc_code}</p>
//                       </div>
//                     ) : withdrawal.upi_id ? (
//                       <p><span className="font-semibold">UPI:</span> {withdrawal.upi_id}</p>
//                     ) : (
//                       <p className="text-red-500">No Bank/UPI Details Provided</p>
//                     )}
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-2">
//                     <button
//                       className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
//                       onClick={() => handleAction(withdrawal.withdrawal_id, "settle")}
//                     >
//                       <Check size={16} />
//                       <span>Settle</span>
//                     </button>
//                     <button
//                       className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
//                       onClick={() => handleAction(withdrawal.withdrawal_id, "decline")}
//                     >
//                       <X size={16} />
//                       <span>Decline</span>
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Desktop table view for larger screens */}
//         <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50 border-b">
//                 <tr>
//                   {['Withdrawal ID', 'User Name', 'Email', 'Phone Number', 'Withdrawal Amount', 'Bank Details / UPI', 'Action'].map((header) => (
//                     <th key={header} className="p-4 text-left text-gray-600 font-semibold text-center">{header}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {withdrawals.map((withdrawal) => (
//                   <tr
//                     key={withdrawal.withdrawal_id}
//                     className="border-b hover:bg-gray-50 transition-colors"
//                   >
//                     <td className="p-4 text-center">{withdrawal.withdrawal_id}</td>
//                     <td className="p-4 text-center">{withdrawal.full_name}</td>
//                     <td className="p-4 text-center">{withdrawal.user_email}</td>
//                     <td className="p-4 text-center">{withdrawal.phone_number}</td>
//                     <td className="p-4 text-center font-semibold text-green-600">₹{withdrawal.withdrawal_amount}</td>
//                     <td className="p-4">
//                       {withdrawal.bank_name && withdrawal.account_number ? (
//                         <div className="text-sm">
//                           <p><span className="font-semibold">Account Holder:</span> {withdrawal.account_holder_name}</p>
//                           <p><span className="font-semibold">Bank:</span> {withdrawal.bank_name}</p>
//                           <p><span className="font-semibold">Account Number:</span> {withdrawal.account_number}</p>
//                           <p><span className="font-semibold">IFSC:</span> {withdrawal.ifsc_code}</p>
//                         </div>
//                       ) : withdrawal.upi_id ? (
//                         <p className="text-center"><span className="font-semibold">UPI:</span> {withdrawal.upi_id}</p>
//                       ) : (
//                         <p className="text-red-500 text-center">No Bank/UPI Details Provided</p>
//                       )}
//                     </td>
//                     <td className="p-4 text-center">
//                       <div className="flex flex-col space-y-2">
//                         <button
//                           className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 mx-auto"
//                           onClick={() => handleAction(withdrawal.withdrawal_id, "settle")}
//                         >
//                           <Check size={16} />
//                           <span>Settle</span>
//                         </button>
//                         <button
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 mx-auto"
//                           onClick={() => handleAction(withdrawal.withdrawal_id, "decline")}
//                         >
//                           <X size={16} />
//                           <span>Decline</span>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           {withdrawals.length === 0 && (
//             <div className="text-center p-8 text-gray-500">
//               No pending withdrawals at the moment.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminWithdrawalsPage;