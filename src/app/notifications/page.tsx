"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Plus, Filter, Trash2, Bell, MessageSquare, Calendar, Eye, EyeOff, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const API_BASE = "https://backend.gdmatka.site/api";

const NotificationsPage = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ title: "", content: "", status: "active" });
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/notifications`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to fetch notifications");
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            alert("Error fetching notifications. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((s) => ({ ...s, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            alert("Please fill in all required fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Authentication token is missing.");
                return;
            }
            const res = await fetch(`${API_BASE}/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error("Failed to create notification");
            const newNotification = await res.json();
            setNotifications((prev) => [newNotification, ...prev]);
            setFormData({ title: "", content: "", status: "active" });
            setShowAddForm(false);
            alert("Notification created successfully!");
        } catch (e) {
            console.error(e);
            alert("Error creating notification. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        const ok = window.confirm("Delete this notification permanently?");
        if (!ok) return;
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Authentication token is missing.");
                return;
            }
            const res = await fetch(`${API_BASE}/notifications/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Delete failed: ${res.status} ${txt}`);
            }
            setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
        } catch (e) {
            console.error(e);
            alert("Error deleting notification. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSwitchChange = (n: any, checked: boolean) => {
        if (!checked) {
            handleDelete(n.notification_id);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");
        } catch {
            return dateString;
        }
    };

    const filteredNotifications = notifications.filter((notification) => {
        const matchesStatus = statusFilter === "all" || notification.status === statusFilter;
        const matchesSearch = searchTerm === "" || 
            notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusCounts = () => {
        const active = notifications.filter(n => n.status === "active").length;
        const inactive = notifications.filter(n => n.status === "inactive").length;
        return { active, inactive, total: notifications.length };
    };

    const statusCounts = getStatusCounts();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 shadow-sm border-gray-200"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
                            <p className="text-gray-600 mt-1">Manage and broadcast messages to your users</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={fetchNotifications}
                            disabled={isLoading}
                            className="shadow-sm"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {showAddForm ? "Cancel" : "New Notification"}
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Total Notifications</p>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">{statusCounts.total}</p>
                                </div>
                                <div className="p-3 bg-blue-200 rounded-full">
                                    <Bell className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Active</p>
                                    <p className="text-2xl font-bold text-green-900 mt-1">{statusCounts.active}</p>
                                </div>
                                <div className="p-3 bg-green-200 rounded-full">
                                    <Eye className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Inactive</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.inactive}</p>
                                </div>
                                <div className="p-3 bg-gray-200 rounded-full">
                                    <EyeOff className="h-6 w-6 text-gray-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Notification Form */}
                {showAddForm && (
                    <Card className="mb-6 shadow-lg border-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-blue-600" />
                                Create New Notification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Title <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter notification title"
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-medium">
                                            Status
                                        </Label>
                                        <Select name="status" value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Content <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter notification content"
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Notification
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Notifications List */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-gray-600" />
                                Notifications ({filteredNotifications.length})
                            </CardTitle>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search notifications..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Notifications</SelectItem>
                                        <SelectItem value="active">Active Only</SelectItem>
                                        <SelectItem value="inactive">Inactive Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <RefreshCw className="animate-spin text-gray-400 mr-3 h-6 w-6" />
                                <span className="text-gray-500">Loading notifications...</span>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <Bell size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    {searchTerm || statusFilter !== "all" 
                                        ? "No notifications match your search criteria." 
                                        : "Get started by creating your first notification."}
                                </p>
                                {!searchTerm && statusFilter === "all" && (
                                    <Button 
                                        onClick={() => setShowAddForm(true)} 
                                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Notification
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredNotifications.map((notification) => (
                                    <div 
                                        key={notification.notification_id} 
                                        className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                                                        {notification.title}
                                                    </h3>
                                                    <Badge 
                                                        variant={notification.status === "active" ? "default" : "secondary"}
                                                        className={notification.status === "active" 
                                                            ? "bg-green-100 text-green-800 border-green-200" 
                                                            : "bg-gray-100 text-gray-800 border-gray-200"
                                                        }
                                                    >
                                                        {notification.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                                    {notification.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-100 gap-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                Created: {formatDate(notification.created_at)}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(notification.notification_id)}
                                                    disabled={isUpdating}
                                                    className="flex items-center"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </Button>

                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`status-${notification.notification_id}`} className="text-sm text-gray-700">
                                                        {notification.status === "active" ? "Active" : "Inactive"}
                                                    </Label>
                                                    <Switch
                                                        id={`status-${notification.notification_id}`}
                                                        checked={notification.status === "active"}
                                                        onCheckedChange={(checked) => handleSwitchChange(notification, checked)}
                                                        disabled={isUpdating}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NotificationsPage;



// "use client";
// import { useState, useEffect } from "react";
// import { ArrowLeft, RefreshCw, Plus, Filter, Trash2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { format } from "date-fns";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

// const API_BASE = "https://backend.gdmatka.site/api";

// const NotificationsPage = () => {
//     const router = useRouter();
//     const [notifications, setNotifications] = useState<any[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [showAddForm, setShowAddForm] = useState(false);
//     const [formData, setFormData] = useState({ title: "", content: "", status: "active" });
//     const [statusFilter, setStatusFilter] = useState("all");
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [isUpdating, setIsUpdating] = useState(false);

//     useEffect(() => {
//         fetchNotifications();
//     }, []);

//     const fetchNotifications = async () => {
//         setIsLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const res = await fetch(`${API_BASE}/notifications`, {
//                 headers: token ? { Authorization: `Bearer ${token}` } : {},
//             });
//             if (!res.ok) throw new Error("Failed to fetch notifications");
//             const data = await res.json(); // ⬅️ backend array return कर रहा है
//             setNotifications(Array.isArray(data) ? data : []);
//         } catch (e) {
//             console.error(e);
//             alert("Error fetching notifications. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//         const { name, value } = e.target;
//         setFormData((s) => ({ ...s, [name]: value }));
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!formData.title || !formData.content) {
//             alert("Please fill in all required fields.");
//             return;
//         }
//         setIsSubmitting(true);
//         try {
//             const token = localStorage.getItem("token");
//             if (!token) {
//                 alert("Authentication token is missing.");
//                 return;
//             }
//             const res = await fetch(`${API_BASE}/notifications`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                 body: JSON.stringify(formData),
//             });
//             if (!res.ok) throw new Error("Failed to create notification");
//             const newNotification = await res.json();
//             setNotifications((prev) => [newNotification, ...prev]);
//             setFormData({ title: "", content: "", status: "active" });
//             setShowAddForm(false);
//             alert("Notification created successfully!");
//         } catch (e) {
//             console.error(e);
//             alert("Error creating notification. Please try again.");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     // ✅ DELETE handler
//     const handleDelete = async (id: number) => {
//         const ok = window.confirm("Delete this notification permanently?");
//         if (!ok) return;
//         if (isUpdating) return;

//         setIsUpdating(true);
//         try {
//             const token = localStorage.getItem("token");
//             if (!token) {
//                 alert("Authentication token is missing.");
//                 return;
//             }
//             const res = await fetch(`${API_BASE}/notifications/${id}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             if (!res.ok) {
//                 const txt = await res.text().catch(() => "");
//                 throw new Error(`Delete failed: ${res.status} ${txt}`);
//             }
//             setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
//         } catch (e) {
//             console.error(e);
//             alert("Error deleting notification. Please try again.");
//         } finally {
//             setIsUpdating(false);
//         }
//     };

//     // 🔁 Switch logic: OFF => delete (inactive concept हट गया)
//     const handleSwitchChange = (n: any, checked: boolean) => {
//         // अगर पहले से active है और user OFF करता है => delete
//         if (!checked) {
//             handleDelete(n.notification_id);
//         } else {
//             // Deleted item को वापस ON नहीं किया जा सकता; इसलिए कोई action नहीं।
//             // (अगर future में 'restore' चाहिए तो अलग endpoint लगेगा)
//         }
//     };

//     const formatDate = (dateString: string) => {
//         try {
//             return format(new Date(dateString), "MMM dd, yyyy HH:mm");
//         } catch {
//             return dateString;
//         }
//     };

//     const filteredNotifications = notifications.filter((notification) => {
//         if (statusFilter === "all") return true;
//         return notification.status === statusFilter;
//     });

//     return (
//         <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <div className="flex items-center space-x-2 md:space-x-4">
//                         <Button variant="outline" size="icon" onClick={() => router.back()} className="h-8 w-8 md:h-10 md:w-10">
//                             <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
//                         </Button>
//                         <CardTitle className="text-lg md:text-2xl font-bold">Notifications</CardTitle>
//                     </div>
//                     <div className="flex space-x-2 w-full sm:w-auto">
//                         <Button variant="outline" onClick={fetchNotifications} disabled={isLoading} className="flex-1 sm:flex-none" size="sm">
//                             <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
//                             Refresh
//                         </Button>
//                         <Button variant="default" onClick={() => setShowAddForm(!showAddForm)} className="flex-1 sm:flex-none" size="sm">
//                             <Plus className="h-4 w-4 mr-2" />
//                             {showAddForm ? "Cancel" : "Add New"}
//                         </Button>
//                     </div>
//                 </CardHeader>

//                 <CardContent>
//                     {showAddForm && (
//                         <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//                             <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Title <span className="text-red-500">*</span>
//                                     </label>
//                                     <Input name="title" value={formData.title} onChange={handleInputChange} required placeholder="Enter notification title" />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Content <span className="text-red-500">*</span>
//                                     </label>
//                                     <Textarea
//                                         name="content"
//                                         value={formData.content}
//                                         onChange={handleInputChange}
//                                         required
//                                         placeholder="Enter notification content"
//                                         rows={4}
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">Status</label>
//                                     <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded-md">
//                                         <option value="active">Active</option>
//                                         <option value="inactive">Inactive</option>
//                                     </select>
//                                 </div>
//                                 <div className="flex justify-end">
//                                     <Button type="submit" disabled={isSubmitting}>
//                                         {isSubmitting ? "Creating..." : "Create Notification"}
//                                     </Button>
//                                 </div>
//                             </form>
//                         </div>
//                     )}

//                     <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                         <div className="flex items-center space-x-2 mb-2 sm:mb-0">
//                             <Filter className="h-4 w-4" />
//                             <span className="text-sm font-medium">Filter by status:</span>
//                         </div>
//                         <Select value={statusFilter} onValueChange={setStatusFilter}>
//                             <SelectTrigger className="w-full sm:w-[220px]">
//                                 <SelectValue placeholder="Filter by status" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Notifications</SelectItem>
//                                 <SelectItem value="active">Active Only</SelectItem>
//                                 <SelectItem value="inactive">Inactive Only</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {isLoading ? (
//                         <div className="flex justify-center items-center h-48 md:h-64">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading notifications...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-3 md:space-y-4">
//                             {filteredNotifications.map((n) => (
//                                 <div key={n.notification_id} className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                     <div className="flex justify-between items-start mb-2">
//                                         <h3 className="text-base md:text-lg font-semibold">{n.title}</h3>
//                                         <Badge className={n.status === "active" ? "bg-green-500" : "bg-gray-500"}>{n.status}</Badge>
//                                     </div>

//                                     <p className="text-gray-700 mb-2 whitespace-pre-line">{n.content}</p>

//                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 pt-2 border-t border-gray-200 gap-3">
//                                         <p className="text-gray-500 text-sm">Created: {formatDate(n.created_at)}</p>

//                                         <div className="flex items-center gap-2">
//                                             {/* Delete button */}
//                                             <Button
//                                                 variant="destructive"
//                                                 size="sm"
//                                                 onClick={() => handleDelete(n.notification_id)}
//                                                 disabled={isUpdating}
//                                                 title="Delete"
//                                                 className="flex items-center"
//                                             >
//                                                 <Trash2 className="h-4 w-4 mr-2" />
//                                                 Delete
//                                             </Button>

//                                             {/* Switch: OFF => delete */}
//                                             <div className="flex items-center space-x-2">
//                                                 <Label htmlFor={`status-${n.notification_id}`} className="text-sm">
//                                                     {n.status === "active" ? "Active" : "Inactive"}
//                                                 </Label>
//                                                 <Switch
//                                                     id={`status-${n.notification_id}`}
//                                                     checked={n.status === "active"}
//                                                     onCheckedChange={(checked) => handleSwitchChange(n, checked)}
//                                                     disabled={isUpdating}
//                                                 />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}

//                             {filteredNotifications.length === 0 && !isLoading && (
//                                 <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
//                                     {statusFilter !== "all"
//                                         ? `No ${statusFilter} notifications found.`
//                                         : "No notifications found. Create a new notification or refresh the page."}
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default NotificationsPage;


// "use client";
// import { useState, useEffect } from "react";
// import { ArrowLeft, RefreshCw, Plus, Filter } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { format } from "date-fns";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

// const NotificationsPage = () => {
//     const router = useRouter();
//     const [notifications, setNotifications] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [showAddForm, setShowAddForm] = useState(false);
//     const [formData, setFormData] = useState({
//         title: "",
//         content: "",
//         status: "active"
//     });
//     const [statusFilter, setStatusFilter] = useState("all");
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [isUpdating, setIsUpdating] = useState(false);

//     useEffect(() => {
//         fetchNotifications();
//     }, []);

//     const fetchNotifications = async () => {
//         setIsLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const response = await fetch("https://backend.gdmatka.site/api/notifications", {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error("Failed to fetch notifications");
//             }

//             const data = await response.json();
//             setNotifications(data);
//         } catch (error) {
//             console.error(error);
//             alert("Error fetching notifications. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData({
//             ...formData,
//             [name]: value
//         });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (!formData.title || !formData.content) {
//             alert("Please fill in all required fields.");
//             return;
//         }

//         setIsSubmitting(true);

//         try {
//             const token = localStorage.getItem("token");

//             if (!token) {
//                 alert("Authentication token is missing.");
//                 return;
//             }

//             const response = await fetch("https://backend.gdmatka.site/api/notifications", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify(formData),
//             });

//             if (response.ok) {
//                 const newNotification = await response.json();
//                 setNotifications([newNotification, ...notifications]);
//                 setFormData({
//                     title: "",
//                     content: "",
//                     status: "active"
//                 });
//                 setShowAddForm(false);
//                 alert("Notification created successfully!");
//             } else {
//                 alert("Failed to create notification.");
//             }
//         } catch (error) {
//             console.error(error);
//             alert("Error creating notification. Please try again.");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const updateNotificationStatus = async (id, newStatus) => {
//         if (isUpdating) return;

//         setIsUpdating(true);
//         try {
//             const token = localStorage.getItem("token");

//             const response = await fetch(`https://backend.gdmatka.site/api/notifications/${id}/update-status`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ status: newStatus }),
//             });

//             if (!response.ok) {
//                 throw new Error("Failed to update notification status");
//             }

//             const updatedNotification = await response.json();
//             setNotifications(notifications.map(notification =>
//                 notification.notification_id === id ? updatedNotification : notification
//             ));
//         } catch (error) {
//             console.error(error);
//             alert("Error updating notification status. Please try again.");
//         } finally {
//             setIsUpdating(false);
//         }
//     };

//     const formatDate = (dateString) => {
//         try {
//             return format(new Date(dateString), "MMM dd, yyyy HH:mm");
//         } catch (error) {
//             return dateString;
//         }
//     };

//     const filteredNotifications = notifications.filter(notification => {
//         if (statusFilter === "all") return true;
//         return notification.status === statusFilter;
//     });

//     return (
//         <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <div className="flex items-center space-x-2 md:space-x-4">
//                         <Button
//                             variant="outline"
//                             size="icon"
//                             onClick={() => router.back()}
//                             className="h-8 w-8 md:h-10 md:w-10"
//                         >
//                             <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
//                         </Button>
//                         <CardTitle className="text-lg md:text-2xl font-bold">Notifications</CardTitle>
//                     </div>
//                     <div className="flex space-x-2 w-full sm:w-auto">
//                         <Button
//                             variant="outline"
//                             onClick={fetchNotifications}
//                             disabled={isLoading}
//                             className="flex-1 sm:flex-none"
//                             size="sm"
//                         >
//                             <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
//                             Refresh
//                         </Button>
//                         <Button
//                             variant="default"
//                             onClick={() => setShowAddForm(!showAddForm)}
//                             className="flex-1 sm:flex-none"
//                             size="sm"
//                         >
//                             <Plus className="h-4 w-4 mr-2" />
//                             {showAddForm ? "Cancel" : "Add New"}
//                         </Button>
//                     </div>
//                 </CardHeader>
//                 <CardContent>
//                     {showAddForm && (
//                         <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//                             <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Title <span className="text-red-500">*</span>
//                                     </label>
//                                     <Input
//                                         name="title"
//                                         value={formData.title}
//                                         onChange={handleInputChange}
//                                         required
//                                         placeholder="Enter notification title"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Content <span className="text-red-500">*</span>
//                                     </label>
//                                     <Textarea
//                                         name="content"
//                                         value={formData.content}
//                                         onChange={handleInputChange}
//                                         required
//                                         placeholder="Enter notification content"
//                                         rows={4}
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">Status</label>
//                                     <select
//                                         name="status"
//                                         value={formData.status}
//                                         onChange={handleInputChange}
//                                         className="w-full p-2 border rounded-md"
//                                     >
//                                         <option value="active">Active</option>
//                                         <option value="inactive">Inactive</option>
//                                     </select>
//                                 </div>
//                                 <div className="flex justify-end">
//                                     <Button
//                                         type="submit"
//                                         disabled={isSubmitting}
//                                     >
//                                         {isSubmitting ? "Creating..." : "Create Notification"}
//                                     </Button>
//                                 </div>
//                             </form>
//                         </div>
//                     )}

//                     <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                         <div className="flex items-center space-x-2 mb-2 sm:mb-0">
//                             <Filter className="h-4 w-4" />
//                             <span className="text-sm font-medium">Filter by status:</span>
//                         </div>
//                         <Select value={statusFilter} onValueChange={setStatusFilter}>
//                             <SelectTrigger className="w-full sm:w-[180px]">
//                                 <SelectValue placeholder="Filter by status" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Notifications</SelectItem>
//                                 <SelectItem value="active">Active Only</SelectItem>
//                                 <SelectItem value="inactive">Inactive Only</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {isLoading ? (
//                         <div className="flex justify-center items-center h-48 md:h-64">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading notifications...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-3 md:space-y-4">
//                             {filteredNotifications.map((notification) => (
//                                 <div
//                                     key={notification.notification_id}
//                                     className="bg-gray-100 p-3 md:p-4 rounded-lg"
//                                 >
//                                     <div className="flex justify-between items-start mb-2">
//                                         <h3 className="text-base md:text-lg font-semibold">{notification.title}</h3>
//                                         <Badge className={notification.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
//                                             {notification.status}
//                                         </Badge>
//                                     </div>
//                                     <p className="text-gray-700 mb-2 whitespace-pre-line">{notification.content}</p>
//                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 pt-2 border-t border-gray-200">
//                                         <p className="text-gray-500 text-sm mb-2 sm:mb-0">
//                                             Created: {formatDate(notification.created_at)}
//                                         </p>
//                                         <div className="flex items-center space-x-2">
//                                             <Label htmlFor={`status-${notification.notification_id}`} className="text-sm">
//                                                 {notification.status === 'active' ? 'Active' : 'Inactive'}
//                                             </Label>
//                                             <Switch
//                                                 id={`status-${notification.notification_id}`}
//                                                 checked={notification.status === 'active'}
//                                                 onCheckedChange={(checked) => {
//                                                     console.log(`Switch toggled for notification ID: ${notification.notification_id}, New Status: ${checked ? 'active' : 'inactive'}`);
//                                                     updateNotificationStatus(
//                                                         notification.notification_id,
//                                                         checked ? 'active' : 'inactive'
//                                                     );
//                                                 }}
//                                                 disabled={isUpdating}
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}

//                             {filteredNotifications.length === 0 && !isLoading && (
//                                 <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
//                                     {statusFilter !== "all"
//                                         ? `No ${statusFilter} notifications found.`
//                                         : "No notifications found. Create a new notification or refresh the page."}
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default NotificationsPage;