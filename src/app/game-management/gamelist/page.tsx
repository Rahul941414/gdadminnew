"use client"
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, Filter, FileSpreadsheet, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CSVLink } from "react-csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GameFormModal from "../../../components/GameFormModal";
import '../../globals.css';

const GameListPage = () => {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    if (!storedToken) {
      setError("Please log in to access this page");
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, []);

  const showMessage = (message, type = "success") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const fetchGames = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("https://backend.gdmatka.site/api/market");
      if (!response.ok) throw new Error("Failed to fetch games");
      const data = await response.json();
      setGames(data);
      filterGames(data, search, statusFilter);
    } catch (error) {
      console.error("Error fetching market data:", error);
      setError("Failed to load games. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterGames = (gamesData, searchTerm, status) => {
    let filtered = [...gamesData];

    if (searchTerm) {
      filtered = filtered.filter((game) =>
        game.market_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((game) => game.active_status === status);
    }

    setFilteredGames(filtered);
  };

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setSearch(searchTerm);
    filterGames(games, searchTerm, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    filterGames(games, search, status);
  };

  const handleEdit = (game) => {
    const gameWithTimings = {
      ...game,
      timings: {
        SUNDAY: { isOpen: !game.market_close_days?.includes('SUNDAY') },
        MONDAY: { isOpen: !game.market_close_days?.includes('MONDAY') },
        TUESDAY: { isOpen: !game.market_close_days?.includes('TUESDAY') },
        WEDNESDAY: { isOpen: !game.market_close_days?.includes('WEDNESDAY') },
        THURSDAY: { isOpen: !game.market_close_days?.includes('THURSDAY') },
        FRIDAY: { isOpen: !game.market_close_days?.includes('FRIDAY') },
        SATURDAY: { isOpen: !game.market_close_days?.includes('SATURDAY') }
      }
    };
    setSelectedGame(gameWithTimings);
    setModalOpen(true);
  };

  const handleCreate = async (gameData) => {
    if (!token) {
      setError("Token not found. Please log in.");
      return;
    }

    try {
      const response = await fetch("https://backend.gdmatka.site/api/market", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) throw new Error("Failed to create the game");

      const newGame = await response.json();
      const updatedGames = [...games, newGame];
      setGames(updatedGames);
      filterGames(updatedGames, search, statusFilter);
      setIsCreateModalOpen(false);
      showMessage("Game created successfully!");
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Failed to create game. Please try again.");
    }
  };

  const handleUpdate = async (gameData) => {
    if (!token) {
      setError("Token not found. Please log in.");
      return;
    }

    try {
      const response = await fetch(`https://backend.gdmatka.site/api/market/${selectedGame.market_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) throw new Error("Failed to update the game");

      const updatedData = await response.json();
      const updatedGames = games.map((game) =>
        game.market_id === selectedGame.market_id ? updatedData : game
      );
      setGames(updatedGames);
      filterGames(updatedGames, search, statusFilter);
      setModalOpen(false);
      showMessage("Game updated successfully!");
    } catch (error) {
      console.error("Error updating game:", error);
      setError("Failed to update game. Please try again.");
    }
  };

  const confirmDelete = (game) => {
    setGameToDelete(game);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !gameToDelete) {
      setError("Token not found or game not selected.");
      return;
    }

    try {
      const response = await fetch(`https://backend.gdmatka.site/api/market/${gameToDelete.market_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete the game");

      const newGames = games.filter((game) => game.market_id !== gameToDelete.market_id);
      setGames(newGames);
      filterGames(newGames, search, statusFilter);
      setDeleteDialogOpen(false);
      setGameToDelete(null);
      showMessage("Game deleted successfully!");
    } catch (error) {
      console.error("Error deleting game:", error);
      setError("Failed to delete game. Please try again.");
    }
  };

  const csvHeaders = [
    { label: "Game Name", key: "market_name" },
    { label: "Open Time", key: "market_open_time" },
    { label: "Close Time", key: "market_close_time" },
    { label: "Days Closed", key: "market_close_days" },
    { label: "Status", key: "active_status" }
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <div className="text-xl font-semibold">Loading Games...</div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900">Game Management</CardTitle>
                <p className="text-gray-600 mt-1">Manage all your games and their schedules</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CSVLink
                data={filteredGames}
                headers={csvHeaders}
                filename="games-export.csv"
                className="hidden sm:block"
              >
                <Button variant="outline" className="shadow-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CSVLink>
              <Button 
                onClick={fetchGames}
                variant="outline"
                className="shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-sm bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by Game Name..."
                value={search}
                onChange={handleSearch}
                className="pl-10 h-11 shadow-sm"
              />
            </div>
            <Select onValueChange={handleStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 shadow-sm">
                <SelectValue placeholder="Filter Status">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter === 'all' ? 'All Status' : statusFilter}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Mobile Export Button */}
            <CSVLink
              data={filteredGames}
              headers={csvHeaders}
              filename="games-export.csv"
              className="sm:hidden"
            >
              <Button variant="outline" className="w-full h-11 shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CSVLink>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              Showing {filteredGames.length} of {games.length} games
            </span>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  filterGames(games, "", statusFilter);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </Button>
            )}
          </div>

          {/* Games Table */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900">#</TableHead>
                  <TableHead className="font-semibold text-gray-900">Game Name</TableHead>
                  <TableHead className="font-semibold text-gray-900">Open Time</TableHead>
                  <TableHead className="font-semibold text-gray-900">Close Time</TableHead>
                  <TableHead className="font-semibold text-gray-900">Days Closed</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {search || statusFilter !== "all" 
                        ? "No games match your search criteria." 
                        : "No games found. Add your first game to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGames.map((game, index) => (
                    <TableRow 
                      key={game.market_id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{game.market_name}</TableCell>
                      <TableCell className="text-gray-700">{game.market_open_time}</TableCell>
                      <TableCell className="text-gray-700">{game.market_close_time}</TableCell>
                      <TableCell className="text-gray-700">
                        {game.market_close_days && game.market_close_days !== "N/A" 
                          ? game.market_close_days.split(',').map(day => day.trim()).join(', ')
                          : "None"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={game.active_status === 'Active' ? 'default' : 'secondary'}
                          className={
                            game.active_status === 'Active' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }
                        >
                          {game.active_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(game)}
                            className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(game)}
                            className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Game Modal */}
      {isCreateModalOpen && (
        <GameFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          mode="create"
        />
      )}

      {/* Edit Game Modal */}
      {modalOpen && (
        <GameFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleUpdate}
          initialData={selectedGame}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the game "{gameToDelete?.market_name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameListPage;

// "use client"
// import { useState, useEffect } from "react";
// import { ArrowLeft, Plus, Search, Filter, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { CSVLink } from "react-csv";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import GameFormModal from "../../../components/GameFormModal";
// import '../../globals.css';

// const GameListPage = () => {
//   const router = useRouter();
//   const [games, setGames] = useState([]);
//   const [search, setSearch] = useState("");
//   const [filteredGames, setFilteredGames] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [token, setToken] = useState(null);
//   const [selectedGame, setSelectedGame] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [statusFilter, setStatusFilter] = useState("all");

//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     setToken(storedToken);
//   }, []);

//   useEffect(() => {
//     fetchGames();
//   }, []);

//   const fetchGames = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/market");
//       const data = await response.json();
//       setGames(data);
//       filterGames(data, search, statusFilter);
//       alert("Games loaded successfully");
//     } catch (error) {
//       console.error("Error fetching market data:", error);
//       alert("Failed to load games");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterGames = (gamesData, searchTerm, status) => {
//     let filtered = [...gamesData];

//     if (searchTerm) {
//       filtered = filtered.filter((game) =>
//         game.market_name.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     if (status !== "all") {
//       filtered = filtered.filter((game) => game.active_status === status);
//     }

//     setFilteredGames(filtered);
//   };

//   const handleSearch = (event) => {
//     const searchTerm = event.target.value;
//     setSearch(searchTerm);
//     filterGames(games, searchTerm, statusFilter);
//   };

//   const handleStatusFilter = (status) => {
//     setStatusFilter(status);
//     filterGames(games, search, status);
//   };

//   const handleEdit = (game) => {
//     const gameWithTimings = {
//       ...game,
//       timings: {
//         SUNDAY: { isOpen: !game.market_close_days?.includes('SUNDAY') },
//         MONDAY: { isOpen: !game.market_close_days?.includes('MONDAY') },
//         TUESDAY: { isOpen: !game.market_close_days?.includes('TUESDAY') },
//         WEDNESDAY: { isOpen: !game.market_close_days?.includes('WEDNESDAY') },
//         THURSDAY: { isOpen: !game.market_close_days?.includes('THURSDAY') },
//         FRIDAY: { isOpen: !game.market_close_days?.includes('FRIDAY') },
//         SATURDAY: { isOpen: !game.market_close_days?.includes('SATURDAY') }
//       }
//     };
//     setSelectedGame(gameWithTimings);
//     setModalOpen(true);
//   };

//   const handleCreate = async (gameData) => {
//     if (!token) {
//       alert("Token not found. Please log in.");
//       return;
//     }

//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/market", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(gameData),
//       });

//       if (!response.ok) throw new Error("Failed to create the game");

//       const newGame = await response.json();
//       const updatedGames = [...games, newGame];
//       setGames(updatedGames);
//       filterGames(updatedGames, search, statusFilter);
//       setIsCreateModalOpen(false);
//       alert("Game created successfully");
//     } catch (error) {
//       console.error("Error creating game:", error);
//       alert("Failed to create game");
//     }
//   };

//   const handleUpdate = async (gameData) => {
//     if (!token) {
//       alert("Token not found. Please log in.");
//       return;
//     }

//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/market/${selectedGame.market_id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(gameData),
//       });

//       if (!response.ok) throw new Error("Failed to update the game");

//       const updatedData = await response.json();
//       const updatedGames = games.map((game) =>
//         game.market_id === selectedGame.market_id ? updatedData : game
//       );
//       setGames(updatedGames);
//       filterGames(updatedGames, search, statusFilter);
//       setModalOpen(false);
//       alert("Game updated successfully");
//     } catch (error) {
//       console.error("Error updating game:", error);
//       alert("Failed to update game");
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!token) {
//       alert("Token not found. Please log in.");
//       return;
//     }

//     try {
//       const response = await fetch(`https://backend.gdmatka.site/api/market/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error("Failed to delete the game");

//       const newGames = games.filter((game) => game.market_id !== id);
//       setGames(newGames);
//       filterGames(newGames, search, statusFilter);
//       alert("Game deleted successfully");
//     } catch (error) {
//       console.error("Error deleting game:", error);
//       alert("Failed to delete game");
//     }
//   };

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-screen">
//       <div className="text-xl font-semibold">Loading...</div>
//     </div>
//   );

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between space-y-0">
//           <div className="flex items-center space-x-4">
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={() => router.back()}
//             >
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//             <CardTitle className="text-2xl font-bold">Game List</CardTitle>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button
//               variant="outline"
//               onClick={fetchGames}
//             >
//               <FileSpreadsheet className="h-4 w-4 mr-2" />
//               Refresh
//             </Button>
//             <Button onClick={() => setIsCreateModalOpen(true)}>
//               <Plus className="h-4 w-4 mr-2" />
//               Add Game
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center space-x-2 mb-4">
//             <div className="relative flex-grow">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <Input
//                 type="text"
//                 placeholder="Search by Game Name"
//                 value={search}
//                 onChange={handleSearch}
//                 className="pl-10"
//               />
//             </div>
//             <Select onValueChange={handleStatusFilter} value={statusFilter}>
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Filter Status">
//                   <div className="flex items-center">
//                     <Filter className="h-4 w-4 mr-2" />
//                     {statusFilter === 'all' ? 'All Status' : statusFilter}
//                   </div>
//                 </SelectValue>
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Status</SelectItem>
//                 <SelectItem value="Active">Active</SelectItem>
//                 <SelectItem value="Inactive">Inactive</SelectItem>
//               </SelectContent>
//             </Select>
//             <CSVLink
//               data={filteredGames}
//               filename="games.csv"
//               className="hidden"
//             >
//               <Button variant="outline">
//                 <FileSpreadsheet className="h-4 w-4 mr-2" />
//                 Export CSV
//               </Button>
//             </CSVLink>
//           </div>

//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>#</TableHead>
//                 <TableHead>Game Name</TableHead>
//                 <TableHead>Open Time</TableHead>
//                 <TableHead>Close Time</TableHead>
//                 <TableHead>Days Closed</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredGames.map((game, index) => (
//                 <TableRow
//                   key={game.market_id}
//                   className={game.active_status === 'Active'
//                     ? 'hover:bg-green-50'
//                     : 'hover:bg-red-50'}
//                 >
//                   <TableCell>{index + 1}</TableCell>
//                   <TableCell>{game.market_name}</TableCell>
//                   <TableCell>{game.market_open_time}</TableCell>
//                   <TableCell>{game.market_close_time}</TableCell>
//                   <TableCell>{game.market_close_days || "N/A"}</TableCell>
//                   <TableCell>
//                     <span
//                       className={`px-2 py-1 rounded ${game.active_status === 'Active'
//                         ? 'bg-green-100 text-green-800'
//                         : 'bg-red-100 text-red-800'
//                         }`}
//                     >
//                       {game.active_status}
//                     </span>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleEdit(game)}
//                       >
//                         <Pencil className="h-4 w-4 mr-1" /> Edit
//                       </Button>
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() => handleDelete(game.market_id)}
//                       >
//                         <Trash2 className="h-4 w-4 mr-1" /> Delete
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {isCreateModalOpen && (
//         <GameFormModal
//           isOpen={isCreateModalOpen}
//           onClose={() => setIsCreateModalOpen(false)}
//           onSubmit={handleCreate}
//           mode="create"
//         />
//       )}

//       {modalOpen && (
//         <GameFormModal
//           isOpen={modalOpen}
//           onClose={() => setModalOpen(false)}
//           onSubmit={handleUpdate}
//           initialData={selectedGame}
//           mode="edit"
//         />
//       )}
//     </div>
//   );
// };

// export default GameListPage;