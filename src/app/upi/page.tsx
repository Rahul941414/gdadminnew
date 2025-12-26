
"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const url = "https://backend.gdmatka.site";

const UpiForm = () => {
  const router = useRouter();
  const [upiId, setUpiId] = useState('');
  const [choice, setChoice] = useState('UPI'); // default to UPI
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getUpi();
  }, []);

  async function getUpi() {
    try {
      const token = localStorage.getItem("token");

      const resp = await fetch(`${url}/upi`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const ans = await resp.json();
      setUpiId(ans.upi_id);
    } catch (error) {
      console.error("Error fetching UPI ID:", error);
    }
  }

  const handleChange = (e) => setUpiId(e.target.value);
  const handleChoiceChange = async (e) => {
    const newChoice = e.target.value;
    setChoice(newChoice);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${url}/update-payment-choice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ choice: newChoice }),
      });

      if (!res.ok) throw new Error("Failed to update payment choice.");
    } catch (err) {
      console.error("Error updating choice:", err);
      alert("Failed to update payment choice.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${url}/upi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upi: upiId }),
      });

      if (res.ok) {
        alert("UPI ID updated successfully!");
      } else {
        alert("Failed to update UPI ID.");
      }
    } catch (err) {
      console.error("Error updating UPI ID:", err);
      alert("Error updating UPI ID.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      {/* Choice Dropdown in top-right */}
      <div className="absolute top-4 right-4">
        <select
          value={choice}
          onChange={handleChoiceChange}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="UPI">UPI</option>
          <option value="RAZORPAY">RAZORPAY</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg w-full max-w-md p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleGoBack}
            className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">UPI ID Form</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="upiId" className="block text-gray-700 font-medium mb-2">
              UPI ID
            </label>
            <input
              type="text"
              id="upiId"
              value={upiId}
              onChange={handleChange}
              placeholder="Enter your UPI ID"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save UPI ID
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpiForm;
