"use client";

import React from 'react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, Loader2 } from "lucide-react";

// Props के लिए Types
interface ModalRow {
    user_id: number;
    [key: string]: any;
}

interface DetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: ModalRow[];
    loading: boolean;
    onViewProfile: (userId: number) => void;
}

export default function DetailsModal({ isOpen, onClose, title, data, loading, onViewProfile }: DetailsModalProps) {
    if (!isOpen) return null;

    // डायनेमिक हेडर बनाना
    const headers = data.length > 0
        ? Object.keys(data[0]).filter(key => key !== 'user_id' && key !== 'user')
        : [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr className="text-left">
                                        <th className="p-2 font-semibold">USER</th>
                                        {headers.map(key => (
                                            <th key={key} className="p-2 font-semibold">{key.replace(/_/g, ' ').toUpperCase()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data && data.map((row, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="p-2 whitespace-nowrap">
                                                <span
                                                    onClick={() => onViewProfile(row.user_id)}
                                                    className="text-blue-600 font-semibold cursor-pointer hover:underline"
                                                >
                                                    {row.user}
                                                </span>
                                            </td>
                                            {headers.map(key => (
                                                <td key={key} className="p-2 whitespace-nowrap">
                                                    {row[key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
