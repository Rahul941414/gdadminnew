"use client";

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { openAnk, closePana } from '../../../types';

const HalfSangam = () => {
  const [selectedOpenAnk, setSelectedOpenAnk] = useState(null);
  const [selectedClosePana, setSelectedClosePana] = useState(null);

  const handleSelectOpenAnk = (ank) => {
    setSelectedOpenAnk(ank);
  };

  const handleSelectClosePana = (pana) => {
    setSelectedClosePana(pana);
  };

  const resetSelection = () => {
    setSelectedOpenAnk(null);
    setSelectedClosePana(null);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-teal-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Half Sangam</h2>
              <p className="text-teal-100 mt-2">Select Open Ank and Close Pana numbers</p>
            </div>
            {(selectedOpenAnk || selectedClosePana) && (
              <button
                onClick={resetSelection}
                className="bg-white text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Reset Selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Open Ank Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-teal-50 p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-teal-800">
                  Open Ank
                </h3>
              </div>
              <div className="grid grid-cols-5 gap-3 p-4">
                {openAnk.map((ank, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectOpenAnk(ank)}
                    className={`
                      relative w-full rounded-lg p-4 text-center transition-colors
                      ${selectedOpenAnk === ank
                        ? 'bg-green-200 border-2 border-green-500'
                        : 'bg-teal-100 hover:bg-teal-200'}
                    `}
                  >
                    <span
                      className={`
                        text-xl font-bold 
                        ${selectedOpenAnk === ank ? 'text-green-800' : 'text-teal-800'}
                      `}
                    >
                      {ank.value}
                    </span>
                    {selectedOpenAnk === ank && (
                      <div
                        className="absolute top-1 right-1 w-5 h-5 bg-green-500 text-white 
                        rounded-full flex items-center justify-center text-xs"
                      >
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Pana Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-teal-50 p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-teal-800">
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
                        : 'bg-teal-100 hover:bg-teal-200'}
                    `}
                  >
                    <span
                      className={`
                        text-lg font-semibold 
                        ${selectedClosePana === pana ? 'text-green-800' : 'text-teal-800'}
                      `}
                    >
                      {pana.value}
                    </span>
                    {selectedClosePana === pana && (
                      <div
                        className="absolute top-1 right-1 w-5 h-5 bg-green-500 text-white 
                        rounded-full flex items-center justify-center text-xs"
                      >
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-b-lg">
            <div className="flex items-center bg-teal-50 p-4 rounded-lg border border-teal-200">
              <Info size={24} className="text-teal-600 mr-4" />
              <p className="text-teal-800">
                To play Half Sangam, select one number from Open Ank and one number from Close Pana.
              </p>
            </div>

            {selectedOpenAnk && selectedClosePana && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-2">
                  Selected Combination
                </h4>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="font-medium text-gray-600">Open Ank:</span>
                    <span className="ml-2 text-green-700 font-bold">
                      {selectedOpenAnk.value}
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

export default HalfSangam;