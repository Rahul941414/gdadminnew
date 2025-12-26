"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Plus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const TextLinksPage = () => {
    const router = useRouter();
    const [links, setLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        display_text: "",
        url: "",
        status: "active"
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("https://backend.gdmatka.site/api/text-links", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch text links");
            }

            const data = await response.json();
            setLinks(data);
        } catch (error) {
            console.error(error);
            alert("Error fetching text links. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.display_text || !formData.url) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch("https://backend.gdmatka.site/api/text-links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const newLink = await response.json();
                setLinks([newLink, ...links]);
                setFormData({
                    display_text: "",
                    url: "",
                    status: "active"
                });
                setShowAddForm(false);
                alert("Text link created successfully!");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to create text link.");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating text link. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateLinkStatus = async (id, newStatus) => {
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`https://backend.gdmatka.site/api/text-links/${id}/update-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update text link status");
            }

            const updatedLink = await response.json();
            setLinks(links.map(link =>
                link.id === id ? updatedLink : link
            ));
        } catch (error) {
            console.error(error);
            alert("Error updating text link status. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredLinks = links.filter(link => {
        if (statusFilter === "all") return true;
        return link.status === statusFilter;
    });

    return (
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
            <Card className="shadow-md">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-8 w-8 md:h-10 md:w-10"
                        >
                            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                        <CardTitle className="text-lg md:text-2xl font-bold">Text Links</CardTitle>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={fetchLinks}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none"
                            size="sm"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex-1 sm:flex-none"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {showAddForm ? "Cancel" : "Add New"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showAddForm && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Create New Text Link</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Display Text <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="display_text"
                                        value={formData.display_text}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter link display text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        URL <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="url"
                                        value={formData.url}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter URL"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Text Link"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                            <Filter className="h-4 w-4" />
                            <span className="text-sm font-medium">Filter by status:</span>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Links</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="inactive">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-48 md:h-64">
                            <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
                            <p className="text-gray-500">Loading text links...</p>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {filteredLinks.map((link) => (
                                <div key={link.id} className="bg-gray-100 p-3 md:p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-base md:text-lg font-semibold">{link.display_text}</h3>
                                        <Badge className={link.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                            {link.status}
                                        </Badge>
                                    </div>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                        {link.url}
                                    </a>
                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                                        <Label htmlFor={`status-${link.id}`} className="text-sm">
                                            {link.status === 'active' ? 'Active' : 'Inactive'}
                                        </Label>
                                        <Switch
                                            id={`status-${link.id}`}
                                            checked={link.status === 'active'}
                                            onCheckedChange={(checked) =>
                                                updateLinkStatus(link.id, checked ? "active" : "inactive")
                                            }
                                            disabled={isUpdating}
                                        />
                                    </div>
                                </div>
                            ))}
                            {filteredLinks.length === 0 && !isLoading && (
                                <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
                                    {statusFilter !== "all"
                                        ? `No ${statusFilter} text links found.`
                                        : "No text links found. Create a new one or refresh the page."}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TextLinksPage;