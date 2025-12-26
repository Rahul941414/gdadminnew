"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronLeft as LeftIcon,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Market {
  market_name: string;
  market_id: number;
}

interface Bet {
  id: number;
  email: string;
  phone_number: string;
  full_name: string;
  user_id: number;
  game_name: string;
  market_name: string;
  bet_type: string;
  first_number: string;
  second_number: string;
  bet_date: string;
  created_at: string;
  status: "won" | "pending" | "lost";
  points: number;
  amount_won: number;
}

function EditBetModal({
  bet,
  token,
  onClose,
  onSave,
}: {
  bet: Bet;
  token: string;
  onClose: () => void;
  onSave: (updatedBet: Bet) => void;
}) {
  const [currentBet, setCurrentBet] = useState(bet);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://backend.gdmatka.site/api/bets/${bet.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_number: currentBet.first_number,
            second_number: currentBet.second_number,
            points: currentBet.points,
          }),
        }
      );
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Edit Bet ID #{bet.id}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              First Number
            </label>
            <input
              type="text"
              value={currentBet.first_number}
              onChange={(e) =>
                setCurrentBet({
                  ...currentBet,
                  first_number: e.target.value,
                })
              }
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          {bet.second_number && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Second Number
              </label>
              <input
                type="text"
                value={currentBet.second_number}
                onChange={(e) =>
                  setCurrentBet({
                    ...currentBet,
                    second_number: e.target.value,
                  })
                }
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Points</label>
            <input
              type="number"
              value={currentBet.points}
              onChange={(e) =>
                setCurrentBet({ ...currentBet, points: Number(e.target.value) })
              }
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BetsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [marketName, setMarketName] = useState("all");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const betsPerPage = 500;

  const fetchBets = useCallback(async () => {
    if (!date || !token) return;
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams({ date });
      if (marketName && marketName !== "all") {
        queryParams.append("market_name", marketName);
      }
      const response = await fetch(
        `https://backend.gdmatka.site/api/bet?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setBets(data);
        setCurrentPage(1);
      } else {
        setError(data.error || "Failed to fetch bets.");
        setBets([]);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, [date, token, marketName]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/admin/login");
      return;
    }
    setToken(storedToken);
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, [router]);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!token) return;
      try {
        const response = await fetch(
          "https://backend.gdmatka.site/api/market",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Failed to fetch markets");
        setMarkets(await response.json());
      } catch (error) {
        console.error("Error fetching markets:", error);
      }
    };

    if (token) {
      fetchMarkets();
      fetchBets();
    }
  }, [token, fetchBets]);

  // Pagination logic
  const indexOfLastBet = currentPage * betsPerPage;
  const indexOfFirstBet = indexOfLastBet - betsPerPage;
  const currentBets = bets.slice(indexOfFirstBet, indexOfLastBet);
  const totalPages = Math.ceil(bets.length / betsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleDeleteBet = async (betId: number) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete Bet ID #${betId}? This will adjust the user's wallet.`
      )
    )
      return;
    setDeletingId(betId);
    try {
      const response = await fetch(
        `https://backend.gdmatka.site/api/bets/${betId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete bet.");
      }
      setBets((currentBets) => currentBets.filter((b) => b.id !== betId));
      alert(`Bet ID #${betId} deleted successfully.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = (updatedBet: Bet) => {
    setBets((currentBets) =>
      currentBets.map((b) => (b.id === updatedBet.id ? updatedBet : b))
    );
    setEditingBet(null);
    alert(`Bet ID #${updatedBet.id} updated successfully.`);
  };

  const handleGoBack = () => router.push("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {editingBet && token && (
        <EditBetModal
          bet={editingBet}
          token={token}
          onClose={() => setEditingBet(null)}
          onSave={handleSaveEdit}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-2 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Bet History</h1>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              id="market"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              className="w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Markets</option>
              {markets.map((market) => (
                <option key={market.market_id} value={market.market_name}>
                  {market.market_name}
                </option>
              ))}
            </select>
            <Button onClick={fetchBets} disabled={loading} className="w-auto">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
            <Button
              onClick={fetchBets}
              disabled={loading}
              variant="outline"
              size="icon"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <Card className="shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "ID",
                    "User",
                    "Game",
                    "Market",
                    "Type",
                    "First No.",
                    "Second No.",
                    "Time",
                    "Status",
                    "Points",
                    "Won",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="text-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    </td>
                  </tr>
                ) : currentBets.length > 0 ? (
                  currentBets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{bet.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link
                          href={`/user-management/${bet.user_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {bet.full_name || bet.email}
                        </Link>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bet.game_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bet.market_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bet.bet_type || "N/A"}
                      </td>
                      <td className="px-4 py-2 font-mono whitespace-nowrap">
                        {bet.first_number}
                      </td>
                      <td className="px-4 py-2 font-mono whitespace-nowrap">
                        {bet.second_number || "N/A"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {new Date(bet.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bet.status === "won"
                              ? "bg-green-100 text-green-800"
                              : bet.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bet.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bet.points}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bet.amount_won}
                      </td>
                      <td className="px-4 py-2 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingBet(bet)}
                          disabled={bet.status !== "pending"}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                          title="Edit Bet"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBet(bet.id)}
                          disabled={deletingId === bet.id}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Bet"
                        >
                          {deletingId === bet.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="text-center p-8 text-gray-500"
                    >
                      No bets found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {bets.length > betsPerPage && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <LeftIcon className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}



// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { ChevronLeft, Search, RefreshCw, Loader2, Trash2, Pencil } from "lucide-react";
// import Link from "next/link";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// // --- Types for API Data ---
// interface Market {
//     market_name: string;
//     market_id: number;
// }

// interface Bet {
//     id: number;
//     email: string;
//     phone_number: string;
//     full_name: string;
//     user_id: number;
//     game_name: string;
//     market_name: string;
//     bet_type: string;
//     first_number: string;
//     second_number: string;
//     bet_date: string;
//     created_at: string;
//     status: 'won' | 'pending' | 'lost';
//     points: number;
//     amount_won: number;
// }

// // --- Edit Modal Component ---
// function EditBetModal({ bet, token, onClose, onSave }: { bet: Bet, token: string, onClose: () => void, onSave: (updatedBet: Bet) => void }) {
//     const [currentBet, setCurrentBet] = useState(bet);
//     const [isSaving, setIsSaving] = useState(false);

//     const handleSave = async () => {
//         setIsSaving(true);
//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/bets/${bet.id}`, {
//                 method: 'PUT',
//                 headers: { 
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${token}` 
//                 },
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

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
//                 <h2 className="text-lg font-bold mb-4">Edit Bet ID #{bet.id}</h2>
//                 <div className="space-y-4">
//                     <div>
//                         <label className="text-sm font-medium text-gray-700">First Number</label>
//                         <input
//                             type="text"
//                             value={currentBet.first_number}
//                             onChange={(e) => setCurrentBet({ ...currentBet, first_number: e.target.value })}
//                             className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
//                         />
//                     </div>
//                     {bet.second_number && (
//                         <div>
//                             <label className="text-sm font-medium text-gray-700">Second Number</label>
//                             <input
//                                 type="text"
//                                 value={currentBet.second_number}
//                                 onChange={(e) => setCurrentBet({ ...currentBet, second_number: e.target.value })}
//                                 className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
//                             />
//                         </div>
//                     )}
//                     <div>
//                         <label className="text-sm font-medium text-gray-700">Points</label>
//                         <input
//                             type="number"
//                             value={currentBet.points}
//                             onChange={(e) => setCurrentBet({ ...currentBet, points: Number(e.target.value) })}
//                             className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
//                         />
//                     </div>
//                 </div>
//                 <div className="mt-6 flex justify-end space-x-2">
//                     <Button variant="ghost" onClick={onClose}>Cancel</Button>
//                     <Button onClick={handleSave} disabled={isSaving}>
//                         {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
//                         Save Changes
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }


// export default function BetsPage() {
//     const router = useRouter();
//     const [token, setToken] = useState<string | null>(null);
//     const [date, setDate] = useState("");
//     const [marketName, setMarketName] = useState("all");
//     const [markets, setMarkets] = useState<Market[]>([]);
//     const [bets, setBets] = useState<Bet[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
    
//     const [deletingId, setDeletingId] = useState<number | null>(null);
//     const [editingBet, setEditingBet] = useState<Bet | null>(null);

//     const fetchBets = useCallback(async () => {
//         if (!date || !token) return;
//         setLoading(true);
//         setError("");
//         try {
//             const queryParams = new URLSearchParams({ date });
//             if (marketName && marketName !== "all") {
//                 queryParams.append("market_name", marketName);
//             }
//             const response = await fetch(`https://backend.gdmatka.site/api/bet?${queryParams.toString()}`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             const data = await response.json();
//             if (response.ok) {
//                 setBets(data);
//             } else {
//                 setError(data.error || "Failed to fetch bets.");
//                 setBets([]);
//             }
//         } catch (err) {
//             setError("Network error. Please try again.");
//             setBets([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [date, token, marketName]);

//     useEffect(() => {
//         const storedToken = localStorage.getItem("token");
//         if (!storedToken) {
//             router.push("/admin/login");
//             return;
//         }
//         setToken(storedToken);
//         const today = new Date().toISOString().split("T")[0];
//         setDate(today);
//     }, [router]);

//     useEffect(() => {
//         const fetchMarkets = async () => {
//             if (!token) return;
//             try {
//                 const response = await fetch("https://backend.gdmatka.site/api/market", { headers: { Authorization: `Bearer ${token}` } });
//                 if (!response.ok) throw new Error("Failed to fetch markets");
//                 setMarkets(await response.json());
//             } catch (error) { console.error("Error fetching markets:", error); }
//         };

//         if (token) {
//             fetchMarkets();
//             fetchBets();
//         }
//     }, [token, fetchBets]);

//     const handleDeleteBet = async (betId: number) => {
//         if (!window.confirm(`Are you sure you want to permanently delete Bet ID #${betId}? This will adjust the user's wallet.`)) return;
//         setDeletingId(betId);
//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/bets/${betId}`, {
//                 method: 'DELETE',
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             if (!response.ok) {
//                 const errData = await response.json();
//                 throw new Error(errData.error || "Failed to delete bet.");
//             }
//             setBets(currentBets => currentBets.filter(bet => bet.id !== betId));
//             alert(`Bet ID #${betId} deleted successfully.`);
//         } catch (err: any) {
//             alert(`Error: ${err.message}`);
//         } finally {
//             setDeletingId(null);
//         }
//     };

//     const handleSaveEdit = (updatedBet: Bet) => {
//         setBets(currentBets => currentBets.map(b => b.id === updatedBet.id ? updatedBet : b));
//         setEditingBet(null);
//         alert(`Bet ID #${updatedBet.id} updated successfully.`);
//     };

//     const handleGoBack = () => router.push("/dashboard");

//     return (
//         <div className="min-h-screen bg-gray-50 p-6">
//             {editingBet && token && (
//                 <EditBetModal 
//                     bet={editingBet} 
//                     token={token}
//                     onClose={() => setEditingBet(null)} 
//                     onSave={handleSaveEdit}
//                 />
//             )}
//             <div className="max-w-7xl mx-auto">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
//                     <div className="flex items-center mb-4 sm:mb-0">
//                         <Button variant="ghost" size="sm" onClick={handleGoBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-2 transition-colors"><ChevronLeft className="h-4 w-4 mr-2" /> Back</Button>
//                         <h1 className="text-2xl font-bold text-gray-800">Bet History</h1>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                         <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
//                         <select id="market" value={marketName} onChange={(e) => setMarketName(e.target.value)} className="w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
//                             <option value="all">All Markets</option>
//                             {markets.map((market) => (<option key={market.market_id} value={market.market_name}>{market.market_name}</option>))}
//                         </select>
//                         <Button onClick={fetchBets} disabled={loading} className="w-auto">
//                             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
//                         </Button>
//                         <Button onClick={fetchBets} disabled={loading} variant="outline" size="icon" title="Refresh"><RefreshCw className="h-4 w-4" /></Button>
//                     </div>
//                 </div>

//                 {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>}

//                 <Card className="shadow-md rounded-lg overflow-hidden">
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full text-sm divide-y divide-gray-200">
//                             <thead className="bg-gray-100">
//                                 <tr>
//                                     {/* --- बदला हुआ हिस्सा (हेडर): "Bet Date" हटा दिया गया है --- */}
//                                     {["ID", "User", "Phone", "Game", "Market", "Type", "First No.", "Second No.", "Time", "Status", "Points", "Won", "Actions"].map((h) => (
//                                         <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-gray-200">
//                                 {loading ? (
//                                     <tr><td colSpan={13} className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></td></tr>
//                                 ) : bets.length > 0 ? (
//                                     bets.map((bet) => (
//                                         <tr key={bet.id} className="hover:bg-gray-50">
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.id}</td>
//                                             <td className="px-4 py-2 whitespace-nowrap"><Link href={`/user-management/${bet.user_id}`} className="text-blue-600 hover:underline">{bet.full_name || bet.email}</Link></td>
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.phone_number}</td>
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.game_name}</td>
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.market_name}</td>
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.bet_type || "N/A"}</td>
//                                             <td className="px-4 py-2 font-mono whitespace-nowrap">{bet.first_number}</td>
//                                             <td className="px-4 py-2 font-mono whitespace-nowrap">{bet.second_number || "N/A"}</td>
                                            
//                                             {/* --- बदला हुआ हिस्सा (बॉडी): bet_date वाला td हटा दिया गया है --- */}
//                                             <td className="px-4 py-2 whitespace-nowrap">{new Date(bet.created_at).toLocaleString()}</td>
                                            
//                                             <td className="px-4 py-2 whitespace-nowrap">
//                                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${bet.status === 'won' ? 'bg-green-100 text-green-800' : bet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
//                                                     {bet.status}
//                                                 </span>
//                                             </td>
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.points}</td>
//                                             <td className="px-4 py-2 whitespace-nowrap">{bet.amount_won}</td>
//                                             <td className="px-4 py-2 flex items-center gap-1">
//                                                 <Button variant="ghost" size="icon" onClick={() => setEditingBet(bet)} disabled={bet.status !== 'pending'} className="text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed" title="Edit Bet">
//                                                     <Pencil className="h-4 w-4" />
//                                                 </Button>
//                                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteBet(bet.id)} disabled={deletingId === bet.id} className="text-red-600 hover:text-red-800" title="Delete Bet">
//                                                     {deletingId === bet.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
//                                                 </Button>
//                                             </td>
//                                         </tr>
//                                     ))
//                                 ) : (
//                                     <tr><td colSpan={13} className="text-center p-8 text-gray-500">No bets found for the selected filters.</td></tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </Card>
//             </div>
//         </div>
//     );
// }



// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { ChevronLeft, Search, RefreshCw, Loader2 } from "lucide-react";
// import Link from "next/link";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// // --- Types for API Data ---
// interface Market {
//   market_name: string;
//   market_id: number;
// }

// interface Bet {
//   id: number;
//   email: string;
//   phone_number: string;
//   full_name: string;
//   user_id: number;
//   game_name: string;
//   market_name: string;
//   bet_type: string;
//   first_number: string;
//   second_number: string;
//   bet_date: string;
//   created_at: string; // ISO timestamp format
//   status: 'won' | 'pending' | 'lost';
//   points: number;
//   amount_won: number;
// }

// export default function BetsPage() {
//   const router = useRouter();
//   const [token, setToken] = useState<string | null>(null);
//   const [date, setDate] = useState("");
//   const [marketName, setMarketName] = useState("all");
//   const [markets, setMarkets] = useState<Market[]>([]);
//   const [bets, setBets] = useState<Bet[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Set token and today's date on load
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     if (!storedToken) {
//       router.push("/admin/login");
//       return;
//     }
//     setToken(storedToken);
//     const today = new Date().toISOString().split("T")[0];
//     setDate(today);
//   }, [router]);

//   // Fetch markets and bets on token change and initial load
//   useEffect(() => {
//     if (token) {
//       fetchMarkets();
//       fetchBets();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token]);

//   const fetchMarkets = async () => {
//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/market", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error("Failed to fetch markets");
//       const data = await response.json();
//       setMarkets(data);
//     } catch (error) {
//       console.error("Error fetching markets:", error);
//       setMarkets([]);
//     }
//   };

//   const fetchBets = async () => {
//     if (!date) {
//       setError("Please select a date.");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const queryParams = new URLSearchParams();
//       queryParams.append("date", date);

//       if (marketName && marketName !== "all") {
//         queryParams.append("market_name", marketName);
//       }

//       const response = await fetch(
//         `https://backend.gdmatka.site/api/bet?${queryParams.toString()}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         setBets(data);
//       } else {
//         setError(data.error || "Failed to fetch bets.");
//       }
//     } catch (error) {
//       setError("Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoBack = () => {
//     router.push("/dashboard");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header and Controls */}
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
//           <div className="flex items-center mb-4 sm:mb-0">
//             <Button variant="ghost" size="sm" onClick={handleGoBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-2 transition-colors">
//               <ChevronLeft className="h-4 w-4 mr-2" /> Back to Dashboard
//             </Button>
//             <h1 className="text-2xl font-bold text-gray-800">Bet History</h1>
//           </div>
//           <div className="flex items-center space-x-2">
//             <input
//               id="date"
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <select
//               id="market"
//               value={marketName}
//               onChange={(e) => setMarketName(e.target.value)}
//               className="w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Markets</option>
//               {markets.map((market) => (
//                 <option key={market.market_id} value={market.market_name}>
//                   {market.market_name}
//                 </option>
//               ))}
//             </select>
//             <Button onClick={fetchBets} disabled={loading} className="w-auto">
//               {loading ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 <Search className="mr-2 h-4 w-4" />
//               )}
//               Search
//             </Button>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
//             {error}
//           </div>
//         )}

//         {/* Bets Table */}
//         {bets.length > 0 ? (
//           <Card className="shadow-md rounded-lg overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-sm divide-y divide-gray-200">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     {[
//                       "ID", "User", "Phone", "Game", "Market",
//                       "Bet Type", "First Number", "Second Number",
//                       "Bet Date", "Created At", "Status", "Points", "Amount Won"
//                     ].map((header) => (
//                       <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         {header}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {bets.map((bet) => (
//                     <tr key={bet.id} className="hover:bg-gray-50">
//                       <td className="px-4 py-2">{bet.id}</td>
//                       <td className="px-4 py-2">
//                         {/* Make User name clickable */}
//                         <Link href={`/user-management/${bet.user_id}`} className="text-blue-600 hover:underline cursor-pointer">
//                           {bet.full_name || bet.email}
//                         </Link>
//                       </td>
//                       <td className="px-4 py-2">{bet.phone_number}</td>
//                       <td className="px-4 py-2">{bet.game_name}</td>
//                       <td className="px-4 py-2">{bet.market_name}</td>
//                       <td className="px-4 py-2">{bet.bet_type || "N/A"}</td>
//                       <td className="px-4 py-2">{bet.first_number}</td>
//                       <td className="px-4 py-2">{bet.second_number || "N/A"}</td>
//                       <td className="px-4 py-2">{bet.bet_date}</td>
//                       <td className="px-4 py-2">{new Date(bet.created_at).toLocaleString()}</td>
//                       <td className="px-4 py-2">
//                         <span
//                           className={`px-2 py-1 rounded-full text-xs font-medium ${
//                             bet.status === 'won' ? 'bg-green-100 text-green-800' :
//                             bet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
//                             'bg-red-100 text-red-800'
//                           }`}
//                         >
//                           {bet.status}
//                         </span>
//                       </td>
//                       <td className="px-4 py-2">{bet.points}</td>
//                       <td className="px-4 py-2">{bet.amount_won}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         ) : (
//           !loading && (
//             <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
//               No bets found. Please try different filters.
//             </div>
//           )
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { ChevronLeft, Search, RefreshCw } from "lucide-react";

// export default function BetsPage() {
//   const router = useRouter();
//   const [token, setToken] = useState<string | null>(null);
//   const [date, setDate] = useState("");
//   const [marketName, setMarketName] = useState("");
//   const [markets, setMarkets] = useState<string[]>([]);
//   const [bets, setBets] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Set token and today's date on load
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     if (!storedToken) {
//       router.push("/");
//       return;
//     }
//     setToken(storedToken);
//     const today = new Date().toISOString().split("T")[0];
//     setDate(today);
//   }, [router]);

//   useEffect(() => {
//     if (token) fetchMarkets();
//   }, [token]);

//   const fetchMarkets = async () => {
//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/market", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error("Failed to fetch markets");
//       const data = await response.json();
//       const marketNames = data.map(
//         (market: { market_name?: string; name?: string }) =>
//           market.market_name || market.name || "Unknown Market"
//       );
//       setMarkets(marketNames);
//     } catch (error) {
//       console.error("Error fetching markets:", error);
//       setMarkets([]);
//     }
//   };

//   const fetchBets = async () => {
//     if (!date) {
//       setError("Please select a date.");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const queryParams = new URLSearchParams();
//       queryParams.append("date", date);

//       // ✅ Only send market_name if it's not "all"
//       if (marketName && marketName !== "all") {
//         queryParams.append("market_name", marketName);
//       }

//       const response = await fetch(
//         `https://backend.gdmatka.site/api/bet?${queryParams.toString()}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         setBets(data);
//       } else {
//         setError(data.error || "Failed to fetch bets.");
//       }
//     } catch (error) {
//       setError("Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoBack = () => {
//     router.push("/dashboard");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center mb-6">
//           <button
//             onClick={handleGoBack}
//             className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
//           >
//             <ChevronLeft className="mr-2" /> Back to Dashboard
//           </button>
//           <h1 className="text-3xl font-semibold text-gray-800">Bet History</h1>
//         </div>

//         {/* Filters */}
//         <div className="bg-white shadow-md rounded-lg p-6 mb-6">
//           <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-4">
//             {/* Date */}
//             <div className="flex-grow">
//               <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
//                 Date
//               </label>
//               <input
//                 id="date"
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             {/* Market Dropdown */}
//             <div className="flex-grow">
//               <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-1">
//                 Market
//               </label>
//               <select
//                 id="market"
//                 value={marketName}
//                 onChange={(e) => setMarketName(e.target.value)}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Market</option>
//                 <option value="all">All Markets</option>
//                 {markets.map((market, index) => (
//                   <option key={index} value={market}>
//                     {market}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Search Button */}
//             <div className="flex items-end">
//               <button
//                 onClick={fetchBets}
//                 disabled={loading}
//                 className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
//               >
//                 {loading ? (
//                   <RefreshCw className="mr-2 animate-spin" size={16} />
//                 ) : (
//                   <Search className="mr-2" size={16} />
//                 )}
//                 Search
//               </button>
//             </div>
//           </div>

//           {/* Error */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
//               {error}
//             </div>
//           )}
//         </div>

//         {/* Bets Table */}
//         {bets.length > 0 ? (
//           <div className="bg-white shadow-md rounded-lg overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100 border-b text-xs uppercase text-gray-600">
//                 <tr>
//                   {[
//                     "ID", "Email", "Phone", "Game", "Market",
//                     "Bet Type", "First Number", "Second Number",
//                     "Bet Date", "Created At", "Status", "Points", "Amount Won"
//                   ].map((header) => (
//                     <th key={header} className="px-4 py-2 text-left whitespace-nowrap">
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {bets.map((bet) => (
//                   <tr key={bet.id} className="hover:bg-gray-50">
//                     <td className="px-4 py-2">{bet.id}</td>
//                     <td className="px-4 py-2">{bet.email}</td>
//                     <td className="px-4 py-2">{bet.phone_number}</td>
//                     <td className="px-4 py-2">{bet.game_name}</td>
//                     <td className="px-4 py-2">{bet.market_name}</td>
//                     <td className="px-4 py-2">{bet.bet_type || "N/A"}</td>
//                     <td className="px-4 py-2">{bet.first_number}</td>
//                     <td className="px-4 py-2">{bet.second_number || "N/A"}</td>
//                     <td className="px-4 py-2">{bet.bet_date}</td>
//                     <td className="px-4 py-2">{new Date(bet.created_at).toLocaleString()}</td>
//                     <td className="px-4 py-2">
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-medium ${bet.status === 'won'
//                           ? 'bg-green-100 text-green-800'
//                           : bet.status === 'pending'
//                             ? 'bg-yellow-100 text-yellow-800'
//                             : 'bg-red-100 text-red-800'
//                           }`}
//                       >
//                         {bet.status}
//                       </span>
//                     </td>
//                     <td className="px-4 py-2">{bet.points}</td>
//                     <td className="px-4 py-2">{bet.amount_won}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           !loading && (
//             <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
//               No bets found. Please try different filters.
//             </div>
//           )
//         )}
//       </div>
//     </div>
//   );
// }

 