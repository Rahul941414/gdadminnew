"use client";
import React, { useEffect, useState } from "react";
import { Check, X, DollarSign, Mail, Hash, ArrowLeft, Calendar, User, Filter, RefreshCw } from "lucide-react";
import { useRouter } from 'next/navigation';

const url = "https://backend.gdmatka.site";

const TransactionTable = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  async function fetchFunds() {
    const token = localStorage.getItem("token");
    setIsLoading(true);

    try {
      const response = await fetch(`${url}/funds`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const ans = await response.json();
      setAllTransactions(ans);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFunds();
  }, []);

  const makeReq = async (body) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${url}/funds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchFunds();
        alert("Transaction updated successfully");
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction");
    }
  };

  const handleAccept = (transaction) => {
    makeReq({ ...transaction, status: 'APPROVED' });
  };

  const handleDecline = (transaction) => {
    makeReq({ ...transaction, status: 'DECLINED' });
  };

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const formatAmount = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return 'N/A';
    return numAmount.toFixed(2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'DECLINED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <Check size={14} className="text-green-600" />;
      case 'DECLINED': return <X size={14} className="text-red-600" />;
      case 'PENDING': return <RefreshCw size={14} className="text-yellow-600" />;
      default: return null;
    }
  };

  // Filter transactions based on status and search term
  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesStatus = transaction.status === selectedStatus;
    const matchesSearch = transaction.transactionid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && (searchTerm === '' || matchesSearch);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
                <p className="text-gray-600 mt-1">Manage and review all financial transactions</p>
              </div>
            </div>
            
            <button
              onClick={fetchFunds}
              className="flex items-center px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 hover:text-blue-600"
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allTransactions.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Hash className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {allTransactions.filter(t => t.status === 'PENDING').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <RefreshCw className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {allTransactions.filter(t => t.status === 'APPROVED').length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Check className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Declined</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {allTransactions.filter(t => t.status === 'DECLINED').length}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <X className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {/* Status Filter */}
                <div className="relative">
                  <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="PENDING">Pending Transactions</option>
                    <option value="APPROVED">Approved Transactions</option>
                    <option value="DECLINED">Declined Transactions</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 min-w-[300px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Transaction ID or Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Showing {filteredTransactions.length} of {allTransactions.length} transactions
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw size={32} className="text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Hash size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm ? 'No transactions match your search criteria.' : `No ${selectedStatus.toLowerCase()} transactions at the moment.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Transaction Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    {selectedStatus === "PENDING" && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.transactionid}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center text-sm font-medium text-gray-900 mb-1">
                            <Hash size={16} className="mr-2 text-gray-400" />
                            {transaction.transactionid}
                          </div>
                          {transaction.date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar size={14} className="mr-1" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-lg font-bold text-gray-900">
                          <DollarSign size={18} className="text-green-600 mr-1" />
                          {formatAmount(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <User size={16} className="mr-2 text-gray-400" />
                          {transaction.email}
                        </div>
                        {transaction.username && (
                          <div className="text-xs text-gray-500 mt-1">{transaction.username}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </span>
                      </td>
                      {selectedStatus === "PENDING" && (
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAccept(transaction)}
                              className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 border border-green-200"
                            >
                              <Check size={16} className="mr-2" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(transaction)}
                              className="flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 border border-red-200"
                            >
                              <X size={16} className="mr-2" />
                              Decline
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>All transactions are securely processed and monitored in real-time</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;



// "use client";
// import React, { useEffect, useState } from "react";
// import { Check, X, DollarSign, Mail, Hash, ArrowLeft } from "lucide-react";
// import { useRouter } from 'next/navigation';

// const url = "https://backend.gdmatka.site";

// const TransactionTable = () => {
//   const [allTransactions, setAllTransactions] = useState([]);
//   const [selectedStatus, setSelectedStatus] = useState("PENDING");
//   const router = useRouter();

//   async function fetchFunds() {
//     const token = localStorage.getItem("token");

//     try {
//       const response = await fetch(`${url}/funds`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch transactions');
//       }

//       const ans = await response.json();
//       setAllTransactions(ans);
//     } catch (error) {
//       console.error("Error fetching transactions:", error);
//       alert("Failed to load transactions");
//     }
//   }

//   useEffect(() => {
//     fetchFunds();
//   }, []);

//   const makeReq = async (body) => {
//     const token = localStorage.getItem("token");

//     try {
//       const response = await fetch(`${url}/funds`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(body),
//       });

//       if (response.ok) {
//         fetchFunds(); // Refresh the list only after successful update
//         alert("Transaction updated successfully");
//       } else {
//         throw new Error('Failed to update transaction');
//       }
//     } catch (error) {
//       console.error("Error updating transaction:", error);
//       alert("Failed to update transaction");
//     }
//   };

//   const handleAccept = (transaction) => {
//     makeReq({ ...transaction, status: 'APPROVED' });
//   };

//   const handleDecline = (transaction) => {
//     makeReq({ ...transaction, status: 'DECLINED' });
//   };

//   const handleGoBack = () => {
//     router.push('/dashboard');
//   };

//   // Safe amount formatting function
//   const formatAmount = (amount) => {
//     // Convert to number if it's not already
//     const numAmount = Number(amount);

//     // Check if it's a valid number
//     if (isNaN(numAmount)) {
//       return 'N/A';
//     }

//     // Format to two decimal places
//     return numAmount.toFixed(2);
//   };

//   const filteredTransactions = allTransactions.filter(
//     (transaction) => transaction.status === selectedStatus
//   );

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="bg-white shadow-lg rounded-lg overflow-hidden">
//         <div className="flex justify-between items-center p-6 bg-gray-50 border-b">
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={handleGoBack}
//               className="text-gray-600 hover:text-gray-800 transition-colors"
//             >
//               <ArrowLeft size={24} />
//             </button>
//             <h2 className="text-xl font-semibold text-gray-800">
//               Transaction Management
//             </h2>
//           </div>
//           <select
//             value={selectedStatus}
//             onChange={(e) => setSelectedStatus(e.target.value)}
//             className="px-4 py-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="PENDING">PENDING</option>
//             <option value="APPROVED">APPROVED</option>
//             <option value="DECLINED">DECLINED</option>
//           </select>
//         </div>

//         {filteredTransactions.length === 0 ? (
//           <div className="p-6 text-center text-gray-500">
//             No {selectedStatus.toLowerCase()} transactions found.
//           </div>
//         ) : (
//           <table className="w-full">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <Hash className="inline-block mr-2" size={16} /> Transaction ID
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <DollarSign className="inline-block mr-2" size={16} /> Amount
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <Mail className="inline-block mr-2" size={16} /> Email
//                 </th>
//                 {selectedStatus === "PENDING" && (
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 )}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {filteredTransactions.map((transaction) => (
//                 <tr
//                   key={transaction.transactionid}
//                   className="hover:bg-gray-50 transition-colors"
//                 >
//                   <td className="px-6 py-4 text-sm font-mono text-gray-900">
//                     {transaction.transactionid}
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-900">
//                     ${formatAmount(transaction.amount)}
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-900">
//                     {transaction.email}
//                   </td>
//                   {selectedStatus === "PENDING" && (
//                     <td className="px-6 py-4 text-sm">
//                       <div className="flex space-x-2">
//                         <button
//                           onClick={() => handleAccept(transaction)}
//                           className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
//                         >
//                           <Check size={16} className="mr-1" /> Accept
//                         </button>
//                         <button
//                           onClick={() => handleDecline(transaction)}
//                           className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
//                         >
//                           <X size={16} className="mr-1" /> Decline
//                         </button>
//                       </div>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TransactionTable;