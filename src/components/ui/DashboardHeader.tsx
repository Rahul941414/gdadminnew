'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Settings } from 'lucide-react';
import '../app/globals.css';

const DashboardHeader = ({ userEmail }) => {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState(3); // Example notification count

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const getInitials = (email) => {
        return email ? email.charAt(0).toUpperCase() : 'U';
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 fixed top-0 right-0 left-64 z-10 shadow-sm">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Left side - Dashboard title with gradient */}
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <div className="hidden md:block h-6 w-px bg-gradient-to-b from-gray-200 to-gray-400"></div>
                    <span className="hidden md:block text-sm text-gray-500 font-medium">
                        Welcome back
                    </span>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center space-x-3">
                    {/* Notifications */}
                    <div className="relative">
                        <button className="p-2.5 hover:bg-gray-100/70 rounded-xl transition-all duration-200 hover:scale-105 group">
                            <Bell size={20} className="text-gray-600 group-hover:text-gray-800 transition-colors" />
                            {notifications > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                    {notifications}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-100/70 rounded-xl transition-all duration-200 hover:scale-105"
                        >
                            {/* Avatar */}
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                                {getInitials(userEmail)}
                            </div>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-sm font-medium text-gray-800 truncate max-w-32">
                                    {userEmail}
                                </span>
                                <span className="text-xs text-gray-500">Administrator</span>
                            </div>
                        </button>

                        {/* Dropdown menu */}
                        {showDropdown && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowDropdown(false)}
                                />
                                {/* Menu */}
                                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 py-2 z-20 animate-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-800 truncate">{userEmail}</p>
                                        <p className="text-xs text-gray-500">Signed in</p>
                                    </div>

                                    <div className="py-1">
                                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                                            <User size={16} className="text-gray-500" />
                                            <span>Profile</span>
                                        </button>
                                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                                            <Settings size={16} className="text-gray-500" />
                                            <span>Settings</span>
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors group"
                                        >
                                            <LogOut size={16} className="text-red-500 group-hover:text-red-600" />
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;

// 'use client';

// import React from 'react';
// import { useRouter } from 'next/navigation';
// import { Bell } from 'lucide-react';
// import '../app/globals.css'; // Or wherever your globals.css is located


// const DashboardHeader = ({ userEmail }) => {
//     const router = useRouter();

//     const handleLogout = () => {
//         localStorage.removeItem('token');
//         router.push('/');
//     };

//     return (
//         <header className="h-16 bg-white shadow-sm fixed top-0 right-0 left-64 z-10">
//             <div className="h-full px-4 flex items-center justify-between">
//                 <h1 className="text-xl font-semibold">Dashboard</h1>
//                 <div className="flex items-center space-x-4">
//                     <button className="p-2 hover:bg-gray-100 rounded-full">
//                         <Bell size={20} />
//                     </button>
//                     <span className="text-gray-600">{userEmail}</span>
//                     <button
//                         onClick={handleLogout}
//                         className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//                     >
//                         Logout
//                     </button>
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default DashboardHeader;