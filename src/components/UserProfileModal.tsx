// src/components/UserProfileModal.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { X, Loader2 } from "lucide-react";

interface UserProfileModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && isOpen) {
      const fetchUserData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`https://backend.gdmatka.site/api/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch user data");
          const data = await response.json();
          setUserData(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [userId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">User Profile</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X /></Button>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : userData ? (
            <div className="space-y-4">
              <InfoRow label="Full Name" value={userData.full_name} />
              <InfoRow label="Email" value={userData.email} />
              <InfoRow label="Phone" value={userData.phone_number} />
              <InfoRow label="Wallet Balance" value={`₹${userData.wallet_balance}`} isAmount />
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-2">Bank Details</h3>
                <InfoRow label="Account Holder" value={userData.account_holder_name} />
                <InfoRow label="Bank Name" value={userData.bank_name} />
                <InfoRow label="Account Number" value={userData.account_number} />
                <InfoRow label="IFSC Code" value={userData.ifsc_code} />
              </div>
            </div>
          ) : (
            <p>No user data found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

const InfoRow = ({ label, value, isAmount = false }: { label: string; value: string | number; isAmount?: boolean; }) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-gray-500">{label}:</p>
    <p className={`font-semibold ${isAmount ? 'text-green-600' : 'text-gray-800'}`}>{value || 'N/A'}</p>
  </div>
);