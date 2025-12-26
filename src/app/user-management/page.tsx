"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  MessageSquare,
  Phone,
  User,
  Mail,
  Calendar,
  IndianRupee,
  Shield,
  MoreVertical,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---- Types ----
interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  status: "active" | "inactive";
  wallet_balance: string | number;
  created_at?: string;
}

const UsersPage: React.FC = () => {
  const router = useRouter();

  // ---- State ----
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [token, setToken] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(20);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // ---- Effects ----
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  useEffect(() => {
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    setPaginatedUsers(filteredUsers.slice(start, end));
  }, [filteredUsers, currentPage, usersPerPage]);

  // ---- Helper Functions ----
  const formatPhoneNumberForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const openProfile = (id: string) => {
    router.push(`/user-management/${id}`);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://backend.gdmatka.site/api/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: User[] = await res.json();

      const sorted = data.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return Number(b.user_id) - Number(a.user_id);
      });

      setUsers(sorted);
      filterUsers(sorted, search, statusFilter);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((p) => ({ ...p, [userId]: !p[userId] }));
  };

  const filterUsers = (data: User[], searchTerm: string, status: string) => {
    const s = searchTerm.trim().toLowerCase();
    const filtered = data.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.phone_number.includes(searchTerm);
      const matchesStatus = status === "all" || u.status === status;
      return matchesSearch && matchesStatus;
    });
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearch(term);
    filterUsers(users, term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterUsers(users, search, status);
  };

  const handleDownloadUsers = () => {
    setDownloading(true);
    try {
      if (!filteredUsers.length) return;
      
      const headers = ["User ID", "Name", "Email", "Phone", "Status", "Wallet Balance", "Join Date"];
      const rows = filteredUsers.map(user => [
        user.user_id,
        user.full_name,
        user.email,
        user.phone_number,
        user.status,
        user.wallet_balance,
        user.created_at ? formatDate(user.created_at) : "N/A"
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error downloading CSV:", e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);

  // Statistics
  const activeUsers = users.filter(u => u.status === "active").length;
  const inactiveUsers = users.filter(u => u.status === "inactive").length;
  const totalBalance = users.reduce((sum, user) => sum + Number(user.wallet_balance || 0), 0);

  // ---- Loading States ----
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <Shield className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="animate-spin text-blue-600 h-12 w-12" />
          <p className="text-xl font-semibold text-gray-700">Loading Users...</p>
          <p className="text-gray-500">Please wait while we fetch user data</p>
        </div>
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
                  onClick={() => router.back()}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold text-white">Users Management</CardTitle>
                  <p className="text-blue-100 mt-1">Manage and monitor all user accounts</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleDownloadUsers}
                  disabled={downloading || !filteredUsers.length}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "Exporting..." : "Export CSV"}
                </Button>
                <Button
                  onClick={fetchUsers}
                  variant="secondary"
                  size="icon"
                  className="bg-white/20 hover:bg-white/30"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-emerald-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Active Users</p>
                  <p className="text-3xl font-bold">{activeUsers}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-cyan-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Balance</p>
                  <p className="text-3xl font-bold">₹{totalBalance.toFixed(2)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-red-500 to-pink-600">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Inactive Users</p>
                  <p className="text-3xl font-bold">{inactiveUsers}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-10 h-11"
                />
              </div>
              <Select onValueChange={handleStatusFilter} value={statusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-11">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Results Info */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </span>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    filterUsers(users, "", statusFilter);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900">User</TableHead>
                    <TableHead className="font-semibold text-gray-900">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-900">Password</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Balance</TableHead>
                    <TableHead className="font-semibold text-gray-900">Join Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => {
                      const message = `Hello ${user.full_name}, I am from GD Matka. Aapko game me koi problem hai kya?`;
                      const encodedMessage = encodeURIComponent(message);
                      
                      return (
                        <TableRow 
                          key={user.user_id}
                          className="hover:bg-gray-50 transition-colors border-b"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <Button
                                  variant="link"
                                  onClick={() => openProfile(user.user_id)}
                                  className="p-0 h-auto font-semibold text-gray-900 hover:text-blue-600"
                                >
                                  {user.full_name}
                                </Button>
                                <div className="text-xs text-gray-500">ID: {user.user_id}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{user.phone_number}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm">
                                {showPasswords[user.user_id] ? user.password : "••••••••"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility(user.user_id)}
                                className="h-6 w-6"
                              >
                                {showPasswords[user.user_id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge 
                              variant={user.status === "active" ? "default" : "secondary"}
                              className={
                                user.status === "active" 
                                  ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <IndianRupee className="h-3 w-3 text-green-600" />
                              <span className="font-bold text-green-600">
                                {Number(user.wallet_balance || 0).toFixed(2)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(user.created_at)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                              >
                                <a
                                  href={`https://wa.me/${formatPhoneNumberForWhatsApp(user.phone_number)}?text=${encodedMessage}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              >
                                <a href={`tel:${user.phone_number}`} title="Call">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} • {filteredUsers.length} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm font-medium">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UsersPage;


// "use client";
// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import {
//   Eye,
//   EyeOff,
//   ArrowLeft,
//   RefreshCw,
//   Download,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   Search,
//   MessageSquare, // WhatsApp आइकॉन
//   Phone,          // Call आइकॉन
// } from "lucide-react";

// // ---- Types ----
// interface User {
//   user_id: string;
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   status: "active" | "inactive";
//   wallet_balance: string | number;
//   created_at?: string;
// }

// // WhatsApp लिंक के लिए फ़ोन नंबर को फॉर्मेट करने वाला हेल्पर फंक्शन
// const formatPhoneNumberForWhatsApp = (phone: string) => {
//   const cleaned = phone.replace(/\D/g, ""); // नंबर के अलावा सब कुछ हटा दें
//   if (cleaned.length === 10) {
//     return `91${cleaned}`; // 10 अंकों के नंबर के आगे 91 लगा दें
//   }
//   return cleaned; // अगर पहले से सही फॉर्मेट में है तो वैसे ही रहने दें
// };

// const UsersPage: React.FC = () => {
//   const router = useRouter();

//   // ---- State ----
//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
//   const [search, setSearch] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(true);
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [token, setToken] = useState<string | null>(null);
//   const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
//   const [downloading, setDownloading] = useState<boolean>(false);

//   // Pagination
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [usersPerPage] = useState<number>(25);
//   const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

//   // ---- Effects ----
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   useEffect(() => {
//     if (token) fetchUsers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token]);

//   useEffect(() => {
//     const start = (currentPage - 1) * usersPerPage;
//     const end = start + usersPerPage;
//     setPaginatedUsers(filteredUsers.slice(start, end));
//   }, [filteredUsers, currentPage, usersPerPage]);

//   // ---- Helpers ----
//   const openProfile = (id: string) => {
//     router.push(`/user-management/${id}`);
//   };

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("https://backend.gdmatka.site/api/users", {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       });
//       if (!res.ok) throw new Error("Failed to fetch users");
//       const data: User[] = await res.json();

//       const sorted = data.sort((a, b) => {
//         if (a.created_at && b.created_at) {
//           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
//         }
//         return Number(b.user_id) - Number(a.user_id);
//       });

//       setUsers(sorted);
//       filterUsers(sorted, search, statusFilter);
//     } catch (e) {
//       console.error("Error fetching users:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const togglePasswordVisibility = (userId: string) => {
//     setShowPasswords((p) => ({ ...p, [userId]: !p[userId] }));
//   };

//   const filterUsers = (data: User[], searchTerm: string, status: string) => {
//     const s = searchTerm.trim().toLowerCase();
//     const filtered = data.filter((u) => {
//       const matchesSearch =
//         u.full_name.toLowerCase().includes(s) ||
//         u.email.toLowerCase().includes(s) ||
//         u.phone_number.includes(searchTerm);
//       const matchesStatus = status === "all" || u.status === status;
//       return matchesSearch && matchesStatus;
//     });
//     setFilteredUsers(filtered);
//     setCurrentPage(1);
//   };

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const term = e.target.value;
//     setSearch(term);
//     filterUsers(users, term, statusFilter);
//   };

//   const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const status = e.target.value;
//     setStatusFilter(status);
//     filterUsers(users, search, status);
//   };

//   const handleDownloadUsers = () => {
//     setDownloading(true);
//     try {
//       if (!filteredUsers.length) return;
//       const header = "Phone Number";
//       const rows = filteredUsers.map((u) => u.phone_number);
//       const csv = [header, ...rows].join("\n");

//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.setAttribute(
//         "download",
//         `user_phone_numbers_${new Date().toISOString().split("T")[0]}.csv`
//       );
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (e) {
//       console.error("Error downloading CSV:", e);
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handlePrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
//   const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);

//   // ---- Guards ----
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gray-100">
//         <div className="text-center rounded-lg bg-white p-8 shadow-md">
//           <h2 className="mb-2 text-2xl font-bold">Authentication Required</h2>
//           <p>Please log in to view this page.</p>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gray-100">
//         <div className="flex flex-col items-center">
//           <RefreshCw className="animate-spin text-blue-600" size={48} />
//           <p className="mt-4 text-lg font-semibold">Loading Users...</p>
//         </div>
//       </div>
//     );
//   }

//   // ---- UI ----
//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
//       <div className="mx-auto max-w-7xl">
//         {/* Header */}
//         <header className="mb-6">
//           <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => router.back()}
//                 className="rounded-full p-2 transition hover:bg-gray-200"
//                 title="Back"
//               >
//                 <ArrowLeft size={24} />
//               </button>
//               <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handleDownloadUsers}
//                 disabled={downloading || !filteredUsers.length}
//                 className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
//                 title="Export phone numbers (CSV)"
//               >
//                 <Download size={18} />
//                 <span>{downloading ? "Downloading..." : "Export CSV"}</span>
//               </button>
//               <button
//                 onClick={fetchUsers}
//                 className="rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700"
//                 title="Refresh"
//               >
//                 <RefreshCw size={20} />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Filters */}
//         <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//             <div className="relative md:col-span-2">
//               <Search
//                 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                 size={20}
//               />
//               <input
//                 type="text"
//                 value={search}
//                 onChange={handleSearch}
//                 placeholder="Search by name, email, or phone..."
//                 className="w-full rounded-lg border px-10 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div className="relative">
//               <Filter
//                 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                 size={16}
//               />
//               <select
//                 value={statusFilter}
//                 onChange={handleStatusFilter}
//                 className="w-full appearance-none rounded-lg border bg-white px-10 py-2 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="all">All Statuses</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//               <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
//                 ▾
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Users Table */}
//         <div className="overflow-hidden rounded-xl bg-white shadow-sm">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left text-sm text-gray-600">
//               <thead className="bg-gray-100 text-xs uppercase text-gray-700">
//                 <tr>
//                   {["User", "Contact", "Password", "Status", "Points", "Actions"].map((h) => (
//                     <th key={h} className="px-6 py-3">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedUsers.length ? (
//                   paginatedUsers.map((user) => {
//                     // व्हाट्सएप के लिए मैसेज बनाएँ और एनकोड करें
//                     const message = `Hello ${user.full_name}, I am from GD Matka. Aapko game me koi problem hai kya?`;
//                     const encodedMessage = encodeURIComponent(message);
                    
//                     return (
//                       <tr
//                         key={user.user_id}
//                         className="border-b bg-white transition hover:bg-gray-50"
//                       >
//                         {/* USER (clickable name) */}
//                         <td className="px-6 py-4">
//                           <button
//                             onClick={() => openProfile(user.user_id)}
//                             className="font-bold text-gray-900 underline-offset-2 hover:text-blue-600 hover:underline"
//                             title="Open profile"
//                           >
//                             {user.full_name}
//                           </button>
//                           <div className="text-xs text-gray-500">ID: {user.user_id}</div>
//                         </td>

//                         {/* CONTACT */}
//                         <td className="px-6 py-4">
//                           <div>{user.email}</div>
//                           <div className="text-xs">{user.phone_number}</div>
//                         </td>

//                         {/* PASSWORD (toggle visibility) */}
//                         <td className="px-6 py-4">
//                           <div className="flex items-center space-x-2">
//                             <span>
//                               {showPasswords[user.user_id] ? user.password : "••••••••"}
//                             </span>
//                             <button
//                               onClick={() => togglePasswordVisibility(user.user_id)}
//                               className="rounded-full p-1 hover:bg-gray-200"
//                               title={showPasswords[user.user_id] ? "Hide" : "Show"}
//                             >
//                               {showPasswords[user.user_id] ? (
//                                 <EyeOff size={16} />
//                               ) : (
//                                 <Eye size={16} />
//                               )}
//                             </button>
//                           </div>
//                         </td>

//                         {/* STATUS */}
//                         <td className="px-6 py-4">
//                           <span
//                             className={`rounded-full px-2 py-1 text-xs font-medium ${
//                               user.status === "active"
//                                 ? "bg-green-100 text-green-800"
//                                 : "bg-red-100 text-red-800"
//                             }`}
//                           >
//                             {user.status}
//                           </span>
//                         </td>

//                         {/* POINTS */}
//                         <td className="px-6 py-4 font-bold text-blue-600">
//                           ₹{Number(user.wallet_balance || 0).toFixed(2)}
//                         </td>

//                         {/* Actions */}
//                         <td className="px-6 py-4">
//                           <div className="flex items-center space-x-2">
//                             {/* WhatsApp Button */}
//                             <a
//                               href={`https://wa.me/${formatPhoneNumberForWhatsApp(
//                                 user.phone_number
//                               )}?text=${encodedMessage}`}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="rounded-full p-2 text-green-600 transition hover:bg-green-100"
//                               title="Send WhatsApp Message"
//                             >
//                               <MessageSquare size={18} />
//                             </a>
//                             {/* Call Button */}
//                             <a
//                               href={`tel:${user.phone_number}`}
//                               className="rounded-full p-2 text-blue-600 transition hover:bg-blue-100"
//                               title="Call User"
//                             >
//                               <Phone size={18} />
//                             </a>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })
//                 ) : (
//                   <tr>
//                     <td colSpan={6} className="py-12 text-center">
//                       <h3 className="text-lg font-medium">No Users Found</h3>
//                       <p className="text-sm text-gray-500">
//                         Try adjusting your search or filters.
//                       </p>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="mt-6 flex items-center justify-between">
//             <div className="text-sm text-gray-700">
//               Page {currentPage} of {totalPages}
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handlePrevPage}
//                 disabled={currentPage === 1}
//                 className="rounded-lg p-2 transition hover:bg-gray-200 disabled:opacity-50"
//                 title="Previous"
//               >
//                 <ChevronLeft size={20} />
//               </button>
//               <span className="text-sm font-medium">
//                 {(currentPage - 1) * usersPerPage + 1} -{" "}
//                 {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{" "}
//                 {filteredUsers.length}
//               </span>
//               <button
//                 onClick={handleNextPage}
//                 disabled={currentPage === totalPages}
//                 className="rounded-lg p-2 transition hover:bg-gray-200 disabled:opacity-50"
//                 title="Next"
//               >
//                 <ChevronRight size={20} />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UsersPage;

// "use client";
// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import {
//   Eye,
//   EyeOff,
//   ArrowLeft,
//   RefreshCw,
//   Download,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   Search,
// } from "lucide-react";

// // ---- Types ----
// interface User {
//   user_id: string;
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   status: "active" | "inactive";
//   wallet_balance: string | number;
//   created_at?: string;
// }

// const UsersPage: React.FC = () => {
//   const router = useRouter();

//   // ---- State ----
//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
//   const [search, setSearch] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(true);
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [token, setToken] = useState<string | null>(null);
//   const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
//   const [downloading, setDownloading] = useState<boolean>(false);

//   // Pagination
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [usersPerPage] = useState<number>(25);
//   const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

//   // ---- Effects ----
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   useEffect(() => {
//     if (token) fetchUsers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token]);

//   useEffect(() => {
//     const start = (currentPage - 1) * usersPerPage;
//     const end = start + usersPerPage;
//     setPaginatedUsers(filteredUsers.slice(start, end));
//   }, [filteredUsers, currentPage, usersPerPage]);

//   // ---- Helpers ----
//   const openProfile = (id: string) => {
//     router.push(`/user-management/${id}`);
//   };

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("https://backend.gdmatka.site/api/users", {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       });
//       if (!res.ok) throw new Error("Failed to fetch users");
//       const data: User[] = await res.json();

//       // Sort new users first (by created_at if available else by user_id desc)
//       const sorted = data.sort((a, b) => {
//         if (a.created_at && b.created_at) {
//           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
//         }
//         return Number(b.user_id) - Number(a.user_id);
//       });

//       setUsers(sorted);
//       filterUsers(sorted, search, statusFilter);
//     } catch (e) {
//       console.error("Error fetching users:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const togglePasswordVisibility = (userId: string) => {
//     setShowPasswords((p) => ({ ...p, [userId]: !p[userId] }));
//   };

//   const filterUsers = (data: User[], searchTerm: string, status: string) => {
//     const s = searchTerm.trim().toLowerCase();
//     const filtered = data.filter((u) => {
//       const matchesSearch =
//         u.full_name.toLowerCase().includes(s) ||
//         u.email.toLowerCase().includes(s) ||
//         u.phone_number.includes(searchTerm);
//       const matchesStatus = status === "all" || u.status === status;
//       return matchesSearch && matchesStatus;
//     });
//     setFilteredUsers(filtered);
//     setCurrentPage(1);
//   };

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const term = e.target.value;
//     setSearch(term);
//     filterUsers(users, term, statusFilter);
//   };

//   const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const status = e.target.value;
//     setStatusFilter(status);
//     filterUsers(users, search, status);
//   };

//   const handleDownloadUsers = () => {
//     setDownloading(true);
//     try {
//       if (!filteredUsers.length) return;
//       const header = "Phone Number";
//       const rows = filteredUsers.map((u) => u.phone_number);
//       const csv = [header, ...rows].join("\n");

//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.setAttribute(
//         "download",
//         `user_phone_numbers_${new Date().toISOString().split("T")[0]}.csv`
//       );
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (e) {
//       console.error("Error downloading CSV:", e);
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handlePrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
//   const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);

//   // ---- Guards ----
//   if (!token) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gray-100">
//         <div className="text-center rounded-lg bg-white p-8 shadow-md">
//           <h2 className="mb-2 text-2xl font-bold">Authentication Required</h2>
//           <p>Please log in to view this page.</p>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gray-100">
//         <div className="flex flex-col items-center">
//           <RefreshCw className="animate-spin text-blue-600" size={48} />
//           <p className="mt-4 text-lg font-semibold">Loading Users...</p>
//         </div>
//       </div>
//     );
//   }

//   // ---- UI ----
//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
//       <div className="mx-auto max-w-7xl">
//         {/* Header */}
//         <header className="mb-6">
//           <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => router.back()}
//                 className="rounded-full p-2 transition hover:bg-gray-200"
//                 title="Back"
//               >
//                 <ArrowLeft size={24} />
//               </button>
//               <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handleDownloadUsers}
//                 disabled={downloading || !filteredUsers.length}
//                 className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
//                 title="Export phone numbers (CSV)"
//               >
//                 <Download size={18} />
//                 <span>{downloading ? "Downloading..." : "Export CSV"}</span>
//               </button>
//               <button
//                 onClick={fetchUsers}
//                 className="rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700"
//                 title="Refresh"
//               >
//                 <RefreshCw size={20} />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Filters */}
//         <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//             <div className="relative md:col-span-2">
//               <Search
//                 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                 size={20}
//               />
//               <input
//                 type="text"
//                 value={search}
//                 onChange={handleSearch}
//                 placeholder="Search by name, email, or phone..."
//                 className="w-full rounded-lg border px-10 py-2 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div className="relative">
//               <Filter
//                 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                 size={16}
//               />
//               <select
//                 value={statusFilter}
//                 onChange={handleStatusFilter}
//                 className="w-full appearance-none rounded-lg border bg-white px-10 py-2 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="all">All Statuses</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//               {/* caret */}
//               <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
//                 ▾
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Users Table */}
//         <div className="overflow-hidden rounded-xl bg-white shadow-sm">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left text-sm text-gray-600">
//               <thead className="bg-gray-100 text-xs uppercase text-gray-700">
//                 <tr>
//                   {["User", "Contact", "Password", "Status", "Points"].map((h) => (
//                     <th key={h} className="px-6 py-3">
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedUsers.length ? (
//                   paginatedUsers.map((user) => (
//                     <tr
//                       key={user.user_id}
//                       className="border-b bg-white transition hover:bg-gray-50"
//                     >
//                       {/* USER (clickable name) */}
//                       <td className="px-6 py-4">
//                         {/* Option 1: Button with router.push */}
//                         <button
//                           onClick={() => openProfile(user.user_id)}
//                           className="font-bold text-gray-900 underline-offset-2 hover:text-blue-600 hover:underline"
//                           title="Open profile"
//                         >
//                           {user.full_name}
//                         </button>
//                         <div className="text-xs text-gray-500">ID: {user.user_id}</div>

//                         {/* Option 2: If you prefer a link: 
//                         <Link
//                           href={`/user-management/${user.user_id}`}
//                           className="font-bold text-gray-900 underline-offset-2 hover:text-blue-600 hover:underline"
//                         >
//                           {user.full_name}
//                         </Link>
//                         */}
//                       </td>

//                       {/* CONTACT */}
//                       <td className="px-6 py-4">
//                         <div>{user.email}</div>
//                         <div className="text-xs">{user.phone_number}</div>
//                       </td>

//                       {/* PASSWORD (toggle visibility) */}
//                       <td className="px-6 py-4">
//                         <div className="flex items-center space-x-2">
//                           <span>
//                             {showPasswords[user.user_id] ? user.password : "••••••••"}
//                           </span>
//                           <button
//                             onClick={() => togglePasswordVisibility(user.user_id)}
//                             className="rounded-full p-1 hover:bg-gray-200"
//                             title={showPasswords[user.user_id] ? "Hide" : "Show"}
//                           >
//                             {showPasswords[user.user_id] ? (
//                               <EyeOff size={16} />
//                             ) : (
//                               <Eye size={16} />
//                             )}
//                           </button>
//                         </div>
//                       </td>

//                       {/* STATUS */}
//                       <td className="px-6 py-4">
//                         <span
//                           className={`rounded-full px-2 py-1 text-xs font-medium ${
//                             user.status === "active"
//                               ? "bg-green-100 text-green-800"
//                               : "bg-red-100 text-red-800"
//                           }`}
//                         >
//                           {user.status}
//                         </span>
//                       </td>

//                       {/* POINTS */}
//                       <td className="px-6 py-4 font-bold text-blue-600">
//                         ₹{Number(user.wallet_balance || 0).toFixed(2)}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={5} className="py-12 text-center">
//                       <h3 className="text-lg font-medium">No Users Found</h3>
//                       <p className="text-sm text-gray-500">
//                         Try adjusting your search or filters.
//                       </p>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="mt-6 flex items-center justify-between">
//             <div className="text-sm text-gray-700">
//               Page {currentPage} of {totalPages}
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={handlePrevPage}
//                 disabled={currentPage === 1}
//                 className="rounded-lg p-2 transition hover:bg-gray-200 disabled:opacity-50"
//                 title="Previous"
//               >
//                 <ChevronLeft size={20} />
//               </button>
//               <span className="text-sm font-medium">
//                 {(currentPage - 1) * usersPerPage + 1} -{" "}
//                 {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{" "}
//                 {filteredUsers.length}
//               </span>
//               <button
//                 onClick={handleNextPage}
//                 disabled={currentPage === totalPages}
//                 className="rounded-lg p-2 transition hover:bg-gray-200 disabled:opacity-50"
//                 title="Next"
//               >
//                 <ChevronRight size={20} />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UsersPage;


// "use client";
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation'; // SUGGESTION: Use Next.js router for better navigation
// import { Eye, EyeOff, ArrowLeft, RefreshCw, Trash2, Download, ChevronLeft, ChevronRight, Filter, Search, UserCheck, UserX, MoreVertical } from 'lucide-react';

// // Define the structure for a user object
// interface User {
//   user_id: string;
//   full_name: string;
//   email: string;
//   phone_number: string;
//   password: string;
//   status: 'active' | 'inactive';
//   wallet_balance: string | number;
//   created_at?: string; // Kept optional as in original code
// }

// const UsersPage: React.FC = () => {
//   const router = useRouter(); // SUGGESTION: Initialize router

//   // State management
//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
//   const [search, setSearch] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(true);
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [token, setToken] = useState<string | null>(null);
//   const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
//   const [deletingUser, setDeletingUser] = useState<string | null>(null);

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [usersPerPage] = useState<number>(25);

//   // Download state
//   const [downloading, setDownloading] = useState<boolean>(false);

//   // Effect to retrieve token
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   // Effect to fetch users
//   useEffect(() => {
//     if (token) {
//       fetchUsers();
//     }
//   }, [token]);

//   // Effect for pagination
//   useEffect(() => {
//     const startIndex = (currentPage - 1) * usersPerPage;
//     const endIndex = startIndex + usersPerPage;
//     setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
//   }, [filteredUsers, currentPage, usersPerPage]);

//   // Fetches users from the API
//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/users", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error('Failed to fetch users');
//       const data = await response.json();
//       const sortedData = data.sort((a: User, b: User) => {
//         if (a.created_at && b.created_at) {
//           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
//         }
//         return parseInt(b.user_id) - parseInt(a.user_id); // Fallback sort
//       });
//       setUsers(sortedData);
//       filterUsers(sortedData, search, statusFilter);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Toggles password visibility
//   const togglePasswordVisibility = (userId: string) => {
//     setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
//   };

//   // Handles changing a user's status (active/inactive)
//   const handleStatusChange = async (userId: string, currentStatus: string) => {
//     if (!token) return;
//     const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
//     try {
//       // SUGGESTION: Using a more RESTful endpoint
//       const response = await fetch(`https://backend.gdmatka.site/api/users/${userId}/status`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ status: newStatus }),
//       });
//       if (!response.ok) throw new Error('Failed to update status');
//       const updatedUsers = users.map(user =>
//         user.user_id === userId ? { ...user, status: newStatus } : user
//       );
//       setUsers(updatedUsers);
//       filterUsers(updatedUsers, search, statusFilter);
//     } catch (error) {
//       console.error('Error updating status:', error);
//     }
//   };

//   // Handles the deletion of a user
//   const handleDeleteUser = async (userId: string, userName: string) => {
//     if (!token) return;
//     const confirmDelete = window.confirm(`Are you sure you want to delete user "${userName}"?`);
//     if (!confirmDelete) return;
//     setDeletingUser(userId);
//     try {
//       // FIX: Corrected the DELETE request to be RESTful
//       const response = await fetch(`https://backend.gdmatka.site/api/users/${userId}`, {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         // No body or Content-Type needed for this DELETE request
//       });

//       // FIX: Handle 404 Not Found specifically, as discussed
//       if (response.status === 404) {
//         alert('User not found. They may have already been deleted.');
//         throw new Error('User not found');
//       }

//       if (!response.ok) throw new Error('Failed to delete user');

//       const updatedUsers = users.filter(user => user.user_id !== userId);
//       setUsers(updatedUsers);
//       filterUsers(updatedUsers, search, statusFilter);
//       if (paginatedUsers.length === 1 && currentPage > 1) {
//         setCurrentPage(currentPage - 1);
//       }
//     } catch (error) {
//       console.error('Error deleting user:', error);
//     } finally {
//       setDeletingUser(null);
//     }
//   };

//   // Filters users based on search term and status
//   const filterUsers = (userData: User[], searchTerm: string, status: string) => {
//     let filtered = userData.filter(user =>
//       (user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.phone_number.includes(searchTerm)) &&
//       (status === "all" || user.status === status)
//     );
//     setFilteredUsers(filtered);
//     setCurrentPage(1); // Reset to first page on new filter
//   };

//   const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const term = event.target.value;
//     setSearch(term);
//     filterUsers(users, term, statusFilter);
//   };

//   const handleStatusFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     const status = event.target.value;
//     setStatusFilter(status);
//     filterUsers(users, search, status);
//   };

//   // Prepares and triggers a download of the filtered user data as a CSV file
//   const handleDownloadUsers = () => {
//     setDownloading(true);
//     try {
//       if (filteredUsers.length === 0) return;
//       const csvData = filteredUsers.map(user => ({
//         'User ID': user.user_id, 'Full Name': user.full_name, 'Email': user.email,
//         'Phone Number': user.phone_number, 'Status': user.status,
//         'Wallet Balance': Number(user.wallet_balance || 0).toFixed(2),
//       }));
//       const headers = Object.keys(csvData[0]);
//       const csvContent = [
//         headers.join(','),
//         ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
//       ].join('\n');
//       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//       const link = document.createElement('a');
//       link.href = URL.createObjectURL(blob);
//       link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (error) {
//       console.error('Error downloading users:', error);
//     } finally {
//       setDownloading(false);
//     }
//   };

//   // SUGGESTION: Using router for navigation
//   const handleViewUserDetails = (userId: string) => router.push(`/user-management/${userId}`);
//   const handleGoBack = () => router.push('/dashboard');
//   const handleRefresh = () => fetchUsers();

//   // Pagination logic
//   const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
//   const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
//   const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

//   // Conditional rendering for authentication and loading states
//   if (!token) return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="text-center p-8 bg-white rounded-lg shadow-md">
//         <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
//         <p>Please log in to view this page.</p>
//       </div>
//     </div>
//   );

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="flex flex-col items-center">
//         <RefreshCw className="animate-spin text-blue-600" size={48} />
//         <p className="mt-4 text-lg font-semibold">Loading Users...</p>
//       </div>
//     </div>
//   );

//   // Main component render
//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
//       <div className="max-w-7xl mx-auto">
//         <header className="mb-6">
//           <div className="flex flex-col sm:flex-row justify-between items-center">
//             <div className="flex items-center space-x-4">
//               <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-gray-200 transition">
//                 <ArrowLeft size={24} />
//               </button>
//               <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
//             </div>
//             <div className="flex items-center space-x-2 mt-4 sm:mt-0">
//               <button onClick={handleDownloadUsers} disabled={downloading || !filteredUsers.length} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
//                 <Download size={18} />
//                 <span>{downloading ? 'Downloading...' : 'Export CSV'}</span>
//               </button>
//               <button onClick={handleRefresh} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
//                 <RefreshCw size={20} />
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Filter and Search Controls */}
//         <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="relative md:col-span-2">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//               <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Search by name, email, or phone..." value={search} onChange={handleSearch} />
//             </div>
//             <div className="relative">
//               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
//               <select className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white" value={statusFilter} onChange={handleStatusFilter}>
//                 <option value="all">All Statuses</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Users Table */}
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left text-gray-600">
//               <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
//                 <tr>
//                   {['User', 'Contact', 'Password', 'Status', 'Points', 'Actions'].map(h => (
//                     <th key={h} scope="col" className="px-6 py-3">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
//                   <tr key={user.user_id} className="bg-white border-b hover:bg-gray-50">
//                     <td className="px-6 py-4">
//                       <div className="font-bold text-gray-900">{user.full_name}</div>
//                       <div className="text-xs text-gray-500">ID: {user.user_id}</div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div>{user.email}</div>
//                       <div className="text-xs">{user.phone_number}</div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center space-x-2">
//                         <span>{showPasswords[user.user_id] ? user.password : '••••••••'}</span>
//                         <button onClick={() => togglePasswordVisibility(user.user_id)} className="p-1 hover:bg-gray-200 rounded-full">
//                           {showPasswords[user.user_id] ? <EyeOff size={16} /> : <Eye size={16} />}
//                         </button>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                         {user.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 font-bold text-blue-600">
//                       ₹{Number(user.wallet_balance || 0).toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center space-x-1">
//                         <button onClick={() => handleStatusChange(user.user_id, user.status)} title={user.status === 'active' ? 'Deactivate' : 'Activate'} className={`p-2 rounded-lg transition ${user.status === 'active' ? 'text-orange-500 hover:bg-orange-100' : 'text-green-500 hover:bg-green-100'}`}>
//                           {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
//                         </button>
//                         <button onClick={() => handleViewUserDetails(user.user_id)} title="View Details" className="p-2 text-blue-500 rounded-lg hover:bg-blue-100 transition">
//                           <MoreVertical size={18} />
//                         </button>
//                         <button onClick={() => handleDeleteUser(user.user_id, user.full_name)} disabled={deletingUser === user.user_id} title="Delete User" className="p-2 text-red-500 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 )) : (
//                   <tr>
//                     <td colSpan={6} className="text-center py-12">
//                       <h3 className="text-lg font-medium">No Users Found</h3>
//                       <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Pagination Controls */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-between mt-6">
//             <div className="text-sm text-gray-700">
//               Page {currentPage} of {totalPages}
//             </div>
//             <div className="flex items-center space-x-2">
//               <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
//                 <ChevronLeft size={20} />
//               </button>
//               <span className="text-sm font-medium">
//                 {((currentPage - 1) * usersPerPage) + 1} - {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
//               </span>
//               <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
//                 <ChevronRight size={20} />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UsersPage;
