"use client";

import React, { useState } from 'react';
import { MatkaNumber } from '../../../types';

const JodiDigit = () => {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const numbers: MatkaNumber[] = [];
  let id = 0;

  for (let i = 0; i <= 9; i++) {
    for (let j = 0; j <= 9; j++) {
      numbers.push({
        id: id++,
        value: `${i}${j}`
      });
    }
  }

  const handleNumberSelect = (value: string) => {
    setSelectedNumber(value);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-green-900">Jodi Digit Numbers</h2>
        {selectedNumber && (
          <div className="bg-green-600 text-white px-4 py-2 rounded-full text-lg font-bold">
            Selected: {selectedNumber}
          </div>
        )}
      </div>

      <div className="grid grid-cols-10 gap-3">
        {numbers.map((num) => (
          <button
            key={num.id}
            onClick={() => handleNumberSelect(num.value)}
            className={`
              relative 
              overflow-hidden 
              rounded-lg 
              p-3 
              text-center 
              transition-all 
              duration-300 
              transform 
              hover:scale-105 
              focus:outline-none 
              focus:ring-2 
              focus:ring-green-500
              ${selectedNumber === num.value
                ? 'bg-green-600 text-white shadow-xl'
                : 'bg-white text-green-800 hover:bg-green-100 shadow-md'}
            `}
          >
            <span className="text-xl font-bold relative z-10">{num.value}</span>
            {selectedNumber === num.value && (
              <div className="absolute inset-0 bg-green-700 opacity-20 animate-ping"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default JodiDigit;