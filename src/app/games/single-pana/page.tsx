"use client";

import React, { useState } from 'react';

const SinglePana = () => {
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const spPanaData = {
    '0': ['127', '136', '145', '190', '235', '280', '370', '389', '460', '479', '569', '578'],
    '1': ['128', '137', '146', '236', '245', '290', '380', '470', '489', '560', '579', '678'],
    '2': ['129', '138', '147', '156', '237', '246', '345', '390', '480', '570', '589', '679'],
    '3': ['120', '139', '148', '157', '238', '247', '256', '346', '490', '580', '670', '689'],
    '4': ['130', '149', '158', '167', '239', '248', '257', '347', '356', '590', '680', '789'],
    '5': ['140', '159', '168', '230', '249', '258', '267', '348', '357', '456', '690', '780'],
    '6': ['123', '150', '169', '178', '240', '259', '268', '349', '358', '367', '457', '790'],
    '7': ['124', '160', '278', '179', '250', '269', '340', '359', '368', '458', '467', '890'],
    '8': ['125', '134', '170', '189', '260', '279', '350', '369', '468', '378', '459', '567'],
    '9': ['126', '135', '180', '234', '270', '289', '360', '379', '450', '469', '478', '568']
  };

  const handleDigitSelect = (digit: string) => {
    setSelectedDigit(digit === selectedDigit ? null : digit);
    setSelectedNumber(null);
  };

  const handleNumberSelect = (number: string) => {
    setSelectedNumber(number);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-purple-900">Single Pana (SP) Numbers</h2>
        <div className="flex space-x-2">
          {selectedDigit !== null && (
            <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-lg font-bold">
              Digit: {selectedDigit}
            </div>
          )}
          {selectedNumber && (
            <div className="bg-purple-700 text-white px-4 py-2 rounded-full text-lg font-bold">
              Number: {selectedNumber}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(spPanaData).map(([digit, numbers]) => (
          <div 
            key={digit} 
            className={`
              rounded-lg 
              overflow-hidden 
              transition-all 
              duration-300 
              ${selectedDigit === null || selectedDigit === digit 
                ? 'opacity-100' 
                : 'opacity-30'}
            `}
          >
            <button
              onClick={() => handleDigitSelect(digit)}
              className={`
                w-full 
                text-left 
                px-4 
                py-3 
                text-xl 
                font-semibold 
                transition-colors 
                ${selectedDigit === digit 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-200 text-purple-800 hover:bg-purple-300'}
              `}
            >
              SP Pana's of {digit}
            </button>
            
            <div className="bg-white p-4 grid grid-cols-12 gap-3">
              {numbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumberSelect(number)}
                  className={`
                    rounded-lg 
                    p-2 
                    text-center 
                    transition-all 
                    duration-300 
                    transform 
                    hover:scale-105 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-purple-500
                    ${selectedNumber === number 
                      ? 'bg-purple-600 text-white shadow-xl' 
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200 shadow-md'}
                  `}
                >
                  <span className="text-lg font-bold">{number}</span>
                  {selectedNumber === number && (
                    <div className="absolute inset-0 bg-purple-700 opacity-20 animate-ping"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SinglePana;