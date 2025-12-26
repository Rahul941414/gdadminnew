"use client";

import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { closePana } from '../../../types';

const FullSangam = () => {
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [selectedOpenPana, setSelectedOpenPana] = useState(null);
  const [selectedClosePana, setSelectedClosePana] = useState(null);

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedNumber(null);
    }, 2000);
  };

  const handleSelectOpenPana = (pana) => {
    setSelectedOpenPana(pana);
  };

  const handleSelectClosePana = (pana) => {
    setSelectedClosePana(pana);
  };

  const resetSelection = () => {
    setSelectedOpenPana(null);
    setSelectedClosePana(null);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Full Sangam</h2>
              <p className="text-blue-100 mt-2">Select Open and Close Pana numbers</p>
            </div>
            {(selectedOpenPana || selectedClosePana) && (
              <button 
                onClick={resetSelection}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Reset Selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Open Pana Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-blue-50 p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-blue-800">
                  Open Pana
                </h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4 max-h-[600px] overflow-y-auto">
                {closePana.map((pana, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectOpenPana(pana)}
                    className={`
                      relative w-full rounded-lg p-2 text-center transition-colors
                      ${selectedOpenPana === pana 
                        ? 'bg-green-200 border-2 border-green-500' 
                        : 'bg-indigo-100 hover:bg-indigo-200'}
                    `}
                  >
                    <span 
                      className={`
                        text-lg font-semibold 
                        ${selectedOpenPana === pana ? 'text-green-800' : 'text-indigo-800'}
                      `}
                    >
                      {pana.value}
                    </span>
                    {selectedOpenPana === pana && (
                      <Check 
                        size={18} 
                        className="absolute top-1 right-1 text-green-600" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Pana Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-blue-50 p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-blue-800">
                  Close Pana
                </h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4 max-h-[600px] overflow-y-auto">
                {closePana.map((pana, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectClosePana(pana)}
                    className={`
                      relative w-full rounded-lg p-2 text-center transition-colors
                      ${selectedClosePana === pana 
                        ? 'bg-green-200 border-2 border-green-500' 
                        : 'bg-indigo-100 hover:bg-indigo-200'}
                    `}
                  >
                    <span 
                      className={`
                        text-lg font-semibold 
                        ${selectedClosePana === pana ? 'text-green-800' : 'text-indigo-800'}
                      `}
                    >
                      {pana.value}
                    </span>
                    {selectedClosePana === pana && (
                      <Check 
                        size={18} 
                        className="absolute top-1 right-1 text-green-600" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-b-lg">
            <div className="flex items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Info size={24} className="text-blue-600 mr-4" />
              <p className="text-blue-800">
                To play Full Sangam, select one number from Open Pana and one number from Close Pana.
              </p>
            </div>

            {selectedOpenPana && selectedClosePana && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-2">
                  Selected Combination
                </h4>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="font-medium text-gray-600">Open Pana:</span>
                    <span className="ml-2 text-green-700 font-bold">
                      {selectedOpenPana.value}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Close Pana:</span>
                    <span className="ml-2 text-green-700 font-bold">
                      {selectedClosePana.value}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullSangam;