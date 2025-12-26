 "use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Tag, Link as LinkIcon, Save } from "lucide-react";
import { useRouter } from 'next/navigation';

const url = "https://backend.gdmatka.site";

const AppUpdatePage = () => {
    const [latestVersion, setLatestVersion] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const router = useRouter();

    // Fetch the current settings when the component loads
    useEffect(() => {
        const fetchCurrentSettings = async () => {
            try {
                // This is a public endpoint, so no token is needed for GET
                const response = await fetch(`${url}/api/app-version`);
                if (!response.ok) {
                    // If the server returns a 404, it just means no version is set yet.
                    if (response.status === 404) {
                        console.log("No version info configured on the server yet.");
                        return;
                    }
                    throw new Error('Failed to fetch settings');
                }
                const data = await response.json();
                setLatestVersion(data.latestVersion || '');
                setDownloadUrl(data.downloadUrl || '');
            } catch (error) {
                console.error("Error fetching current app version:", error);
                setMessage('Could not load current settings.');
                setMessageType('error');
            }
        };

        fetchCurrentSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        if (!latestVersion.trim() || !downloadUrl.trim()) {
            setMessage('Both version and URL are required.');
            setMessageType('error');
            return;
        }

        const token = localStorage.getItem("token"); // Assuming admin token is stored here
        if (!token) {
            setMessage('Authentication error. Please log in again.');
            setMessageType('error');
            return;
        }

        try {
            const response = await fetch(`${url}/api/app-version`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    latestVersion: latestVersion,
                    downloadUrl: downloadUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('Server responded with an error');
            }
            
            setMessage("App settings updated successfully!");
            setMessageType('success');

        } catch (error) {
            console.error("Error updating app version:", error);
            setMessage("Failed to update settings. Please try again.");
            setMessageType('error');
        }
    };

    const handleGoBack = () => {
        router.push('/dashboard');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
                <div className="flex items-center p-6 bg-gray-50 border-b">
                    <button
                        onClick={handleGoBack}
                        className="text-gray-600 hover:text-gray-800 transition-colors mr-4"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-800">
                        App Update Management
                    </h2>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div>
                        <label htmlFor="latestVersion" className="block text-sm font-medium text-gray-700 mb-2">
                            <Tag className="inline-block mr-2" size={16} />
                            Latest App Version
                        </label>
                        <input
                            id="latestVersion"
                            type="text"
                            value={latestVersion}
                            onChange={(e) => setLatestVersion(e.target.value)}
                            placeholder="e.g., 2.0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="downloadUrl" className="block text-sm font-medium text-gray-700 mb-2">
                            <LinkIcon className="inline-block mr-2" size={16} />
                            APK Download URL
                        </label>
                        <input
                            id="downloadUrl"
                            type="text"
                            value={downloadUrl}
                            onChange={(e) => setDownloadUrl(e.target.value)}
                            placeholder="https://example.com/app.apk"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md text-sm ${
                            messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Save size={18} className="mr-2" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppUpdatePage;