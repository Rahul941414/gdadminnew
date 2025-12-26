"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const DoublePana = () => {
  const [copiedNumber, setCopiedNumber] = useState(null);
  const dpPanaData = {
    '0': ['118', '226', '244', '299', '334', '488', '550', '668', '677'],
    '1': ['100', '119', '155', '227', '335', '344', '399', '588', '669'],
    '2': ['110', '200', '228', '255', '366', '499', '660', '688', '778'],
    '3': ['166', '229', '300', '337', '355', '445', '599', '779', '788'],
    '4': ['112', '220', '266', '338', '400', '446', '455', '699', '770'],
    '5': ['113', '122', '177', '339', '366', '447', '500', '799', '889'],
    '6': ['600', '114', '277', '330', '448', '466', '556', '880', '899'],
    '7': ['115', '133', '188', '223', '377', '449', '557', '566', '700'],
    '8': ['116', '224', '233', '288', '440', '477', '558', '800', '990'],
    '9': ['117', '144', '199', '225', '388', '559', '577', '667', '900']
  };

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedNumber(null);
    }, 2000);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h2 className="text-3xl font-bold">Double Pana (DP) Numbers</h2>
            <p className="text-blue-100 mt-2">Explore and copy Double Pana numbers easily</p>
          </div>

          <div className="p-6 space-y-6">
            {Object.entries(dpPanaData).map(([digit, numbers]) => (
              <div
                key={digit}
                className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="bg-blue-50 p-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-blue-800">
                    DP Pana's of {digit}
                  </h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 p-4">
                  {numbers.map((number) => (
                    <div
                      key={number}
                      className="relative"
                    >
                      <button
                        onClick={() => handleCopyNumber(number)}
                        className={`
                          w-full bg-orange-100 rounded-lg p-3 text-center 
                          hover:bg-orange-200 transition-colors 
                          flex items-center justify-center
                          ${copiedNumber === number ? 'bg-green-100' : ''}
                        `}
                      >
                        <span className={`
                          text-lg font-semibold 
                          ${copiedNumber === number ? 'text-green-800' : 'text-orange-800'}
                        `}>
                          {number}
                        </span>
                        <span className="ml-2">
                          {copiedNumber === number ? (
                            <Check size={18} className="text-green-600" />
                          ) : (
                            <Copy size={16} className="text-gray-500 opacity-50" />
                          )}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoublePana;