"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ContactInfoPage = () => {
    const router = useRouter();
    const [contactInfo, setContactInfo] = useState({ whatsapp_number: "", phonecall_number: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchContactInfo();
    }, []);

    const fetchContactInfo = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("https://backend.gdmatka.site/api/contactinfo");
            if (!response.ok) throw new Error("Failed to fetch contact info");
            const data = await response.json();
            setContactInfo(data);
        } catch (error) {
            console.error(error);
            alert("Error fetching contact info.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setContactInfo((prev) => ({ ...prev, [field]: value }));
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch("https://backend.gdmatka.site/api/contactinfo", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(contactInfo),
            });

            if (!response.ok) throw new Error("Failed to update contact info");

            alert("Contact info updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Error updating contact info.");
        } finally {
            setIsUpdating(false);
        }
    };

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
                        <CardTitle className="text-lg md:text-2xl font-bold">Contact Info</CardTitle>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchContactInfo}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48 md:h-64">
                            <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
                            <p className="text-gray-500">Loading contact info...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block font-medium text-gray-700">WhatsApp Number</label>
                                <Input
                                    type="text"
                                    value={contactInfo.whatsapp_number}
                                    onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block font-medium text-gray-700">Phone Call Number</label>
                                <Input
                                    type="text"
                                    value={contactInfo.phonecall_number}
                                    onChange={(e) => handleChange("phonecall_number", e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="mt-4 w-full sm:w-auto"
                            >
                                {isUpdating ? "Updating..." : "Update Contact Info"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ContactInfoPage;