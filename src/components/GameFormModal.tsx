// GameFormModal.js
"use client"
import React, { useState, useRef } from 'react';
import { XIcon } from 'lucide-react';

const GameFormModal = ({ isOpen, onClose, onSubmit, initialData, mode = 'create' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 250, y: 100 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  
  const [formData, setFormData] = useState(initialData || {
    market_name: "",
    market_open_time: "09:00",
    market_close_time: "17:00",
    active_status: "Active",
    timings: {
      SUNDAY: { isOpen: true },
      MONDAY: { isOpen: true },
      TUESDAY: { isOpen: true },
      WEDNESDAY: { isOpen: true },
      THURSDAY: { isOpen: true },
      FRIDAY: { isOpen: true },
      SATURDAY: { isOpen: true }
    }
  });

  const handleMouseDown = (e) => {
    if (e.target.closest('.modal-content')) return;
    setIsDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    
    const maxX = window.innerWidth - modalRef.current.offsetWidth;
    const maxY = window.innerHeight - modalRef.current.offsetHeight;
    
    setPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTimingChange = (day) => {
    setFormData(prev => ({
      ...prev,
      timings: {
        ...prev.timings,
        [day]: { isOpen: !prev.timings[day].isOpen }
      }
    }));
  };

  const handleSubmit = () => {
    const closedDays = Object.entries(formData.timings)
      .filter(([_, value]) => !value.isOpen)
      .map(([day]) => day)
      .join(',');

    const submissionData = {
      ...formData,
      market_close_days: closedDays
    };

    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-auto z-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          position: 'absolute',
        }}
        className="bg-white rounded-lg shadow-xl w-[500px]"
      >
        <div
          className="p-4 cursor-move bg-gray-100 rounded-t-lg flex justify-between items-center"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-xl font-bold">
            {mode === 'create' ? 'Add New Game' : 'Edit Game'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Game Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.market_name}
                onChange={(e) => setFormData({ ...formData, market_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Open Time</label>
              <input
                type="time"
                className="w-full border p-2 rounded"
                value={formData.market_open_time}
                onChange={(e) => setFormData({ ...formData, market_open_time: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Close Time</label>
              <input
                type="time"
                className="w-full border p-2 rounded"
                value={formData.market_close_time}
                onChange={(e) => setFormData({ ...formData, market_close_time: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Status</label>
              <select
                className="w-full border p-2 rounded"
                value={formData.active_status}
                onChange={(e) => setFormData({ ...formData, active_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-bold mb-2">Weekly Timings</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(formData.timings).map(([day, { isOpen }]) => (
                  <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{day}</span>
                    <button
                      className={`px-3 py-1 rounded transition-colors ${
                        isOpen 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                      onClick={() => handleTimingChange(day)}
                    >
                      {isOpen ? 'Open' : 'Closed'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            onClick={handleSubmit}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameFormModal;