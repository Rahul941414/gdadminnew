"use client";

import React, { useState } from 'react';
import { MatkaNumber } from '../../../types';

const SingleDigit = () => {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const numbers: MatkaNumber[] = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    value: i
  }));

  const handleNumberSelect = (value: number) => {
    setSelectedNumber(value);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-blue-900">Single Digit Numbers</h2>
        {selectedNumber !== null && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-lg font-bold">
            Selected: {selectedNumber}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-5 gap-4">
        {numbers.map((num) => (
          <button
            key={num.id}
            onClick={() => handleNumberSelect(num.value)}
            className={`
              relative 
              overflow-hidden 
              rounded-lg 
              p-4 
              text-center 
              transition-all 
              duration-300 
              transform 
              hover:scale-105 
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500
              ${selectedNumber === num.value 
                ? 'bg-blue-600 text-white shadow-xl' 
                : 'bg-white text-blue-800 hover:bg-blue-100 shadow-md'}
            `}
          >
            <span className="text-2xl font-bold relative z-10">{num.value}</span>
            {selectedNumber === num.value && (
              <div className="absolute inset-0 bg-blue-700 opacity-20 animate-ping"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SingleDigit;