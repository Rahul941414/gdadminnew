'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Trash2, Loader2 } from 'lucide-react';

// ==============================================================================
//  Helper function to convert time string to minutes
// ==============================================================================
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return Infinity;
  try {
    const upperTimeStr = timeStr.toUpperCase();
    const parts = upperTimeStr.split(' ');
    const timePart = parts[0];
    const modifier = parts.length > 1 ? parts[1] : null;
    let [hours, minutes] = timePart.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return Infinity;
    if (modifier) {
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  } catch (e) {
    console.error(`Error converting time string: "${timeStr}"`, e);
    return Infinity;
  }
};

const DeclareResultForm = () => {
  const router = useRouter();
  const [markets, setMarkets] = useState<any[]>([]);
  const [declaredResults, setDeclaredResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedSession, setSelectedSession] = useState('Open');
  const [selectedPana, setSelectedPana] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [token, setToken] = useState('');
  const [potentialWinners, setPotentialWinners] = useState<any[]>([]);
  const [showWinners, setShowWinners] = useState(false);
  const [isLoadingWinners, setIsLoadingWinners] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
  const [gameSearchTerm, setGameSearchTerm] = useState('');

  const getDigitFromPana = (pana: string) => {
    if (!pana || pana.length !== 3 || isNaN(Number(pana))) return '';
    const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    return String(sum % 10);
  };

  const derivedDigit = useMemo(() => getDigitFromPana(selectedPana), [selectedPana]);

  const calculateJodi = useCallback((openPana: string, closePana: string) => {
    if (!openPana || !closePana) return 'N/A';
    const openDigit = getDigitFromPana(openPana);
    const closeDigit = getDigitFromPana(closePana);
    if (openDigit === '' || closeDigit === '') return 'N/A';
    return `${openDigit}${closeDigit}`;
  }, []);

  const fetchInitialData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const [marketResponse, marketDataResponse] = await Promise.all([
        fetch('https://backend.gdmatka.site/api/market', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`https://backend.gdmatka.site/api/marketdata?date=${date}`, { headers: { Authorization: `Bearer ${authToken}` } })
      ]);

      if (marketResponse.status === 401 || marketDataResponse.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const marketData = await marketResponse.json();
      const activeMarkets = marketData.filter((market: any) => market.active_status === 'Active');
      const sortedMarkets = activeMarkets.sort((a: any, b: any) => timeToMinutes(a.market_open_time) - timeToMinutes(b.market_open_time));
      setMarkets(sortedMarkets);

      const declaredData = await marketDataResponse.json();
      const results = declaredData.filter((market: any) => market.result_open_pana || market.result_closed_pana);
      const sortedResults = results.sort((a: any, b: any) => timeToMinutes(a.market_open_time) - timeToMinutes(b.market_open_time));
      setDeclaredResults(sortedResults);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [date, router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchInitialData(storedToken);
    } else {
      router.push('/login');
    }
  }, [date, fetchInitialData, router]);

  const availableMarkets = useMemo(() => {
    const lowerSearch = gameSearchTerm.toLowerCase();
    const declaredMarketIds = new Set(
      declaredResults
        .filter(r => r.result_open_pana && r.result_closed_pana)
        .map(r => r.market_id)
    );
    return markets.filter(market =>
      !declaredMarketIds.has(market.market_id) &&
      market.market_name.toLowerCase().includes(lowerSearch)
    );
  }, [gameSearchTerm, markets, declaredResults]);

  useEffect(() => {
    setShowWinners(false);
    setPotentialWinners([]);
  }, [selectedGame, selectedSession, selectedPana, date]);

  const handleShowWinners = async () => {
    if (!selectedGame || !selectedSession || !selectedPana) {
      alert('Please select Game, Session, and enter a Pana.');
      return;
    }
    const selectedMarket = markets.find(m => m.market_name === selectedGame);
    if (!selectedMarket) {
      alert('Selected game not found. Please refresh and try again.');
      return;
    }
    const existingResult = declaredResults.find(r => r.market_id === selectedMarket.market_id);
    if (existingResult) {
      if (selectedSession === 'Open' && existingResult.result_open_pana) {
        alert(`Open result for ${selectedGame} is already declared. Delete it first to redeclare.`);
        return;
      }
      if (selectedSession === 'Close' && existingResult.result_closed_pana) {
        alert(`Close result for ${selectedGame} is already declared. Delete it first to redeclare.`);
        return;
      }
      if (selectedSession === 'Close' && !existingResult.result_open_pana) {
        alert(`Cannot declare Close result for ${selectedGame} before Open result is declared.`);
        return;
      }
    } else if (selectedSession === 'Close') {
      alert(`Cannot declare Close result for ${selectedGame} before Open result is declared.`);
      return;
    }
    setIsLoadingWinners(true);
    setShowWinners(false);
    setPotentialWinners([]);
    try {
      const response = await fetch('https://backend.gdmatka.site/api/get-potential-winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          market_id: selectedMarket.market_id,
          result_date: date,
          session: selectedSession,
          pana: selectedPana,
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }
      const data = JSON.parse(responseText);
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server.');
      }
      setPotentialWinners(data.map(winner => ({
        ...winner,
        editable_number: winner.bet_number,
        editable_bid_amount: String(winner.bid_points || ''),
      })));
      setShowWinners(true);
    } catch (error) {
      alert((error as Error).message);
      console.error('Error in handleShowWinners:', error);
    } finally {
      setIsLoadingWinners(false);
    }
  };

  const handleWinnerNumberChange = (bet_id: any, newNumber: any) => {
    setPotentialWinners(prev =>
      prev.map(w => (w.bet_id === bet_id ? { ...w, editable_number: newNumber } : w))
    );
  };

  const handleWinnerBetChange = (bet_id: any, newAmount: any) => {
    setPotentialWinners(prev =>
      prev.map(w => {
        if (w.bet_id === bet_id) {
          const rate = parseFloat(w.rate) || 0;
          const updatedAmount = parseFloat(newAmount) || 0;

          // ▼▼▼ यहाँ बदलाव करें ▼▼▼
          let updatedWonAmount = 0;
          if (w.game_name === 'Jodi Digit') {
            // जोड़ी का रेट 100 पर होता है
            updatedWonAmount = updatedAmount * (rate / 100);
          } else {
            // सिंगल डिजिट और पाना का रेट 10 पर होता है
            updatedWonAmount = updatedAmount * (rate / 10);
          }
          // ▲▲▲ बदलाव समाप्त ▲▲▲

          return { ...w, editable_bid_amount: newAmount, won_amount: updatedWonAmount };
        }
        return w;
      })
    );
  };

  const handleDeleteWinner = async (betIdToDelete: any) => {
    if (!window.confirm('Are you sure you want to permanently delete this bet? The user will be refunded.')) {
      return;
    }

    try {
      const response = await fetch(`https://backend.gdmatka.site/api/bets/${betIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete bet.');
      }

      // API से सफल डिलीट होने के बाद ही स्क्रीन से हटाएं
      setPotentialWinners(prev => prev.filter(w => w.bet_id !== betIdToDelete));
      alert('Bet deleted successfully from the database.');

    } catch (error) {
      console.error('Error deleting bet:', error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const { totalBidAmount, totalWinningAmount } = useMemo(() => {
    return potentialWinners.reduce((totals, winner) => {
      totals.totalBidAmount += parseFloat(winner.editable_bid_amount || 0);
      totals.totalWinningAmount += parseFloat(winner.won_amount || 0);
      return totals;
    }, { totalBidAmount: 0, totalWinningAmount: 0 });
  }, [potentialWinners]);

  const handleFinalDeclare = async () => {
    if (potentialWinners.length === 0) {
      if (!window.confirm("No winners in list. Declare with zero winners?")) {
        return;
      }
    }
    setIsSubmitting(true);
    const selectedMarket = markets.find(m => m.market_name === selectedGame);
    if (!selectedMarket) {
      alert('Selected game not found.');
      setIsSubmitting(false);
      return;
    }
    const formData = {
      market_id: selectedMarket.market_id,
      result_date: date,
      session: selectedSession,
      pana: selectedPana,
      winners: potentialWinners.map(winner => ({
        bet_id: winner.bet_id,
        bid_points: parseFloat(winner.editable_bid_amount || winner.bid_points),
        bet_number: winner.editable_number,
        game_name: winner.game_name
      })),
    };
    try {
      const response = await fetch('https://backend.gdmatka.site/api/declareresult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to declare result.');
      }
      alert('Result declared successfully!');
      setShowWinners(false);
      setPotentialWinners([]);
      setSelectedPana('');
      setSelectedGame('');
      fetchInitialData(token); // Re-fetch all initial data
    } catch (error) {
      alert(`Error declaring result: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResult = async (marketId: any, resultDate: any) => {
    if (!window.confirm(`Delete the result for this market on ${resultDate}?`)) return;
    try {
      const response = await fetch(`https://backend.gdmatka.site/api/results/${marketId}/${resultDate}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Failed to delete.');
      alert('Result deleted successfully!');
      fetchInitialData(token); // Re-fetch all initial data
    } catch (error) {
      console.error('Error deleting result:', error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Main Result Declaration Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Declare New Result</h2>
          </div>
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label htmlFor="resultDate" className="block text-sm font-medium text-gray-700 mb-1">Result Date</label>
                <input type="date" id="resultDate" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Name</label>
                <button type="button" onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-lg text-left flex justify-between items-center bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
                  {isLoading ? 'Loading...' : selectedGame || 'Select Game'}
                  <ChevronDown className={`w-5 h-5 transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isGameDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b">
                      <input type="text" placeholder="Search game..." value={gameSearchTerm} onChange={e => setGameSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    {availableMarkets.length > 0 ? (
                      availableMarkets.map(market => (<div key={market.market_id} onClick={() => { setSelectedGame(market.market_name); setGameSearchTerm(''); setIsGameDropdownOpen(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">{market.market_name}</div>))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">{isLoading ? "Loading..." : "No available games."}</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                <select id="session" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                </select>
              </div>
              <div>
                <label htmlFor="selectedPana" className="block text-sm font-medium text-gray-700 mb-1">{selectedSession} Pana</label>
                <input type="text" id="selectedPana" placeholder="e.g., 125" value={selectedPana} onChange={e => setSelectedPana(e.target.value)} maxLength={3} className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="derivedDigit" className="block text-sm font-medium text-gray-700 mb-1">{selectedSession} Digit</label>
                <input type="text" id="derivedDigit" placeholder="Auto" value={derivedDigit} readOnly className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 shadow-sm cursor-not-allowed" />
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button onClick={handleShowWinners} disabled={isLoadingWinners || !selectedGame || !selectedSession || !selectedPana} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md transition-transform transform hover:scale-105">
                {isLoadingWinners ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Show Winners'}
              </button>
              {showWinners && (
                <button onClick={handleFinalDeclare} disabled={isSubmitting || isLoadingWinners} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed shadow-md transition-transform transform hover:scale-105">
                  {isSubmitting ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Declaring...</> : 'DECLARE RESULT'}
                </button>
              )}
            </div>
            {showWinners && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Potential Winners</h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-700">Total Bid: <span className="text-blue-600 font-bold">{totalBidAmount.toFixed(2)}</span></div>
                  <div className="font-semibold text-gray-700">Total Winning: <span className="text-green-600 font-bold">{totalWinningAmount.toFixed(2)}</span></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border rounded-lg">
                    <thead className="bg-gray-200">
                      <tr>
                        {['#', 'User', 'Game', 'Bet No.', 'Bid Amt', 'Rate', 'Won Amt', 'Action'].map(header => <th key={header} className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {potentialWinners.length > 0 ? (
                        potentialWinners.map((winner, index) => (
                          <tr key={winner.bet_id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b">{index + 1}</td>
                            <td className="px-4 py-2 border-b"><span className="font-medium">{winner.user_name || 'N/A'}</span><br /><span className="text-gray-500 text-xs">{winner.mobile}</span></td>
                            <td className="px-4 py-2 border-b text-xs">{winner.game_name}</td>
                            <td className="px-4 py-2 border-b"><input type="text" value={winner.editable_number} onChange={e => handleWinnerNumberChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" /></td>
                            <td className="px-4 py-2 border-b"><input type="number" value={winner.editable_bid_amount} onChange={e => handleWinnerBetChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" /></td>
                            <td className="px-4 py-2 border-b">{(winner.rate || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 border-b font-medium text-green-600">{(winner.won_amount || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 border-b text-center"><button onClick={() => handleDeleteWinner(winner.bet_id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" title="Remove"><Trash2 size={16} /></button></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={8} className="text-center py-8 text-gray-500">No potential winners found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Declared Results Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Declared Results for <span className="text-blue-600">{date}</span></h2>
          </div>
          <div className="p-2 sm:p-4 overflow-x-auto">
            {declaredResults.length > 0 ? (
              <table className="min-w-full bg-white border rounded-lg">
                <thead className="bg-gray-200">
                  <tr>
                    {['Market', 'Open Pana', 'Jodi', 'Close Pana', 'Action'].map(header => <th key={header} className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {declaredResults.map(result => (
                    <tr key={result.market_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b font-medium">{result.market_name}</td>
                      <td className="px-4 py-2 border-b text-center">{result.result_open_pana || '-'}</td>
                      <td className="px-4 py-2 border-b text-center font-bold text-lg text-red-600">{calculateJodi(result.result_open_pana, result.result_closed_pana)}</td>
                      <td className="px-4 py-2 border-b text-center">{result.result_closed_pana || '-'}</td>
                      <td className="px-4 py-2 border-b text-center">
                        <button onClick={() => handleDeleteResult(result.market_id, date)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" title="Delete Result"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">No results have been declared for {date}.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclareResultForm;

// 'use client';
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { ChevronDown, Trash2, Loader2 } from 'lucide-react';

// // ==============================================================================
// //  Helper function to convert time string to minutes
// // ==============================================================================
// const timeToMinutes = (timeStr: string): number => {
//   if (!timeStr || typeof timeStr !== 'string') return Infinity;
//   try {
//     const upperTimeStr = timeStr.toUpperCase();
//     const parts = upperTimeStr.split(' ');
//     const timePart = parts[0];
//     const modifier = parts.length > 1 ? parts[1] : null;
//     let [hours, minutes] = timePart.split(':').map(Number);
//     if (isNaN(hours) || isNaN(minutes)) return Infinity;
//     if (modifier) {
//       if (modifier === 'PM' && hours < 12) hours += 12;
//       if (modifier === 'AM' && hours === 12) hours = 0;
//     }
//     return hours * 60 + minutes;
//   } catch (e) {
//     console.error(`Error converting time string: "${timeStr}"`, e);
//     return Infinity;
//   }
// };

// const DeclareResultForm = () => {
//   const router = useRouter();
//   const [markets, setMarkets] = useState<any[]>([]);
//   const [declaredResults, setDeclaredResults] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedGame, setSelectedGame] = useState('');
//   const [selectedSession, setSelectedSession] = useState('Open');
//   const [selectedPana, setSelectedPana] = useState('');
//   const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
//   const [token, setToken] = useState('');
//   const [potentialWinners, setPotentialWinners] = useState<any[]>([]);
//   const [showWinners, setShowWinners] = useState(false);
//   const [isLoadingWinners, setIsLoadingWinners] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
//   const [gameSearchTerm, setGameSearchTerm] = useState('');

//   const getDigitFromPana = (pana: string) => {
//     if (!pana || pana.length !== 3 || isNaN(Number(pana))) return '';
//     const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
//     return String(sum % 10);
//   };

//   const derivedDigit = useMemo(() => getDigitFromPana(selectedPana), [selectedPana]);

//   const calculateJodi = useCallback((openPana: string, closePana: string) => {
//     if (!openPana || !closePana) return 'N/A';
//     const openDigit = getDigitFromPana(openPana);
//     const closeDigit = getDigitFromPana(closePana);
//     if (openDigit === '' || closeDigit === '') return 'N/A';
//     return `${openDigit}${closeDigit}`;
//   }, []);

//   const fetchInitialData = useCallback(async (authToken: string) => {
//     setIsLoading(true);
//     try {
//       const [marketResponse, marketDataResponse] = await Promise.all([
//         fetch('https://backend.gdmatka.site/api/market', { headers: { Authorization: `Bearer ${authToken}` } }),
//         fetch(`https://backend.gdmatka.site/api/marketdata?date=${date}`, { headers: { Authorization: `Bearer ${authToken}` } })
//       ]);

//       if (marketResponse.status === 401 || marketDataResponse.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/login');
//         return;
//       }

//       const marketData = await marketResponse.json();
//       const activeMarkets = marketData.filter((market: any) => market.active_status === 'Active');
//       const sortedMarkets = activeMarkets.sort((a: any, b: any) => timeToMinutes(a.market_open_time) - timeToMinutes(b.market_open_time));
//       setMarkets(sortedMarkets);

//       const declaredData = await marketDataResponse.json();
//       const results = declaredData.filter((market: any) => market.result_open_pana || market.result_closed_pana);
//       const sortedResults = results.sort((a: any, b: any) => timeToMinutes(a.market_open_time) - timeToMinutes(b.market_open_time));
//       setDeclaredResults(sortedResults);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       alert('Failed to fetch data. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [date, router]);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     if (storedToken) {
//       setToken(storedToken);
//       fetchInitialData(storedToken);
//     } else {
//       router.push('/login');
//     }
//   }, [date, fetchInitialData, router]);

//   const availableMarkets = useMemo(() => {
//     const lowerSearch = gameSearchTerm.toLowerCase();
//     const declaredMarketIds = new Set(
//       declaredResults
//         .filter(r => r.result_open_pana && r.result_closed_pana)
//         .map(r => r.market_id)
//     );
//     return markets.filter(market =>
//       !declaredMarketIds.has(market.market_id) &&
//       market.market_name.toLowerCase().includes(lowerSearch)
//     );
//   }, [gameSearchTerm, markets, declaredResults]);

//   useEffect(() => {
//     setShowWinners(false);
//     setPotentialWinners([]);
//   }, [selectedGame, selectedSession, selectedPana, date]);

//   const handleShowWinners = async () => {
//     if (!selectedGame || !selectedSession || !selectedPana) {
//       alert('Please select Game, Session, and enter a Pana.');
//       return;
//     }
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found. Please refresh and try again.');
//       return;
//     }
//     const existingResult = declaredResults.find(r => r.market_id === selectedMarket.market_id);
//     if (existingResult) {
//       if (selectedSession === 'Open' && existingResult.result_open_pana) {
//         alert(`Open result for ${selectedGame} is already declared. Delete it first to redeclare.`);
//         return;
//       }
//       if (selectedSession === 'Close' && existingResult.result_closed_pana) {
//         alert(`Close result for ${selectedGame} is already declared. Delete it first to redeclare.`);
//         return;
//       }
//       if (selectedSession === 'Close' && !existingResult.result_open_pana) {
//         alert(`Cannot declare Close result for ${selectedGame} before Open result is declared.`);
//         return;
//       }
//     } else if (selectedSession === 'Close') {
//       alert(`Cannot declare Close result for ${selectedGame} before Open result is declared.`);
//       return;
//     }
//     setIsLoadingWinners(true);
//     setShowWinners(false);
//     setPotentialWinners([]);
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/get-potential-winners', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({
//           market_id: selectedMarket.market_id,
//           result_date: date,
//           session: selectedSession,
//           pana: selectedPana,
//         }),
//       });
//       const responseText = await response.text();
//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status} - ${responseText}`);
//       }
//       const data = JSON.parse(responseText);
//       if (!Array.isArray(data)) {
//         throw new Error('Invalid data format received from server.');
//       }
//       setPotentialWinners(data.map(winner => ({
//         ...winner,
//         editable_number: winner.bet_number,
//         editable_bid_amount: String(winner.bid_points || ''),
//       })));
//       setShowWinners(true);
//     } catch (error) {
//       alert((error as Error).message);
//       console.error('Error in handleShowWinners:', error);
//     } finally {
//       setIsLoadingWinners(false);
//     }
//   };

//   const handleWinnerNumberChange = (bet_id: any, newNumber: any) => {
//     setPotentialWinners(prev =>
//       prev.map(w => (w.bet_id === bet_id ? { ...w, editable_number: newNumber } : w))
//     );
//   };

//   const handleWinnerBetChange = (bet_id: any, newAmount: any) => {
//     setPotentialWinners(prev =>
//       prev.map(w => {
//         if (w.bet_id === bet_id) {
//           const rate = parseFloat(w.rate) || 0;
//           const updatedAmount = parseFloat(newAmount) || 0;
//           const updatedWonAmount = updatedAmount * (rate / 10);
//           return { ...w, editable_bid_amount: newAmount, won_amount: updatedWonAmount };
//         }
//         return w;
//       })
//     );
//   };

//   const handleDeleteWinner = (betIdToDelete: any) => {
//     if (window.confirm('Are you sure you want to remove this winner?')) {
//       setPotentialWinners(prev => prev.filter(w => w.bet_id !== betIdToDelete));
//     }
//   };

//   const { totalBidAmount, totalWinningAmount } = useMemo(() => {
//     return potentialWinners.reduce((totals, winner) => {
//       totals.totalBidAmount += parseFloat(winner.editable_bid_amount || 0);
//       totals.totalWinningAmount += parseFloat(winner.won_amount || 0);
//       return totals;
//     }, { totalBidAmount: 0, totalWinningAmount: 0 });
//   }, [potentialWinners]);

//   const handleFinalDeclare = async () => {
//     if (potentialWinners.length === 0) {
//       if (!window.confirm("No winners in list. Declare with zero winners?")) {
//         return;
//       }
//     }
//     setIsSubmitting(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found.');
//       setIsSubmitting(false);
//       return;
//     }
//     const formData = {
//       market_id: selectedMarket.market_id,
//       result_date: date,
//       session: selectedSession,
//       pana: selectedPana,
//       winners: potentialWinners.map(winner => ({
//         bet_id: winner.bet_id,
//         bid_points: parseFloat(winner.editable_bid_amount || winner.bid_points),
//         bet_number: winner.editable_number,
//         game_name: winner.game_name
//       })),
//     };
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/declareresult', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.error || 'Failed to declare result.');
//       }
//       alert('Result declared successfully!');
//       setShowWinners(false);
//       setPotentialWinners([]);
//       setSelectedPana('');
//       setSelectedGame('');
//       fetchInitialData(token); // Re-fetch all initial data
//     } catch (error) {
//       alert(`Error declaring result: ${(error as Error).message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDeleteResult = async (marketId: any, resultDate: any) => {
//     if (!window.confirm(`Delete the result for this market on ${resultDate}?`)) return;
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/results/${marketId}/${resultDate}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       const responseData = await response.json();
//       if (!response.ok) throw new Error(responseData.message || 'Failed to delete.');
//       alert('Result deleted successfully!');
//       fetchInitialData(token); // Re-fetch all initial data
//     } catch (error) {
//       console.error('Error deleting result:', error);
//       alert(`Error: ${(error as Error).message}`);
//     }
//   };

//   if (isLoading) {
//     return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
//       <div className="max-w-7xl mx-auto space-y-6">
//         {/* Main Result Declaration Form */}
//         <div className="bg-white rounded-xl shadow-lg border border-gray-200">
//           <div className="p-4 border-b border-gray-200">
//             <h2 className="text-xl font-bold text-gray-800">Declare New Result</h2>
//           </div>
//           <div className="p-4 space-y-6">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//               <div>
//                 <label htmlFor="resultDate" className="block text-sm font-medium text-gray-700 mb-1">Result Date</label>
//                 <input type="date" id="resultDate" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
//               </div>
//               <div className="relative">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Game Name</label>
//                 <button type="button" onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-lg text-left flex justify-between items-center bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
//                   {isLoading ? 'Loading...' : selectedGame || 'Select Game'}
//                   <ChevronDown className={`w-5 h-5 transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
//                 </button>
//                 {isGameDropdownOpen && (
//                   <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     <div className="p-2 border-b">
//                       <input type="text" placeholder="Search game..." value={gameSearchTerm} onChange={e => setGameSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
//                     </div>
//                     {availableMarkets.length > 0 ? (
//                       availableMarkets.map(market => (<div key={market.market_id} onClick={() => { setSelectedGame(market.market_name); setGameSearchTerm(''); setIsGameDropdownOpen(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">{market.market_name}</div>))
//                     ) : (
//                       <div className="px-4 py-2 text-gray-500">{isLoading ? "Loading..." : "No available games."}</div>
//                     )}
//                   </div>
//                 )}
//               </div>
//               <div>
//                 <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-1">Session</label>
//                 <select id="session" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
//                   <option value="Open">Open</option>
//                   <option value="Close">Close</option>
//                 </select>
//               </div>
//               <div>
//                 <label htmlFor="selectedPana" className="block text-sm font-medium text-gray-700 mb-1">{selectedSession} Pana</label>
//                 <input type="text" id="selectedPana" placeholder="e.g., 125" value={selectedPana} onChange={e => setSelectedPana(e.target.value)} maxLength={3} className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" />
//               </div>
//               <div>
//                 <label htmlFor="derivedDigit" className="block text-sm font-medium text-gray-700 mb-1">{selectedSession} Digit</label>
//                 <input type="text" id="derivedDigit" placeholder="Auto" value={derivedDigit} readOnly className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 shadow-sm cursor-not-allowed" />
//               </div>
//             </div>
//             <div className="flex items-center space-x-3 pt-2">
//               <button onClick={handleShowWinners} disabled={isLoadingWinners || !selectedGame || !selectedSession || !selectedPana} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md transition-transform transform hover:scale-105">
//                 {isLoadingWinners ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Show Winners'}
//               </button>
//               {showWinners && (
//                 <button onClick={handleFinalDeclare} disabled={isSubmitting || isLoadingWinners} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed shadow-md transition-transform transform hover:scale-105">
//                   {isSubmitting ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Declaring...</> : 'DECLARE RESULT'}
//                 </button>
//               )}
//             </div>
//             {showWinners && (
//               <div className="pt-6 border-t border-gray-200">
//                 <h3 className="text-lg font-bold text-gray-800 mb-4">Potential Winners</h3>
//                 <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 mb-4 p-4 bg-gray-50 rounded-lg">
//                   <div className="font-semibold text-gray-700">Total Bid: <span className="text-blue-600 font-bold">{totalBidAmount.toFixed(2)}</span></div>
//                   <div className="font-semibold text-gray-700">Total Winning: <span className="text-green-600 font-bold">{totalWinningAmount.toFixed(2)}</span></div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white border rounded-lg">
//                     <thead className="bg-gray-200">
//                       <tr>
//                         {['#', 'User', 'Game', 'Bet No.', 'Bid Amt', 'Rate', 'Won Amt', 'Action'].map(header => <th key={header} className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>)}
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {potentialWinners.length > 0 ? (
//                         potentialWinners.map((winner, index) => (
//                           <tr key={winner.bet_id} className="hover:bg-gray-50">
//                             <td className="px-4 py-2 border-b">{index + 1}</td>
//                             <td className="px-4 py-2 border-b"><span className="font-medium">{winner.user_name || 'N/A'}</span><br /><span className="text-gray-500 text-xs">{winner.mobile}</span></td>
//                             <td className="px-4 py-2 border-b text-xs">{winner.game_name}</td>
//                             <td className="px-4 py-2 border-b"><input type="text" value={winner.editable_number} onChange={e => handleWinnerNumberChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" /></td>
//                             <td className="px-4 py-2 border-b"><input type="number" value={winner.editable_bid_amount} onChange={e => handleWinnerBetChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" /></td>
//                             <td className="px-4 py-2 border-b">{(winner.rate || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b font-medium text-green-600">{(winner.won_amount || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b text-center"><button onClick={() => handleDeleteWinner(winner.bet_id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" title="Remove"><Trash2 size={16} /></button></td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr><td colSpan={8} className="text-center py-8 text-gray-500">No potential winners found.</td></tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Declared Results Table */}
//         <div className="bg-white rounded-xl shadow-lg border border-gray-200">
//           <div className="p-4 border-b border-gray-200">
//             <h2 className="text-xl font-bold text-gray-800">Declared Results for <span className="text-blue-600">{date}</span></h2>
//           </div>
//           <div className="p-2 sm:p-4 overflow-x-auto">
//             {declaredResults.length > 0 ? (
//               <table className="min-w-full bg-white border rounded-lg">
//                 <thead className="bg-gray-200">
//                   <tr>
//                     {['Market', 'Open Pana', 'Jodi', 'Close Pana', 'Action'].map(header => <th key={header} className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>)}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {declaredResults.map(result => (
//                     <tr key={result.market_id} className="hover:bg-gray-50">
//                       <td className="px-4 py-2 border-b font-medium">{result.market_name}</td>
//                       <td className="px-4 py-2 border-b text-center">{result.result_open_pana || '-'}</td>
//                       <td className="px-4 py-2 border-b text-center font-bold text-lg text-red-600">{calculateJodi(result.result_open_pana, result.result_closed_pana)}</td>
//                       <td className="px-4 py-2 border-b text-center">{result.result_closed_pana || '-'}</td>
//                       <td className="px-4 py-2 border-b text-center">
//                         <button onClick={() => handleDeleteResult(result.market_id, date)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" title="Delete Result"><Trash2 size={18} /></button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <div className="text-center py-8 text-gray-500">No results have been declared for {date}.</div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeclareResultForm;


// 'use client';
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { ChevronDown, Trash2, Loader2 } from 'lucide-react'; // Loader2 icon added

// // ==============================================================================
// //  A robust helper function to convert time string to minutes
// //  Placed outside the component to prevent re-creation on every render.
// // ==============================================================================
// const timeToMinutes = (timeStr) => {
//   // 1. Handle null, undefined, or empty strings immediately, placing them at the end.
//   if (!timeStr || typeof timeStr !== 'string') return Infinity;

//   try {
//     const upperTimeStr = timeStr.toUpperCase();
//     const parts = upperTimeStr.split(' ');
//     const timePart = parts[0];
//     const modifier = parts.length > 1 ? parts[1] : null;

//     let [hours, minutes] = timePart.split(':').map(Number);

//     // 2. Check for parsing errors
//     if (isNaN(hours) || isNaN(minutes)) {
//       console.warn(`Could not parse time: ${timeStr}`);
//       return Infinity; // Push unparseable items to the end.
//     }

//     // 3. Handle AM/PM logic
//     if (modifier) {
//       if (modifier === 'PM' && hours < 12) {
//         hours += 12;
//       }
//       if (modifier === 'AM' && hours === 12) { // 12 AM is 00:00
//         hours = 0;
//       }
//     }
//     // If no modifier, assume it's 24-hour format already.

//     return hours * 60 + minutes;
//   } catch (e) {
//     console.error(`Error converting time string: "${timeStr}"`, e);
//     return Infinity; // Push errored items to the end.
//   }
// };


// const DeclareResultForm = () => {
//   const router = useRouter();
//   const [markets, setMarkets] = useState([]);
//   const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);
//   const [availableMarkets, setAvailableMarkets] = useState([]);
//   const [selectedGame, setSelectedGame] = useState('');
//   const [selectedSession, setSelectedSession] = useState('Open');
//   const [selectedPana, setSelectedPana] = useState('');
//   const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
//   const [token, setToken] = useState('');
//   const [potentialWinners, setPotentialWinners] = useState([]);
//   const [showWinners, setShowWinners] = useState(false);
//   const [isLoadingWinners, setIsLoadingWinners] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
//   const [gameSearchTerm, setGameSearchTerm] = useState('');
//   const [declaredResults, setDeclaredResults] = useState([]);
//   const [isLoadingDeclaredResults, setIsLoadingDeclaredResults] = useState(false);

//   const getDigitFromPana = (pana) => {
//     if (!pana || pana.length !== 3 || isNaN(pana)) return '';
//     const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
//     return String(sum % 10);
//   };

//   const derivedDigit = useMemo(() => getDigitFromPana(selectedPana), [selectedPana]);

//   const calculateJodi = useCallback((openPana, closePana) => {
//     if (!openPana || !closePana) return 'N/A';
//     const openDigit = getDigitFromPana(openPana);
//     const closeDigit = getDigitFromPana(closePana);
//     if (openDigit === '' || closeDigit === '') return 'N/A';
//     return `${openDigit}${closeDigit}`;
//   }, []);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     if (storedToken) setToken(storedToken);
//     else router.push('/login');
//   }, [router]);

//   const fetchMarkets = useCallback(async () => {
//     if (!token) return;
//     setIsLoadingMarkets(true);
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/market', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/login');
//         return;
//       }
//       const data = await response.json();
//       const activeMarkets = data.filter(market => market.active_status === 'Active');

//       const sortedMarkets = activeMarkets.sort((a, b) => timeToMinutes(a.open_time) - timeToMinutes(b.open_time));
//       setMarkets(sortedMarkets);
//     } catch (error) {
//       console.error('Error fetching markets:', error);
//       alert('Failed to fetch market list. Please try again.');
//     } finally {
//       setIsLoadingMarkets(false);
//     }
//   }, [token, router]);

//   const fetchDeclaredResults = useCallback(async () => {
//     if (!token || !date) return;
//     setIsLoadingDeclaredResults(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/marketdata?date=${date}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/login');
//         return;
//       }
//       const data = await response.json();
//       const results = data.filter(market => market.result_open_pana || market.result_closed_pana);

//       const sortedResults = results.sort((a, b) => timeToMinutes(a.open_time) - timeToMinutes(b.open_time));
//       setDeclaredResults(sortedResults);
//     } catch (error) {
//       console.error('Error fetching declared results:', error);
//     } finally {
//       setIsLoadingDeclaredResults(false);
//     }
//   }, [token, date, router]);

//   useEffect(() => {
//     if (token) fetchMarkets();
//   }, [token, fetchMarkets]);

//   useEffect(() => {
//     if (token && date) fetchDeclaredResults();
//   }, [token, date, fetchDeclaredResults]);

//   useEffect(() => {
//     const lowerSearch = gameSearchTerm.toLowerCase();

//     const declaredMarketIds = declaredResults.reduce((acc, result) => {
//       if (result.result_open_pana && result.result_closed_pana) {
//         acc.add(result.market_id);
//       }
//       return acc;
//     }, new Set());

//     const filtered = markets.filter(market =>
//       !declaredMarketIds.has(market.market_id) &&
//       market.market_name.toLowerCase().includes(lowerSearch)
//     );
//     setAvailableMarkets(filtered);

//     if (selectedGame && !filtered.some(m => m.market_name === selectedGame)) {
//       setSelectedGame('');
//     }
//   }, [gameSearchTerm, markets, declaredResults, selectedGame]);

//   useEffect(() => {
//     setShowWinners(false);
//     setPotentialWinners([]);
//   }, [selectedGame, selectedSession, selectedPana, date]);

//   const handleShowWinners = async () => {
//     if (!selectedGame || !selectedSession || !selectedPana) {
//       alert('Please select Game, Session, and enter a Pana.');
//       return;
//     }

//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found. Please refresh and try again.');
//       return;
//     }

//     const existingResult = declaredResults.find(r => r.market_id === selectedMarket.market_id);
//     if (existingResult) {
//       if (selectedSession === 'Open' && existingResult.result_open_pana) {
//         alert(`Open result for ${selectedGame} is already declared. Delete it first to redeclare.`);
//         return;
//       }
//       if (selectedSession === 'Close' && existingResult.result_closed_pana) {
//         alert(`Close result for ${selectedGame} is already declared. Delete it first to redeclare.`);
//         return;
//       }
//       if (selectedSession === 'Close' && !existingResult.result_open_pana) {
//         alert(`Cannot declare Close result for ${selectedGame} before Open result is declared.`);
//         return;
//       }
//     } else if (selectedSession === 'Close') {
//       alert(`Cannot declare Close result for ${selectedGame} before Open result is declared.`);
//       return;
//     }

//     setIsLoadingWinners(true);
//     setShowWinners(false);
//     setPotentialWinners([]);

//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/get-potential-winners', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({
//           market_id: selectedMarket.market_id,
//           result_date: date,
//           session: selectedSession,
//           pana: selectedPana,
//         }),
//       });
//       const responseText = await response.text();
//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status} - ${responseText}`);
//       }
//       const data = JSON.parse(responseText);
//       if (!Array.isArray(data)) {
//         throw new Error('Invalid data format received from server.');
//       }
//       setPotentialWinners(data.map(winner => ({
//         ...winner,
//         editable_number: winner.bet_number,
//         editable_bid_amount: String(winner.bid_points || ''),
//       })));
//       setShowWinners(true);
//     } catch (error) {
//       alert(error.message);
//       console.error('Error in handleShowWinners:', error);
//     } finally {
//       setIsLoadingWinners(false);
//     }
//   };

//   const handleWinnerNumberChange = (bet_id, newNumber) => {
//     setPotentialWinners(prev =>
//       prev.map(w => (w.bet_id === bet_id ? { ...w, editable_number: newNumber } : w))
//     );
//   };

//   const handleWinnerBetChange = (bet_id, newAmount) => {
//     setPotentialWinners(prev =>
//       prev.map(w => {
//         if (w.bet_id === bet_id) {
//           const rate = parseFloat(w.rate) || 0;
//           const updatedAmount = parseFloat(newAmount) || 0;
//           const updatedWonAmount = updatedAmount * (rate / 10);
//           return { ...w, editable_bid_amount: newAmount, won_amount: updatedWonAmount };
//         }
//         return w;
//       })
//     );
//   };

//   const handleDeleteWinner = (betIdToDelete) => {
//     if (window.confirm('Are you sure you want to remove this winner?')) {
//       setPotentialWinners(prev => prev.filter(w => w.bet_id !== betIdToDelete));
//     }
//   };

//   const { totalBidAmount, totalWinningAmount } = useMemo(() => {
//     return potentialWinners.reduce((totals, winner) => {
//       totals.totalBidAmount += parseFloat(winner.editable_bid_amount || 0);
//       totals.totalWinningAmount += parseFloat(winner.won_amount || 0);
//       return totals;
//     }, { totalBidAmount: 0, totalWinningAmount: 0 });
//   }, [potentialWinners]);

//   const handleFinalDeclare = async () => {
//     if (potentialWinners.length === 0) {
//       if (!window.confirm("No winners in list. Declare with zero winners?")) {
//         return;
//       }
//     }
//     setIsSubmitting(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found.');
//       setIsSubmitting(false);
//       return;
//     }

//     const formData = {
//       market_id: selectedMarket.market_id,
//       result_date: date,
//       session: selectedSession,
//       pana: selectedPana,
//       winners: potentialWinners.map(winner => ({
//         bet_id: winner.bet_id,
//         bid_points: parseFloat(winner.editable_bid_amount || winner.bid_points),
//         bet_number: winner.editable_number,
//         game_name: winner.game_name
//       })),
//     };

//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/declareresult', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.error || 'Failed to declare result.');
//       }
//       alert('Result declared successfully!');
//       setShowWinners(false);
//       setPotentialWinners([]);
//       setSelectedPana('');
//       setSelectedGame('');
//       await fetchDeclaredResults();
//     } catch (error) {
//       alert(`Error declaring result: ${error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDeleteResult = async (marketId, resultDate) => {
//     if (!window.confirm(`Delete the result for this market on ${resultDate}?`)) return;
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/results/${marketId}/${resultDate}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       const responseData = await response.json();
//       if (!response.ok) throw new Error(responseData.message || 'Failed to delete.');
//       alert('Result deleted successfully!');
//       await fetchDeclaredResults();
//     } catch (error) {
//       console.error('Error deleting result:', error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
//       <div className="max-w-7xl mx-auto space-y-6">
//         {/* Main Result Declaration Form */}
//         <div className="bg-white rounded-xl shadow-lg border border-gray-200">
//           <div className="p-4 border-b border-gray-200">
//             <h2 className="text-xl font-bold text-gray-800">Declare New Result</h2>
//           </div>
//           <div className="p-4 space-y-6">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//               <div>
//                 <label htmlFor="resultDate" className="block text-sm font-medium text-gray-700 mb-1">Result Date</label>
//                 <input type="date" id="resultDate" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
//               </div>
//               <div className="relative">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Game Name</label>
//                 <button type="button" onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-lg text-left flex justify-between items-center bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
//                   {isLoadingMarkets ? 'Loading Games...' : selectedGame || 'Select Game'}
//                   {isLoadingMarkets ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className={`w-5 h-5 transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />}
//                 </button>
//                 {isGameDropdownOpen && (
//                   <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     <div className="p-2 border-b">
//                       <input type="text" placeholder="Search game..." value={gameSearchTerm} onChange={e => setGameSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
//                     </div>
//                     {availableMarkets.length > 0 ? (
//                       availableMarkets.map(market => (<div key={market.market_id} onClick={() => { setSelectedGame(market.market_name); setGameSearchTerm(''); setIsGameDropdownOpen(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">{market.market_name}</div>))
//                     ) : (
//                       <div className="px-4 py-2 text-gray-500">{isLoadingMarkets ? "Loading..." : "No available games."}</div>
//                     )}
//                   </div>
//                 )}
//               </div>
//               <div>
//                 <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-1">Session</label>
//                 <select id="session" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
//                   <option value="Open">Open</option>
//                   <option value="Close">Close</option>
//                 </select>
//               </div>
//               <div>
//                 <label htmlFor="selectedPana" className="block text-sm font-medium text-gray-700 mb-1">{selectedSession} Pana</label>
//                 <input type="text" id="selectedPana" placeholder="e.g., 125" value={selectedPana} onChange={e => setSelectedPana(e.target.value)} maxLength="3" className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" />
//               </div>
//               <div>
//                 <label htmlFor="derivedDigit" className="block text-sm font-medium text-gray-700 mb-1">{selectedSession} Digit</label>
//                 <input type="text" id="derivedDigit" placeholder="Auto" value={derivedDigit} readOnly className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 shadow-sm cursor-not-allowed" />
//               </div>
//             </div>
//             <div className="flex items-center space-x-3 pt-2">
//               <button onClick={handleShowWinners} disabled={isLoadingWinners || !selectedGame || !selectedSession || !selectedPana} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md transition-transform transform hover:scale-105">
//                 {isLoadingWinners ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Show Winners'}
//               </button>
//               {showWinners && (
//                 <button onClick={handleFinalDeclare} disabled={isSubmitting || isLoadingWinners} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed shadow-md transition-transform transform hover:scale-105">
//                   {isSubmitting ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Declaring...</> : 'DECLARE RESULT'}
//                 </button>
//               )}
//             </div>
//             {showWinners && (
//               <div className="pt-6 border-t border-gray-200">
//                 <h3 className="text-lg font-bold text-gray-800 mb-4">Potential Winners</h3>
//                 <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 mb-4 p-4 bg-gray-50 rounded-lg">
//                   <div className="font-semibold text-gray-700">Total Bid: <span className="text-blue-600 font-bold">{totalBidAmount.toFixed(2)}</span></div>
//                   <div className="font-semibold text-gray-700">Total Winning: <span className="text-green-600 font-bold">{totalWinningAmount.toFixed(2)}</span></div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white border rounded-lg">
//                     <thead className="bg-gray-200">
//                       <tr>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Game</th>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bet No.</th>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bid Amt</th>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
//                         <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Won Amt</th>
//                         <th className="px-4 py-2 border-b text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {potentialWinners.length > 0 ? (
//                         potentialWinners.map((winner, index) => (
//                           <tr key={winner.bet_id} className="hover:bg-gray-50">
//                             <td className="px-4 py-2 border-b">{index + 1}</td>
//                             <td className="px-4 py-2 border-b"><span className="font-medium">{winner.user_name || 'N/A'}</span><br /><span className="text-gray-500 text-xs">{winner.mobile}</span></td>
//                             <td className="px-4 py-2 border-b text-xs">{winner.game_name}</td>
//                             <td className="px-4 py-2 border-b">
//                               <input type="text" value={winner.editable_number} onChange={e => handleWinnerNumberChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" />
//                             </td>
//                             <td className="px-4 py-2 border-b">
//                               <input type="number" value={winner.editable_bid_amount} onChange={e => handleWinnerBetChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" />
//                             </td>
//                             <td className="px-4 py-2 border-b">{(winner.rate || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b font-medium text-green-600">{(winner.won_amount || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b text-center">
//                               <button onClick={() => handleDeleteWinner(winner.bet_id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" title="Remove"><Trash2 size={16} /></button>
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr><td colSpan="8" className="text-center py-8 text-gray-500">No potential winners found.</td></tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Declared Results Table */}
//         <div className="bg-white rounded-xl shadow-lg border border-gray-200">
//           <div className="p-4 border-b border-gray-200">
//             <h2 className="text-xl font-bold text-gray-800">Declared Results for <span className="text-blue-600">{date}</span></h2>
//           </div>
//           {isLoadingDeclaredResults ? (
//             <div className="p-8 text-center text-gray-500 flex items-center justify-center">
//               <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading results...
//             </div>
//           ) : (
//             <div className="p-2 sm:p-4 overflow-x-auto">
//               {declaredResults.length > 0 ? (
//                 <table className="min-w-full bg-white border rounded-lg">
//                   <thead className="bg-gray-200">
//                     <tr>
//                       <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Market</th>
//                       <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Open Pana</th>
//                       <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jodi</th>
//                       <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Close Pana</th>
//                       <th className="px-4 py-2 border-b text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {declaredResults.map(result => (
//                       <tr key={result.market_id} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 border-b font-medium">{result.market_name}</td>
//                         <td className="px-4 py-2 border-b text-center">{result.result_open_pana || '-'}</td>
//                         <td className="px-4 py-2 border-b text-center font-bold text-lg text-red-600">{calculateJodi(result.result_open_pana, result.result_closed_pana)}</td>
//                         <td className="px-4 py-2 border-b text-center">{result.result_closed_pana || '-'}</td>
//                         <td className="px-4 py-2 border-b text-center">
//                           <button onClick={() => handleDeleteResult(result.market_id, date)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" title="Delete Result"><Trash2 size={18} /></button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">No results have been declared for {date}.</div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeclareResultForm;


// 'use client';
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { ChevronDown, Trash2 } from 'lucide-react';

// const DeclareResultForm = () => {
//   const router = useRouter();
//   const [markets, setMarkets] = useState([]);
//   const [filteredMarkets, setFilteredMarkets] = useState([]);
//   const [selectedGame, setSelectedGame] = useState('');
//   const [selectedSession, setSelectedSession] = useState('Close');
//   const [selectedPana, setSelectedPana] = useState('');
//   const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
//   const [token, setToken] = useState('');
//   const [potentialWinners, setPotentialWinners] = useState([]);
//   const [showWinners, setShowWinners] = useState(false);
//   const [isLoadingWinners, setIsLoadingWinners] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
//   const [gameSearchTerm, setGameSearchTerm] = useState('');
//   const [declaredResults, setDeclaredResults] = useState([]);
//   const [isLoadingDeclaredResults, setIsLoadingDeclaredResults] = useState(false);

//   const getDigitFromPana = (pana) => {
//     if (!pana || pana.length !== 3 || isNaN(pana)) return '';
//     const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
//     return String(sum % 10);
//   };

//   const derivedDigit = useMemo(() => getDigitFromPana(selectedPana), [selectedPana]);

//   const calculateJodi = useCallback((openPana, closePana) => {
//     if (!openPana || !closePana) return 'N/A';
//     const openDigit = getDigitFromPana(openPana);
//     const closeDigit = getDigitFromPana(closePana);
//     if (openDigit === '' || closeDigit === '') return 'N/A';
//     return `${openDigit}${closeDigit}`;
//   }, []);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     if (storedToken) {
//       setToken(storedToken);
//     } else {
//       router.push('/login');
//     }
//   }, [router]);

//   const fetchMarkets = useCallback(async () => {
//     if (!token) return;
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/market', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/login');
//         return;
//       }
//       const data = await response.json();
//       const activeMarkets = data.filter(market => market.active_status === 'Active');
//       setMarkets(activeMarkets);
//       setFilteredMarkets(activeMarkets);
//     } catch (error) {
//       console.error('Error fetching markets:', error);
//       alert('Failed to fetch market list. Please try again.');
//     }
//   }, [token, router]);

//   useEffect(() => {
//     if (token) {
//       fetchMarkets();
//     }
//   }, [token, fetchMarkets]);

//   useEffect(() => {
//     const lowerSearch = gameSearchTerm.toLowerCase();
//     setFilteredMarkets(markets.filter(market => market.market_name.toLowerCase().includes(lowerSearch)));
//   }, [gameSearchTerm, markets]);

//   const fetchDeclaredResults = useCallback(async () => {
//     if (!token || !date) return;
//     setIsLoadingDeclaredResults(true);
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/marketdata?date=${date}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/login');
//         return;
//       }
//       const data = await response.json();
//       const results = data.filter(market => market.result_open_pana || market.result_closed_pana);
//       setDeclaredResults(results);
//     } catch (error) {
//       console.error('Error fetching declared results:', error);
//     } finally {
//       setIsLoadingDeclaredResults(false);
//     }
//   }, [token, date, router]);

//   useEffect(() => {
//     fetchDeclaredResults();
//   }, [fetchDeclaredResults]);

//   useEffect(() => {
//     setShowWinners(false);
//     setPotentialWinners([]);
//   }, [selectedGame, selectedSession, selectedPana, date]);

//   const handleShowWinners = async () => {
//     if (!selectedGame || !selectedSession || !selectedPana) {
//       alert('Please select Game, Session, and enter a Pana.');
//       return;
//     }
//     setIsLoadingWinners(true);
//     setShowWinners(false);
//     setPotentialWinners([]);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found. Please refresh and try again.');
//       setIsLoadingWinners(false);
//       return;
//     }
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/get-potential-winners', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({
//           market_id: selectedMarket.market_id,
//           result_date: date,
//           session: selectedSession,
//           pana: selectedPana,
//         }),
//       });
//       const responseText = await response.text();
//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status} - ${responseText}`);
//       }
//       let data;
//       try {
//         data = JSON.parse(responseText);
//       } catch (e) {
//         throw new Error(`Failed to parse server response.`);
//       }
//       if (!Array.isArray(data)) {
//         throw new Error('Invalid data format received from server.');
//       }
//       setPotentialWinners(data.map(winner => ({
//         ...winner,
//         editable_number: winner.bet_number,
//         editable_bid_amount: String(winner.bid_points || ''),
//       })));
//       setShowWinners(true);
//     } catch (error) {
//       alert(error.message);
//       console.error('Error in handleShowWinners:', error);
//     } finally {
//       setIsLoadingWinners(false);
//     }
//   };

//   const handleWinnerNumberChange = (bet_id, newNumber) => {
//     setPotentialWinners(prev =>
//       prev.map(w => (w.bet_id === bet_id ? { ...w, editable_number: newNumber } : w))
//     );
//   };

//   const handleWinnerBetChange = (bet_id, newAmount) => {
//     setPotentialWinners(prev =>
//       prev.map(w => {
//         if (w.bet_id === bet_id) {
//           const rate = parseFloat(w.rate) || 0;
//           const updatedAmount = parseFloat(newAmount) || 0;
//           const updatedWonAmount = updatedAmount * (rate / 10);
//           return { ...w, editable_bid_amount: newAmount, won_amount: updatedWonAmount };
//         }
//         return w;
//       })
//     );
//   };

//   const handleDeleteWinner = (betIdToDelete) => {
//     if (window.confirm('Are you sure you want to remove this winner?')) {
//       setPotentialWinners(prev => prev.filter(w => w.bet_id !== betIdToDelete));
//     }
//   };

//   const { totalBidAmount, totalWinningAmount } = useMemo(() => {
//     return potentialWinners.reduce((totals, winner) => {
//       totals.totalBidAmount += parseFloat(winner.editable_bid_amount || 0);
//       totals.totalWinningAmount += parseFloat(winner.won_amount || 0);
//       return totals;
//     }, { totalBidAmount: 0, totalWinningAmount: 0 });
//   }, [potentialWinners]);

//   const handleFinalDeclare = async () => {
//     if (potentialWinners.length === 0) {
//       if (!window.confirm("No winners in list. Declare with zero winners?")) {
//         return;
//       }
//     }
//     setIsSubmitting(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found.');
//       setIsSubmitting(false);
//       return;
//     }

//     // *** यहाँ बदलाव किया गया है ***
//     const formData = {
//       market_id: selectedMarket.market_id,
//       result_date: date,
//       session: selectedSession,
//       pana: selectedPana,
//       winners: potentialWinners.map(winner => ({
//         bet_id: winner.bet_id,
//         bid_points: parseFloat(winner.editable_bid_amount || winner.bid_points),
//         bet_number: winner.editable_number, // <-- यह ज़रूरी लाइन जोड़ी गई है
//         game_name: winner.game_name
//       })),
//     };

//     try {
//       // const response = await fetch('https://backend.gdmatka.site/api/declareresult-with-edits', {
//       const response = await fetch('https://backend.gdmatka.site/api/declareresult', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.error || 'Failed to declare result.');
//       }
//       alert('Result declared successfully!');
//       setShowWinners(false);
//       setPotentialWinners([]);
//       setSelectedPana('');
//       await fetchDeclaredResults();
//     } catch (error) {
//       alert(`Error declaring result: ${error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//   const handleDeleteResult = async (marketId, resultDate) => {
//     if (!window.confirm(`Delete the result for this market on ${resultDate}?`)) return;
//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/results/${marketId}/${resultDate}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       const responseData = await response.json();
//       if (!response.ok) throw new Error(responseData.message || 'Failed to delete.');
//       alert('Result deleted successfully!');
//       await fetchDeclaredResults();
//     } catch (error) {
//       console.error('Error deleting result:', error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Main Result Declaration Form */}
//         <div className="bg-white rounded-lg shadow-md border border-gray-200">
//           <div className="p-4 border-b">
//             <h2 className="text-lg font-semibold text-gray-700">Declare New Result</h2>
//           </div>
//           <div className="p-4 space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//               <div>
//                 <label htmlFor="resultDate" className="block text-sm font-medium text-gray-600 mb-1">Result Date</label>
//                 <input type="date" id="resultDate" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
//               </div>
//               <div className="relative">
//                 <label className="block text-sm font-medium text-gray-600 mb-1">Game Name</label>
//                 <button type="button" onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-md text-left flex justify-between items-center bg-white shadow-sm">
//                   {selectedGame || 'Select Game'}
//                   <ChevronDown className={`w-4 h-4 transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
//                 </button>
//                 {isGameDropdownOpen && (
//                   <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     <div className="p-2"><input type="text" placeholder="Search game..." value={gameSearchTerm} onChange={e => setGameSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></div>
//                     {filteredMarkets.map(market => (<div key={market.market_id} onClick={() => { setSelectedGame(market.market_name); setIsGameDropdownOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{market.market_name}</div>))}
//                   </div>
//                 )}
//               </div>
//               <div>
//                 <label htmlFor="session" className="block text-sm font-medium text-gray-600 mb-1">Session</label>
//                 <select id="session" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm">
//                   <option value="Open">Open</option>
//                   <option value="Close">Close</option>
//                 </select>
//               </div>
//               <div>
//                 <label htmlFor="selectedPana" className="block text-sm font-medium text-gray-600 mb-1">{selectedSession} Pana</label>
//                 <input type="text" id="selectedPana" placeholder="e.g., 125" value={selectedPana} onChange={e => setSelectedPana(e.target.value)} maxLength="3" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
//               </div>
//               <div>
//                 <label htmlFor="derivedDigit" className="block text-sm font-medium text-gray-600 mb-1">{selectedSession} Digit</label>
//                 <input type="text" id="derivedDigit" placeholder="(auto)" value={derivedDigit} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm" />
//               </div>
//             </div>
//             <div className="flex items-center space-x-3 pt-2">
//               <button onClick={handleShowWinners} disabled={isLoadingWinners || !selectedGame || !selectedSession || !selectedPana} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 shadow-sm">{isLoadingWinners ? 'Loading...' : 'Show Winner'}</button>
//               {showWinners && (<button onClick={handleFinalDeclare} disabled={isSubmitting || isLoadingWinners} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300 shadow-sm">{isSubmitting ? 'Declaring...' : 'DECLARE'}</button>)}
//             </div>
//             {showWinners && (
//               <div className="pt-4 border-t border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-700 mb-4">Potential Winners</h3>
//                 <div className="flex space-x-8 mb-4 px-4">
//                   <div className="font-semibold text-gray-700">Total Bid: <span className="text-blue-600">{totalBidAmount.toFixed(2)}</span></div>
//                   <div className="font-semibold text-gray-700">Total Winning: <span className="text-green-600">{totalWinningAmount.toFixed(2)}</span></div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white border">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">#</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">User</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Game</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Bet No.</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Bid Amt</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Rate</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Won Amt</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Action</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {potentialWinners.length > 0 ? (
//                         potentialWinners.map((winner, index) => (
//                           <tr key={winner.bet_id} className="hover:bg-gray-50">
//                             <td className="px-4 py-2 border-b">{index + 1}</td>
//                             <td className="px-4 py-2 border-b"><span className="font-medium">{winner.user_name || 'N/A'}</span><br /><span className="text-gray-500 text-xs">{winner.mobile}</span></td>
//                             <td className="px-4 py-2 border-b text-xs">{winner.game_name}</td>
//                             <td className="px-4 py-2 border-b">
//                               <input type="text" value={winner.editable_number} onChange={e => handleWinnerNumberChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" />
//                             </td>
//                             <td className="px-4 py-2 border-b">
//                               <input type="number" value={winner.editable_bid_amount} onChange={e => handleWinnerBetChange(winner.bet_id, e.target.value)} className="w-24 p-1 border border-gray-300 rounded-md text-center" />
//                             </td>
//                             <td className="px-4 py-2 border-b">{(winner.rate || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b font-medium text-green-600">{(winner.won_amount || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b">
//                               <button onClick={() => handleDeleteWinner(winner.bet_id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100" title="Remove"><Trash2 size={16} /></button>
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr><td colSpan="8" className="text-center py-4 text-gray-500">No potential winners found.</td></tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow-md border border-gray-200 mt-6">
//           <div className="p-4 border-b">
//             <h2 className="text-lg font-semibold text-gray-700">Declared Results for {date}</h2>
//           </div>
//           {isLoadingDeclaredResults ? (
//             <div className="p-4 text-center text-gray-500">Loading...</div>
//           ) : (
//             <div className="p-4 overflow-x-auto">
//               {declaredResults.length > 0 ? (
//                 <table className="min-w-full bg-white border">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Market</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Open Pana</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Jodi</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Close Pana</th>
//                       <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-600">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {declaredResults.map(result => (
//                       <tr key={result.market_id} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 border-b">{result.market_name}</td>
//                         <td className="px-4 py-2 border-b">{result.result_open_pana || '-'}</td>
//                         <td className="px-4 py-2 border-b font-semibold">{calculateJodi(result.result_open_pana, result.result_closed_pana)}</td>
//                         <td className="px-4 py-2 border-b">{result.result_closed_pana || '-'}</td>
//                         <td className="px-4 py-2 border-b text-center">
//                           <button onClick={() => handleDeleteResult(result.market_id, date)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" title="Delete Result"><Trash2 size={18} /></button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <div className="text-center py-4 text-gray-500">No results declared for {date}.</div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeclareResultForm;


// 'use client'; // Next.js 13+ में क्लाइंट कंपोनेंट के लिए आवश्यक
// import React, { useState, useEffect, useMemo, useCallback } from 'react'; // useCallback भी जोड़ा ताकि fetchDeclaredResults को memoize किया जा सके
// import { useRouter } from 'next/navigation'; // Next.js 13+ के लिए सही इम्पोर्ट
// import { ChevronDown, Trash2 } from 'lucide-react'; // आइकन्स

// const DeclareResultForm = () => {
//   const router = useRouter();
//   const [markets, setMarkets] = useState([]);
//   const [filteredMarkets, setFilteredMarkets] = useState([]);
//   const [selectedGame, setSelectedGame] = useState(''); // Game Name (e.g., Kalyan)
//   const [selectedSession, setSelectedSession] = useState('Close'); // Open or Close
//   const [selectedPana, setSelectedPana] = useState(''); // 3-digit Pana (e.g., 125)
//   const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]); // Current date in YYYY-MM-DD format
//   const [token, setToken] = useState(''); // JWT token for authentication
//   const [potentialWinners, setPotentialWinners] = useState([]); // List of winners fetched from backend
//   const [showWinners, setShowWinners] = useState(false); // Controls visibility of winners table
//   const [isLoadingWinners, setIsLoadingWinners] = useState(false); // Loading state for fetching winners
//   const [isSubmitting, setIsSubmitting] = useState(false); // Submitting state for declaring result
//   const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false); // Controls visibility of game dropdown
//   const [gameSearchTerm, setGameSearchTerm] = useState(''); // Search term for game dropdown

//   // New states for Declared Results section
//   const [declaredResults, setDeclaredResults] = useState([]); // List of already declared results for the date
//   const [isLoadingDeclaredResults, setIsLoadingDeclaredResults] = useState(false); // Loading state for declared results

//   // Helper function to calculate single digit from Pana
//   const getDigitFromPana = (pana) => {
//     if (!pana || pana.length !== 3 || isNaN(pana)) return ''; // Basic validation
//     const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
//     return String(sum % 10); // Return last digit as string
//   };
//   const derivedDigit = useMemo(() => getDigitFromPana(selectedPana), [selectedPana]);

//   // Helper function to calculate Jodi from Open and Close Pana
//   const calculateJodi = useCallback((openPana, closePana) => {
//     if (!openPana || !closePana) return 'N/A';
//     const openDigit = getDigitFromPana(openPana);
//     const closeDigit = getDigitFromPana(closePana);
//     // Ensure both digits are valid before combining
//     if (openDigit === '' || closeDigit === '') return 'N/A';
//     return `${openDigit}${closeDigit}`;
//   }, []); // No dependencies, so can be memoized once

//   // Effect to load token from localStorage
//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     if (storedToken) setToken(storedToken);
//     else router.push('/login'); // Redirect to login if no token
//   }, [router]);

//   // Effect to fetch active markets on component mount or token change
//   useEffect(() => {
//     const fetchMarkets = async () => {
//       if (!token) return;
//       try {
//         const response = await fetch('https://backend.gdmatka.site/api/market', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (response.status === 401) {
//           localStorage.removeItem('token');
//           router.push('/login');
//           return;
//         }
//         const data = await response.json();
//         const activeMarkets = data.filter(market => market.active_status === 'Active');
//         setMarkets(activeMarkets);
//         setFilteredMarkets(activeMarkets); // Initialize filtered markets
//       } catch (error) {
//         console.error('Error fetching markets:', error);
//         alert('Failed to fetch market list. Please try again.');
//       }
//     };
//     fetchMarkets();
//   }, [token, router]);

//   // Effect to filter markets based on search term
//   useEffect(() => {
//     const lowerSearch = gameSearchTerm.toLowerCase();
//     setFilteredMarkets(markets.filter(market => market.market_name.toLowerCase().includes(lowerSearch)));
//   }, [gameSearchTerm, markets]);

//   // Function to fetch declared results for the current date
//   const fetchDeclaredResults = useCallback(async () => {
//     if (!token || !date) return;
//     setIsLoadingDeclaredResults(true);
//     try {
//       // Assuming backend.gdmatka.site/api/marketdata?date=YYYY-MM-DD
//       // returns market data along with declared results for that date
//       const response = await fetch(`https://backend.gdmatka.site/api/marketdata?date=${date}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (response.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/login');
//         return;
//       }
//       const data = await response.json();
//       // Filter out markets that have either open_pana or closed_pana declared
//       const results = data.filter(market => market.result_open_pana || market.result_closed_pana);
//       setDeclaredResults(results);
//     } catch (error) {
//       console.error('Error fetching declared results:', error);
//       alert('Failed to fetch declared results. Please check console for details.');
//     } finally {
//       setIsLoadingDeclaredResults(false);
//     }
//   }, [token, date, router]); // Dependencies: token, date, router

//   // Effect to fetch declared results when component mounts or token/date changes
//   useEffect(() => {
//     fetchDeclaredResults();
//   }, [fetchDeclaredResults]); // Dependency: fetchDeclaredResults memoized function

//   // Reset winner section when main form inputs change
//   useEffect(() => {
//     setShowWinners(false);
//     setPotentialWinners([]);
//   }, [selectedGame, selectedSession, selectedPana, date]);

//   // Handler for "Show Winner" button
//   const handleShowWinners = async () => {
//     if (!selectedGame || !selectedSession || !selectedPana) {
//       alert('Please select Game, Session, and enter a Pana.');
//       return;
//     }
//     setIsLoadingWinners(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found in market list. Please refresh and try again.');
//       setIsLoadingWinners(false);
//       return;
//     }
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/get-potential-winners', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({
//           market_id: selectedMarket.market_id,
//           result_date: date,
//           session: selectedSession,
//           pana: selectedPana,
//         }),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         // Check for specific error message for "operator does not exist"
//         if (errData.details && errData.details.includes('operator does not exist')) {
//           throw new Error('Backend Error: Invalid data type for calculation. Please contact support.');
//         } else {
//           throw new Error(errData.error || 'Failed to fetch winners. Unknown error.');
//         }
//       }
//       const data = await response.json();
//       setPotentialWinners(data.map(winner => ({ // Add editable fields for UI
//         ...winner,
//         editable_number: winner.bet_number,
//         editable_bid_amount: winner.bid_points,
//       })));
//       setShowWinners(true);
//     } catch (error) {
//       alert(error.message);
//       console.error('Error in handleShowWinners:', error);
//     } finally {
//       setIsLoadingWinners(false);
//     }
//   };

//   // Handler for editing bet number in the winners table (if needed for adjustments)
//   const handleWinnerNumberChange = (bet_id, newNumber) => {
//     setPotentialWinners(prev =>
//       prev.map(w => (w.bet_id === bet_id ? { ...w, editable_number: newNumber } : w))
//     );
//   };

//   // Handler for editing bid amount in the winners table
//   const handleWinnerBetChange = (bet_id, newAmount) => {
//     setPotentialWinners(prev =>
//       prev.map(w => {
//         if (w.bet_id === bet_id) {
//           const rate = parseFloat(w.rate) || 0; // Ensure w.rate is available and is a number
//           const updatedAmount = parseFloat(newAmount) || 0;
//           // Assuming backend rate is for 10 points, so divide by 10 for per point rate
//           const updatedWonAmount = updatedAmount * (rate / 10);
//           return { ...w, editable_bid_amount: newAmount, won_amount: updatedWonAmount };
//         }
//         return w;
//       })
//     );
//   };

//   // Handler for deleting a winner from the list
//   const handleDeleteWinner = (betIdToDelete) => {
//     if (window.confirm('Are you sure you want to remove this winner from the list? This cannot be undone once declared.')) {
//       setPotentialWinners(prevWinners =>
//         prevWinners.filter(winner => winner.bet_id !== betIdToDelete)
//       );
//     }
//   };

//   // Memoized calculation for total bid and winning amounts in the table
//   const { totalBidAmount, totalWinningAmount } = useMemo(() => {
//     return potentialWinners.reduce((totals, winner) => {
//       const bidAmount = parseFloat(winner.editable_bid_amount || winner.bid_points || 0); // Use editable amount first
//       const wonAmount = parseFloat(winner.won_amount || 0);
//       totals.totalBidAmount += bidAmount;
//       totals.totalWinningAmount += wonAmount;
//       return totals;
//     }, { totalBidAmount: 0, totalWinningAmount: 0 });
//   }, [potentialWinners]);

//   // Handler for "DECLARE" button
//   const handleFinalDeclare = async () => {
//     if (potentialWinners.length === 0) {
//       if (!window.confirm("There are no winners in the list. Do you still want to declare the result with zero winners?")) {
//         return;
//       }
//     }
//     setIsSubmitting(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Selected game not found in market list. Cannot declare result.');
//       setIsSubmitting(false);
//       return;
//     }

//     const formData = {
//       market_id: selectedMarket.market_id,
//       result_date: date,
//       session: selectedSession,
//       pana: selectedPana,
//       winners: potentialWinners.map(winner => ({ // Send only necessary data to backend
//         bet_id: winner.bet_id,
//         bid_points: parseFloat(winner.editable_bid_amount || winner.bid_points), // Ensure float
//         game_name: winner.game_name // Pass game_name for rate calculation on backend
//       })),
//     };

//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/declareresult-with-edits', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.error || 'Failed to declare result.');
//       }
//       alert('Result declared successfully!');
//       // Reset form and winner display
//       setShowWinners(false);
//       setPotentialWinners([]);
//       setSelectedPana('');
//       // Re-fetch declared results to update the list immediately
//       await fetchDeclaredResults();
//     } catch (error) {
//       alert(`Error declaring result: ${error.message}`);
//       console.error('Error in handleFinalDeclare:', error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Main Result Declaration Form */}
//         <div className="bg-white rounded-lg shadow-md border border-gray-200">
//           <div className="p-4 border-b">
//             <h2 className="text-lg font-semibold text-gray-700">Declare New Result</h2>
//           </div>

//           <div className="p-4 space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//               <div>
//                 <label htmlFor="resultDate" className="block text-sm font-medium text-gray-600 mb-1">Result Date</label>
//                 <input
//                   type="date"
//                   id="resultDate"
//                   value={date}
//                   onChange={e => setDate(e.target.value)}
//                   className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 />
//               </div>

//               <div className="relative">
//                 <label htmlFor="gameName" className="block text-sm font-medium text-gray-600 mb-1">Game Name</label>
//                 <button
//                   type="button" // Important for buttons inside forms to prevent unintended submission
//                   onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
//                   className="w-full p-2 border border-gray-300 rounded-md text-left flex justify-between items-center bg-white shadow-sm"
//                 >
//                   {selectedGame || 'Select Game'}
//                   <ChevronDown className={`w-4 h-4 transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
//                 </button>
//                 {isGameDropdownOpen && (
//                   <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     <div className="p-2">
//                       <input
//                         type="text"
//                         placeholder="Search game..."
//                         value={gameSearchTerm}
//                         onChange={e => setGameSearchTerm(e.target.value)}
//                         className="w-full p-2 border border-gray-300 rounded-md"
//                       />
//                     </div>
//                     {filteredMarkets.length > 0 ? (
//                       filteredMarkets.map(market => (
//                         <div
//                           key={market.market_id}
//                           onClick={() => { setSelectedGame(market.market_name); setIsGameDropdownOpen(false); }}
//                           className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
//                         >
//                           {market.market_name}
//                         </div>
//                       ))
//                     ) : (
//                       <div className="px-4 py-2 text-gray-500">No markets found.</div>
//                     )}
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="session" className="block text-sm font-medium text-gray-600 mb-1">Session</label>
//                 <select
//                   id="session"
//                   value={selectedSession}
//                   onChange={(e) => setSelectedSession(e.target.value)}
//                   className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm"
//                 >
//                   <option value="Open">Open</option>
//                   <option value="Close">Close</option>
//                 </select>
//               </div>

//               <div>
//                 <label htmlFor="selectedPana" className="block text-sm font-medium text-gray-600 mb-1">{selectedSession} Pana</label>
//                 <input
//                   type="text"
//                   id="selectedPana"
//                   placeholder="Pana (e.g., 125)"
//                   value={selectedPana}
//                   onChange={e => setSelectedPana(e.target.value)}
//                   maxLength="3"
//                   className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
//                 />
//               </div>

//               <div>
//                 <label htmlFor="derivedDigit" className="block text-sm font-medium text-gray-600 mb-1">{selectedSession} Digit</label>
//                 <input
//                   type="text"
//                   id="derivedDigit"
//                   placeholder="Digit (auto)"
//                   value={derivedDigit}
//                   readOnly
//                   className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center space-x-3 pt-2">
//               <button
//                 onClick={handleShowWinners}
//                 disabled={isLoadingWinners || !selectedGame || !selectedSession || !selectedPana}
//                 className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 shadow-sm"
//               >
//                 {isLoadingWinners ? 'Loading...' : 'Show Winner'}
//               </button>
//               {showWinners && (
//                 <button
//                   onClick={handleFinalDeclare}
//                   disabled={isSubmitting || isLoadingWinners}
//                   className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300 shadow-sm"
//                 >
//                   {isSubmitting ? 'Declaring...' : 'DECLARE'}
//                 </button>
//               )}
//             </div>

//             {/* Potential Winners Table */}
//             {showWinners && (
//               <div className="pt-4 border-t border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-700 mb-4">Potential Winners</h3>
//                 <div className="flex space-x-8 mb-4 px-4">
//                   <div className="font-semibold text-gray-700">Total Bid Amount: <span className="text-blue-600">{totalBidAmount.toFixed(2)}</span></div>
//                   <div className="font-semibold text-gray-700">Total Winning Amount: <span className="text-green-600">{totalWinningAmount.toFixed(2)}</span></div>
//                 </div>

//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white border">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">#</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">User</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Game Type</th> {/* Added Game Type */}
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Bet Number</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Bid Amount</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Rate</th> {/* Added Rate */}
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Won Amount</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Action</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {potentialWinners.length > 0 ? (
//                         potentialWinners.map((winner, index) => (
//                           <tr key={winner.bet_id} className="hover:bg-gray-50">
//                             <td className="px-4 py-2 border-b">{index + 1}</td>
//                             <td className="px-4 py-2 border-b">
//                               <span className="font-medium">{winner.user_name || 'N/A'}</span>
//                               <br />
//                               <span className="text-gray-500 text-xs">{winner.mobile}</span>
//                             </td>
//                             <td className="px-4 py-2 border-b text-xs">{winner.game_name}</td> {/* Display Game Type */}
//                             <td className="px-4 py-2 border-b">
//                               <input
//                                 type="text"
//                                 value={winner.editable_number || winner.bet_number}
//                                 onChange={e => handleWinnerNumberChange(winner.bet_id, e.target.value)}
//                                 className="w-24 p-1 border border-gray-300 rounded-md text-center"
//                               />
//                             </td>
//                             <td className="px-4 py-2 border-b">
//                               <input
//                                 type="number"
//                                 value={winner.editable_bid_amount || winner.bid_points}
//                                 onChange={e => handleWinnerBetChange(winner.bet_id, e.target.value)}
//                                 className="w-24 p-1 border border-gray-300 rounded-md text-center"
//                               />
//                             </td>
//                             <td className="px-4 py-2 border-b">{(winner.rate || 0).toFixed(2)}</td> {/* Display Rate */}
//                             <td className="px-4 py-2 border-b font-medium text-green-600">{(winner.won_amount || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b">
//                               <button
//                                 onClick={() => handleDeleteWinner(winner.bet_id)}
//                                 className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
//                                 title="Remove this winner"
//                               >
//                                 <Trash2 size={16} />
//                               </button>
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="8" className="text-center py-4 text-gray-500"> {/* Updated colspan */}
//                             No potential winners found for this number and session.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Declared Results Section */}
//         <div className="bg-white rounded-lg shadow-md border border-gray-200 mt-6">
//           <div className="p-4 border-b">
//             <h2 className="text-lg font-semibold text-gray-700">Declared Results for {date}</h2>
//           </div>
//           {isLoadingDeclaredResults ? (
//             <div className="p-4 text-center text-gray-500">Loading declared results...</div>
//           ) : (
//             <div className="p-4 overflow-x-auto">
//               {declaredResults.length > 0 ? (
//                 <table className="min-w-full bg-white border">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Market Name</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Open Pana</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Open Digit</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Close Pana</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Close Digit</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Jodi</th>
//                       <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Publish Time</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {declaredResults.map(result => (
//                       <tr key={result.market_id} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 border-b">{result.market_name}</td>
//                         <td className="px-4 py-2 border-b">{result.result_open_pana || '-'}</td>
//                         <td className="px-4 py-2 border-b">{getDigitFromPana(result.result_open_pana) || '-'}</td> {/* Display Open Digit */}
//                         <td className="px-4 py-2 border-b">{result.result_closed_pana || '-'}</td>
//                         <td className="px-4 py-2 border-b">{getDigitFromPana(result.result_closed_pana) || '-'}</td> {/* Display Close Digit */}
//                         <td className="px-4 py-2 border-b font-semibold">
//                           {calculateJodi(result.result_open_pana, result.result_closed_pana)}
//                         </td>
//                         <td className="px-4 py-2 border-b text-xs">
//                           {result.publish_time ? new Date(result.publish_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <div className="text-center py-4 text-gray-500">No results declared for {date}.</div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeclareResultForm;


// 'use client';
// import React, { useState, useEffect, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import { ChevronDown, Trash2 } from 'lucide-react';

// const DeclareResultForm = () => {
//   const router = useRouter();
//   const [markets, setMarkets] = useState([]);
//   const [filteredMarkets, setFilteredMarkets] = useState([]);
//   const [selectedGame, setSelectedGame] = useState('');
//   const [selectedSession, setSelectedSession] = useState('Close');
//   const [selectedPana, setSelectedPana] = useState('');
//   const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
//   const [token, setToken] = useState('');
//   const [potentialWinners, setPotentialWinners] = useState([]);
//   const [showWinners, setShowWinners] = useState(false);
//   const [isLoadingWinners, setIsLoadingWinners] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
//   const [gameSearchTerm, setGameSearchTerm] = useState('');

//   const getDigitFromPana = (pana) => {
//     if (!pana || pana.length !== 3 || isNaN(pana)) return '';
//     const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
//     return String(sum % 10);
//   };
//   const derivedDigit = useMemo(() => getDigitFromPana(selectedPana), [selectedPana]);

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     if (storedToken) setToken(storedToken);
//     else router.push('/login');
//   }, [router]);

//   useEffect(() => {
//     const fetchMarkets = async () => {
//       if (!token) return;
//       try {
//         const response = await fetch('https://backend.gdmatka.site/api/market', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (response.status === 401) {
//           localStorage.removeItem('token');
//           router.push('/login');
//           return;
//         }
//         const data = await response.json();
//         const activeMarkets = data.filter(market => market.active_status === 'Active');
//         setMarkets(activeMarkets);
//         setFilteredMarkets(activeMarkets);
//       } catch (error) { console.error('Error fetching markets:', error); }
//     };
//     fetchMarkets();
//   }, [token, router]);

//   useEffect(() => {
//     const lowerSearch = gameSearchTerm.toLowerCase();
//     setFilteredMarkets(markets.filter(market => market.market_name.toLowerCase().includes(lowerSearch)));
//   }, [gameSearchTerm, markets]);

//   useEffect(() => {
//     setShowWinners(false);
//     setPotentialWinners([]);
//   }, [selectedGame, selectedSession, selectedPana, date]);

//   const handleShowWinners = async () => {
//     if (!selectedGame || !selectedSession || !selectedPana) {
//       alert('Please select Game, Session, and enter a Pana.');
//       return;
//     }
//     setIsLoadingWinners(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/get-potential-winners', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({
//           market_id: selectedMarket.market_id,
//           result_date: date,
//           session: selectedSession,
//           pana: selectedPana,
//         }),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.error || 'Failed to fetch winners.');
//       }
//       const data = await response.json();
//       setPotentialWinners(data);
//       setShowWinners(true);
//     } catch (error) {
//       alert(error.message);
//     } finally {
//       setIsLoadingWinners(false);
//     }
//   };

//   const handleWinnerNumberChange = (bet_id, newNumber) => {
//     setPotentialWinners(prev =>
//       prev.map(w => (w.bet_id === bet_id ? { ...w, editable_number: newNumber } : w))
//     );
//   };

//   const handleWinnerBetChange = (bet_id, newAmount) => {
//     setPotentialWinners(prev =>
//       prev.map(w => {
//         if (w.bet_id === bet_id) {
//           const updatedAmount = parseFloat(newAmount) || 0;
//           const updatedWonAmount = updatedAmount * w.rate;
//           return { ...w, editable_bid_amount: newAmount, won_amount: updatedWonAmount };
//         }
//         return w;
//       })
//     );
//   };

//   const handleDeleteWinner = (betIdToDelete) => {
//     if (window.confirm('Are you sure you want to remove this winner from the list?')) {
//       setPotentialWinners(prevWinners =>
//         prevWinners.filter(winner => winner.bet_id !== betIdToDelete)
//       );
//     }
//   };

//   const { totalBidAmount, totalWinningAmount } = useMemo(() => {
//     return potentialWinners.reduce((totals, winner) => {
//       const bidAmount = parseFloat(winner.editable_bid_amount || winner.points || 0);
//       const wonAmount = parseFloat(winner.won_amount || 0);
//       totals.totalBidAmount += bidAmount;
//       totals.totalWinningAmount += wonAmount;
//       return totals;
//     }, { totalBidAmount: 0, totalWinningAmount: 0 });
//   }, [potentialWinners]);

//   const handleFinalDeclare = async () => {
//     if (potentialWinners.length === 0) {
//       if (!window.confirm("There are no winners in the list. Do you still want to declare the result with zero winners?")) {
//         return;
//       }
//     }
//     setIsSubmitting(true);
//     const selectedMarket = markets.find(m => m.market_name === selectedGame);
//     const formData = {
//       market_id: selectedMarket.market_id,
//       result_date: date,
//       session: selectedSession,
//       pana: selectedPana,
//       winners: potentialWinners.map(({ bet_id, editable_bid_amount, points }) => ({
//         bet_id,
//         bid_amount: editable_bid_amount || points
//       })),
//     };
//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/declareresult-with-edits', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.error || 'Failed to declare result.');
//       }
//       alert('Result declared successfully!');
//       setShowWinners(false);
//       setPotentialWinners([]);
//       setSelectedPana('');
//     } catch (error) {
//       alert(error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="bg-white rounded-lg shadow-md border border-gray-200">
//           <div className="p-4 border-b">
//             <h2 className="text-lg font-semibold text-gray-700">Select Game</h2>
//           </div>

//           <div className="p-4 space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">Result Date</label>
//                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
//               </div>

//               <div className="relative">
//                 <label className="block text-sm font-medium text-gray-600 mb-1">Game Name</label>
//                 <button onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-md text-left flex justify-between items-center bg-white shadow-sm">
//                   {selectedGame || 'Select Game'}
//                   <ChevronDown className={`w-4 h-4 transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
//                 </button>
//                 {isGameDropdownOpen && (
//                   <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     <div className="p-2">
//                       <input type="text" placeholder="Search game..." value={gameSearchTerm} onChange={e => setGameSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
//                     </div>
//                     {filteredMarkets.map(market => (
//                       <div key={market.market_id} onClick={() => { setSelectedGame(market.market_name); setIsGameDropdownOpen(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
//                         {market.market_name}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">Session</label>
//                 <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm">
//                   <option value="Open">Open</option>
//                   <option value="Close">Close</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">{selectedSession} Pana</label>
//                 <input type="text" placeholder="Pana" value={selectedPana} onChange={e => setSelectedPana(e.target.value)} maxLength="3" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-600 mb-1">{selectedSession} Digit</label>
//                 <input type="text" placeholder="Digit" value={derivedDigit} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm" />
//               </div>
//             </div>

//             <div className="flex items-center space-x-3 pt-2">
//               <button onClick={handleShowWinners} disabled={isLoadingWinners} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 shadow-sm">
//                 {isLoadingWinners ? 'Loading...' : 'Show Winner'}
//               </button>
//               {showWinners && (
//                 <button onClick={handleFinalDeclare} disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300 shadow-sm">
//                   {isSubmitting ? 'Declaring...' : 'DECLARE'}
//                 </button>
//               )}
//             </div>

//             {showWinners && (
//               <div className="pt-4 border-t border-gray-200">
//                 <div className="flex space-x-8 mb-4 px-4">
//                   <div className="font-semibold text-gray-700">Total Bid Amount: <span className="text-blue-600">{totalBidAmount.toFixed(2)}</span></div>
//                   <div className="font-semibold text-gray-700">Total Winning Amount: <span className="text-green-600">{totalWinningAmount.toFixed(2)}</span></div>
//                 </div>

//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white border">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">#</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">User</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Bet Number</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Bid Amount</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Won Amount</th>
//                         <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600">Action</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {potentialWinners.length > 0 ? (
//                         potentialWinners.map((winner, index) => (
//                           <tr key={winner.bet_id} className="hover:bg-gray-50">
//                             <td className="px-4 py-2 border-b">{index + 1}</td>
//                             <td className="px-4 py-2 border-b">{winner.user_name || 'N/A'}</td>
//                             <td className="px-4 py-2 border-b">
//                               <input
//                                 type="text"
//                                 value={winner.editable_number || winner.first_number}
//                                 onChange={e => handleWinnerNumberChange(winner.bet_id, e.target.value)}
//                                 className="w-24 p-1 border border-gray-300 rounded-md"
//                               />
//                             </td>
//                             <td className="px-4 py-2 border-b">
//                               <input
//                                 type="number"
//                                 value={winner.editable_bid_amount || winner.points}
//                                 onChange={e => handleWinnerBetChange(winner.bet_id, e.target.value)}
//                                 className="w-24 p-1 border border-gray-300 rounded-md"
//                               />
//                             </td>
//                             <td className="px-4 py-2 border-b">{(winner.won_amount || 0).toFixed(2)}</td>
//                             <td className="px-4 py-2 border-b">
//                               <button
//                                 onClick={() => handleDeleteWinner(winner.bet_id)}
//                                 className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
//                                 title="Delete this winner"
//                               >
//                                 <Trash2 size={16} />
//                               </button>
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="6" className="text-center py-4 text-gray-500">
//                             No winners found for this number.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeclareResultForm;


// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   ChevronLeft,
//   Check,
//   ChevronDown,
//   Search,
//   Calendar,
//   PlusCircle,
//   Clock,
//   Sparkles,
//   Trophy,
//   Target,
// } from 'lucide-react';

// const DeclareResultForm = () => {
//   const router = useRouter();
//   const [markets, setMarkets] = useState([]);
//   const [filteredMarkets, setFilteredMarkets] = useState([]);
//   const [selectedGame, setSelectedGame] = useState('');
//   const [selectedSession, setSelectedSession] = useState('');
//   const [selectedPana, setSelectedPana] = useState('');
//   const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
//   const [token, setToken] = useState('');
//   const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
//   const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
//   const [isPanaDropdownOpen, setIsPanaDropdownOpen] = useState(false);
//   const [panaSearchTerm, setPanaSearchTerm] = useState('');
//   const [gameSearchTerm, setGameSearchTerm] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const PANA_NUMBERS = [
//     '127', '136', '145', '190', '235', '280', '370', '389', '460', '479', '569', '578',
//     '128', '137', '146', '236', '245', '290', '380', '470', '489', '560', '579', '678',
//     '129', '138', '147', '156', '237', '246', '345', '390', '480', '570', '589', '679',
//     '120', '139', '148', '157', '238', '247', '256', '346', '490', '580', '670', '689',
//     '130', '149', '158', '167', '239', '248', '257', '347', '356', '590', '680', '789',
//     '140', '159', '168', '230', '249', '258', '267', '348', '357', '456', '690', '780',
//     '123', '150', '169', '178', '240', '259', '268', '349', '358', '367', '457', '790',
//     '124', '160', '278', '179', '250', '269', '340', '359', '368', '458', '467', '890',
//     '125', '134', '170', '189', '260', '279', '350', '369', '468', '378', '459', '567',
//     '126', '135', '180', '234', '270', '289', '360', '379', '450', '469', '478', '568',
//     '118', '226', '244', '299', '334', '488', '550', '668', '677',
//     '100', '119', '155', '227', '335', '344', '399', '588', '669',
//     '110', '200', '228', '255', '336', '499', '660', '688', '778',
//     '166', '229', '300', '337', '355', '445', '599', '779', '788',
//     '112', '220', '266', '338', '400', '446', '455', '699', '770',
//     '113', '122', '177', '339', '366', '447', '500', '799', '889',
//     '600', '114', '277', '330', '448', '466', '556', '880', '899',
//     '115', '133', '188', '223', '377', '449', '557', '566', '700',
//     '116', '224', '233', '288', '440', '477', '558', '800', '990',
//     '117', '144', '199', '225', '388', '559', '577', '667', '900',
//     '000', '111', '222', '333', '444', '555', '666', '777', '888', '999',
//   ];

//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     if (!storedToken) {
//       router.push('/login');
//       return;
//     }
//     setToken(storedToken);
//   }, [router]);

//   useEffect(() => {
//     const fetchMarkets = async () => {
//       try {
//         const response = await fetch('https://backend.gdmatka.site/api/market', {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (response.status === 401) {
//           localStorage.removeItem('token');
//           router.push('/login');
//           return;
//         }

//         const data = await response.json();
//         const now = new Date();
//         const currentMinutes = now.getHours() * 60 + now.getMinutes();

//         const activeMarkets = data
//           .filter((market) => market.active_status === 'Active')
//           .filter((market) => {
//             if (!market.open_time) return true;
//             const [hours, minutes] = market.open_time.split(':').map(Number);
//             const marketMinutes = hours * 60 + minutes;
//             return currentMinutes < marketMinutes;
//           });

//         setMarkets(activeMarkets);
//         setFilteredMarkets(activeMarkets);
//       } catch (error) {
//         console.error('Error fetching markets:', error);
//       }
//     };

//     if (token) {
//       fetchMarkets();
//     }
//   }, [token, router]);

//   useEffect(() => {
//     const lowerSearch = gameSearchTerm.toLowerCase();
//     setFilteredMarkets(
//       markets.filter((market) =>
//         market.market_name.toLowerCase().includes(lowerSearch)
//       )
//     );
//   }, [gameSearchTerm, markets]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     if (!selectedGame || !selectedSession || !selectedPana || !date) {
//       alert('Please fill all required fields');
//       setIsSubmitting(false);
//       return;
//     }

//     const selectedMarket = markets.find((m) => m.market_name === selectedGame);
//     if (!selectedMarket) {
//       alert('Invalid game selection');
//       setIsSubmitting(false);
//       return;
//     }

//     const formData = {
//       market_id: selectedMarket.market_id,
//       result_date: date,
//       publish_time: new Date().toLocaleString('en-IN', {
//         timeZone: 'Asia/Kolkata',
//       }),
//     };

//     if (selectedSession === 'Open') {
//       formData.result_open_pana = selectedPana;
//     } else {
//       formData.result_closed_pana = selectedPana;
//     }

//     try {
//       const response = await fetch('https://backend.gdmatka.site/api/declareresult1', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       if (response.status === 401) {
//         localStorage.removeItem('token');
//         router.push('/');
//         return;
//       }

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to submit result');
//       }

//       alert(`${selectedSession} result declared successfully!`);
//       setSelectedPana('');
//       setSelectedSession('');
//       setSelectedGame('');
//       setDate(new Date().toISOString().split('T')[0]);
//     } catch (error) {
//       alert(error.message || 'Failed to declare result. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const filteredPanaNumbers = PANA_NUMBERS.filter((number) =>
//     number.includes(panaSearchTerm.trim())
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
//       {/* Animated background elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//       </div>

//       <div className="relative z-10 p-6">
//         <div className="max-w-2xl mx-auto">
//           {/* Header */}
//           <div className="flex items-center mb-8">
//             <button
//               onClick={() => router.push('/dashboard')}
//               className="group flex items-center text-gray-600 hover:text-indigo-600 transition-colors duration-200 mr-6"
//             >
//               <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:bg-indigo-50 mr-3">
//                 <ChevronLeft className="w-5 h-5" />
//               </div>
//               <span className="font-medium">Back</span>
//             </button>
//             <div className="flex items-center space-x-3">
//               <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
//                 <Trophy className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                   Declare Result
//                 </h1>
//                 <p className="text-gray-500 text-sm">Announce winning numbers</p>
//               </div>
//             </div>
//           </div>

//           {/* Main Form Card */}
//           <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
//             {/* Card Header */}
//             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
//               <div className="flex items-center space-x-3">
//                 <Sparkles className="w-6 h-6 text-white" />
//                 <h2 className="text-xl font-semibold text-white">Result Declaration Form</h2>
//               </div>
//               <p className="text-indigo-100 text-sm mt-2">Fill in the details to declare the winning result</p>
//             </div>

//             {/* Form Content */}
//             <div className="p-8">
//               <div className="space-y-8">
//                 {/* Date Picker */}
//                 <div className="group">
//                   <label className="block mb-3 text-gray-700 font-semibold flex items-center">
//                     <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
//                       <Calendar className="w-5 h-5 text-indigo-600" />
//                     </div>
//                     Select Date
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="date"
//                       value={date}
//                       onChange={(e) => setDate(e.target.value)}
//                       required
//                       className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm text-gray-800 font-medium"
//                     />
//                   </div>
//                 </div>

//                 {/* Game Dropdown */}
//                 <div className="group relative">
//                   <label className="block mb-3 text-gray-700 font-semibold flex items-center">
//                     <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
//                       <Target className="w-5 h-5 text-emerald-600" />
//                     </div>
//                     Select Game
//                   </label>
//                   <button
//                     type="button"
//                     className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-left flex justify-between items-center hover:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm group-hover:shadow-lg"
//                     onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
//                   >
//                     <span className={`${selectedGame ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
//                       {selectedGame || 'Choose Game'}
//                     </span>
//                     <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
//                   </button>
//                   {isGameDropdownOpen && (
//                     <div className="absolute z-30 bg-white/95 backdrop-blur-xl border border-gray-200 w-full mt-2 rounded-2xl shadow-2xl max-h-64 overflow-hidden">
//                       <div className="p-4 border-b border-gray-100">
//                         <div className="relative">
//                           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                           <input
//                             type="text"
//                             value={gameSearchTerm}
//                             onChange={(e) => setGameSearchTerm(e.target.value)}
//                             placeholder="Search game..."
//                             className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
//                           />
//                         </div>
//                       </div>
//                       <div className="max-h-48 overflow-y-auto">
//                         {filteredMarkets.map((market) => (
//                           <button
//                             key={market.market_id}
//                             onClick={() => {
//                               setSelectedGame(market.market_name);
//                               setIsGameDropdownOpen(false);
//                             }}
//                             className="block w-full px-6 py-3 text-left hover:bg-indigo-50 transition-colors duration-150 text-gray-700 font-medium"
//                           >
//                             {market.market_name}
//                           </button>
//                         ))}
//                         {filteredMarkets.length === 0 && (
//                           <div className="text-center text-gray-500 p-6">No games found</div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Session Selection */}
//                 <div className="group relative">
//                   <label className="block mb-3 text-gray-700 font-semibold flex items-center">
//                     <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
//                       <Clock className="w-5 h-5 text-orange-600" />
//                     </div>
//                     Select Session
//                   </label>
//                   <button
//                     type="button"
//                     className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-left flex justify-between items-center hover:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm group-hover:shadow-lg"
//                     onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
//                   >
//                     <span className={`${selectedSession ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
//                       {selectedSession ? `${selectedSession} Session` : 'Choose Session'}
//                     </span>
//                     <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
//                   </button>
//                   {isSessionDropdownOpen && (
//                     <div className="absolute z-30 bg-white/95 backdrop-blur-xl border border-gray-200 w-full mt-2 rounded-2xl shadow-2xl overflow-hidden">
//                       {['Open', 'Close'].map((session) => (
//                         <button
//                           key={session}
//                           onClick={() => {
//                             setSelectedSession(session);
//                             setIsSessionDropdownOpen(false);
//                           }}
//                           className="block w-full px-6 py-4 text-left hover:bg-indigo-50 transition-colors duration-150 text-gray-700 font-medium border-b border-gray-100 last:border-b-0"
//                         >
//                           <div className="flex items-center space-x-3">
//                             <div className={`w-3 h-3 rounded-full ${session === 'Open' ? 'bg-green-400' : 'bg-red-400'}`}></div>
//                             <span>{session} Session</span>
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* Pana Dropdown */}
//                 <div className="group relative">
//                   <label className="block mb-3 text-gray-700 font-semibold flex items-center">
//                     <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-200">
//                       <Search className="w-5 h-5 text-purple-600" />
//                     </div>
//                     Select Pana
//                   </label>
//                   <button
//                     type="button"
//                     className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl text-left flex justify-between items-center hover:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm group-hover:shadow-lg"
//                     onClick={() => setIsPanaDropdownOpen(!isPanaDropdownOpen)}
//                   >
//                     <span className={`${selectedPana ? 'text-gray-800 font-bold text-lg' : 'text-gray-400'}`}>
//                       {selectedPana || 'Choose Pana'}
//                     </span>
//                     <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isPanaDropdownOpen ? 'rotate-180' : ''}`} />
//                   </button>
//                   {isPanaDropdownOpen && (
//                     <div className="absolute z-30 bg-white/95 backdrop-blur-xl border border-gray-200 w-full mt-2 rounded-2xl shadow-2xl max-h-72 overflow-hidden">
//                       <div className="p-4 border-b border-gray-100">
//                         <div className="relative">
//                           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                           <input
//                             type="text"
//                             value={panaSearchTerm}
//                             onChange={(e) => setPanaSearchTerm(e.target.value)}
//                             placeholder="Search Pana..."
//                             className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
//                           />
//                         </div>
//                       </div>
//                       <div className="max-h-52 overflow-y-auto p-2">
//                         <div className="grid grid-cols-4 gap-2">
//                           {filteredPanaNumbers.map((number, index) => (
//                             <button
//                               key={index}
//                               onClick={() => {
//                                 setSelectedPana(number);
//                                 setIsPanaDropdownOpen(false);
//                                 setPanaSearchTerm('');
//                               }}
//                               className="px-3 py-2 text-center hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-150 text-gray-700 font-mono font-semibold rounded-lg border border-gray-100 hover:border-indigo-200"
//                             >
//                               {number}
//                             </button>
//                           ))}
//                         </div>
//                         {filteredPanaNumbers.length === 0 && (
//                           <div className="text-center text-gray-500 p-6">No Pana found</div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Submit Button */}
//                 <div className="pt-6">
//                   <button
//                     onClick={handleSubmit}
//                     disabled={isSubmitting}
//                     className={`w-full py-5 rounded-2xl flex items-center justify-center transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${isSubmitting
//                       ? 'bg-gray-400 cursor-not-allowed'
//                       : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
//                       }`}
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <Check className="mr-3 w-5 h-5" />
//                         Declare {selectedSession} Result
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeclareResultForm;

