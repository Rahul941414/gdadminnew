"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const url = "https://backend.gdmatka.site";

const MarkdownEditor = () => {
    const [markdown, setMarkdown] = useState("");
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
    }, []);

    async function loadMkdown() {
        try {
            setLoading(true);
            const res = await fetch(`${url}/api/notices`);

            if (!res.ok) {
                throw new Error('Failed to fetch notices');
            }

            const content = await res.json();
            const ans = atob(content.content);

            setMarkdown(ans);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load notices');
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) {
            loadMkdown();
        }
    }, [token]);

    const handleChange = (event) => {
        setMarkdown(event.target.value);
    };

    const handleSubmit = async () => {
        try {
            const data = btoa(markdown);

            const response = await fetch(`${url}/api/notices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: data }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit notices');
            }

            await loadMkdown();
            alert("Notices updated successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to update notices");
        }
    };

    const handleGoBack = () => {
        router.push('/dashboard');
    };

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-xl font-semibold">
                    Please log in to access this page.
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col items-center">
                <RefreshCw className="animate-spin text-blue-500 mb-4" size={48} />
                <div className="text-xl font-semibold">Loading Notices...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-red-500 text-center">
                {error}
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="container mx-auto max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={handleGoBack}
                            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
                            title="Go Back"
                        >
                            <ArrowLeft className="text-gray-700" />
                        </button>
                        <h2 className="text-3xl font-bold text-gray-800">Edit Notice Board</h2>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <textarea
                        value={markdown}
                        onChange={handleChange}
                        rows={15}
                        className="w-full text-lg p-4 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="Write your notices here. Supports Markdown formatting."
                    />

                    <div className="flex justify-end mb-6">
                        <button
                            onClick={handleSubmit}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <Save size={20} />
                            <span>Save Notices</span>
                        </button>
                    </div>

                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Preview</h3>
                    <div className="border border-gray-300 bg-gray-50 p-6 rounded-lg">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => (
                                    <h1 className="text-4xl font-bold mb-4 text-gray-900" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                    <h2 className="text-3xl font-semibold mb-3 text-gray-800" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                    <h3 className="text-2xl font-medium mb-2 text-gray-700" {...props} />
                                ),
                                blockquote: ({ node, ...props }) => (
                                    <blockquote 
                                        className="border-l-4 border-gray-400 pl-4 py-2 my-4 bg-gray-100 italic" 
                                        {...props} 
                                    />
                                ),
                                ul: ({ node, ...props }) => (
                                    <ul 
                                        className="list-disc pl-6 mb-4 space-y-2" 
                                        {...props} 
                                    />
                                ),
                                ol: ({ node, ...props }) => (
                                    <ol 
                                        className="list-decimal pl-6 mb-4 space-y-2" 
                                        {...props} 
                                    />
                                ),
                                li: ({ node, ...props }) => (
                                    <li className="text-lg" {...props} />
                                ),
                                code: ({ node, ...props }) => (
                                    <code 
                                        className="bg-gray-200 px-2 py-1 rounded-md text-sm font-mono" 
                                        {...props} 
                                    />
                                ),
                                p: ({ node, ...props }) => (
                                    <p className="mb-4 text-lg leading-relaxed" {...props} />
                                ),
                            }}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;