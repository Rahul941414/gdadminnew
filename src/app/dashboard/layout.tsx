// src/app/dashboard/layout.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import '../globals.css';
import { Loader2, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/');
        return;
      }
      try {
        const response = await fetch('https://backend.gdmatka.site/api/protected', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Invalid token');
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-64">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu size={24} />
              </Button>
              <h1 className="text-xl font-semibold ml-4">Dashboard</h1>
            </div>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

// // src/app/dashboard/layout.tsx
// 'use client';
// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Sidebar from '../../components/Sidebar';
// import '../globals.css';
// import { Loader2, Menu, LogOut, User } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';

// // TopStats के लिए Interface
// interface TopStats {
//   overall_users: number;
// }

// export default function DashboardLayout({ children }) {
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [userData, setUserData] = useState<any>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [topStats, setTopStats] = useState<TopStats | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         router.replace('/');
//         return;
//       }
//       try {
//         // एक साथ दोनों API कॉल करें
//         const [authResponse, statsResponse] = await Promise.all([
//           fetch('https://backend.gdmatka.site/api/protected', {
//             headers: { 'Authorization': `Bearer ${token}` },
//           }),
//           fetch('https://backend.gdmatka.site/api/getdetails', {
//             headers: { 'Authorization': `Bearer ${token}` },
//           })
//         ]);

//         if (!authResponse.ok) throw new Error('Invalid token');

//         const authData = await authResponse.json();
//         setUserData(authData.user);

//         if (statsResponse.ok) {
//           const statsData = await statsResponse.json();
//           setTopStats(statsData);
//         }

//         setIsAuthorized(true);
//       } catch (error) {
//         console.error('Auth check or stats fetch failed:', error);
//         localStorage.removeItem('token');
//         router.replace('/');
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     checkAuth();
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     router.replace('/');
//   };

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
//             <div className="absolute inset-0 h-16 w-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
//           </div>
//           <div className="space-y-2">
//             <h3 className="text-lg font-semibold text-gray-700">Loading Dashboard</h3>
//             <p className="text-sm text-gray-500">Authenticating your session...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthorized) {
//     return null;
//   }

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
//       {/* Sidebar */}
//       <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

//       {/* Sidebar overlay for mobile */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Main Content */}
//       <div
//         className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'
//           }`}
//       >
//         {/* Modern Header */}
//         <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shadow-sm">
//           <div className="h-16 px-6 flex items-center justify-between">
//             {/* Left Section */}
//             <div className="flex items-center space-x-4">
//               {/* Mobile Menu Toggle */}
//               <Button
//                 variant="ghost"
//                 onClick={() => setSidebarOpen(true)}
//                 className="p-2 lg:hidden hover:bg-white/50 rounded-xl transition-all duration-200"
//               >
//                 <Menu size={24} className="text-gray-700" />
//               </Button>

//               {/* Dashboard Title */}
//               <div className="flex items-center space-x-4">
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
//                   Dashboard
//                 </h1>
//                 <div className="hidden md:flex items-center space-x-3">
//                   <div className="h-6 w-px bg-gradient-to-b from-gray-300 to-gray-100"></div>
//                   <span className="text-sm text-gray-500 font-medium">Welcome back</span>
//                 </div>
//               </div>
//             </div>

//             {/* Right Section */}
//             <div className="flex items-center">
//               {/* Logout Button */}
//               <Button
//                 onClick={handleLogout}
//                 variant="destructive"
//                 size="sm"
//                 className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
//               >
//                 <LogOut size={18} />
//                 <span className="font-medium">Logout</span>
//               </Button>
//             </div>
//           </div>
//         </header>

//         {/* Main Content Area */}
//         <main className="flex-1 p-6 overflow-auto">
//           <div className="max-w-7xl mx-auto">

//             {/* वेलकम कार्ड */}
//             <Card className="p-4 bg-white shadow-md mb-6">
//               <div className="flex justify-between items-start">
//                 <div>
//                   <p className="text-sm text-gray-500">Dashboards / Dashboard</p>
//                   <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
//                   <p className="text-gray-500">Admin Dashboard</p>
//                 </div>
//                 <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300"></div>
//               </div>
//               <div className="flex justify-between items-center mt-4">
//                 <div className="flex items-center gap-4">
//                   <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
//                     <User size={24} className="text-gray-600" />
//                   </div>
//                   <p className="font-semibold">{userData?.email || 'Admin'}</p>
//                 </div>
//                 <div className="flex gap-8 text-center">
//                   <div>
//                     <p className="text-2xl font-bold text-gray-800">{topStats?.overall_users || 0}</p>
//                     <p className="text-sm text-gray-500">Approved Users</p>
//                   </div>
//                   <div>
//                     <p className="text-2xl font-bold text-gray-800">0</p>
//                     <p className="text-sm text-gray-500">Unapproved Users</p>
//                   </div>
//                 </div>
//               </div>
//             </Card>

//             {children}
//           </div>
//         </main>
//       </div>

//       {/* Global Background Effects */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
//         <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/10 via-purple-400/5 to-transparent rounded-full blur-3xl"></div>
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 via-blue-400/5 to-transparent rounded-full blur-3xl"></div>
//       </div>
//     </div>
//   );
// }


// // src/app/dashboard/layout.tsx
// 'use client';
// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Sidebar from '../../components/Sidebar';
// import '../globals.css';
// import { Loader2, Menu, LogOut } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// export default function DashboardLayout({ children }) {
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [userData, setUserData] = useState<any>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         router.replace('/');
//         return;
//       }
//       try {
//         const response = await fetch('https://backend.gdmatka.site/api/protected', {
//           headers: { 'Authorization': `Bearer ${token}` },
//         });
//         if (!response.ok) throw new Error('Invalid token');
//         const data = await response.json();
//         setUserData(data.user);
//         setIsAuthorized(true);
//       } catch (error) {
//         console.error('Auth check failed:', error);
//         localStorage.removeItem('token');
//         router.replace('/');
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     checkAuth();
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     router.replace('/');
//   };

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//         <div className="text-center space-y-4">
//           <div className="relative">
//             <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
//             <div className="absolute inset-0 h-16 w-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
//           </div>
//           <div className="space-y-2">
//             <h3 className="text-lg font-semibold text-gray-700">Loading Dashboard</h3>
//             <p className="text-sm text-gray-500">Authenticating your session...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthorized) {
//     return null;
//   }

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
//       {/* Sidebar */}
//       <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

//       {/* Sidebar overlay for mobile */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Main Content */}
//       <div
//         className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'
//           }`}
//       >
//         {/* Modern Header */}
//         <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shadow-sm">
//           <div className="h-16 px-6 flex items-center justify-between">
//             {/* Left Section */}
//             <div className="flex items-center space-x-4">
//               {/* Mobile Menu Toggle */}
//               <Button
//                 variant="ghost"
//                 onClick={() => setSidebarOpen(true)}
//                 className="p-2 lg:hidden hover:bg-white/50 rounded-xl transition-all duration-200"
//               >
//                 <Menu size={24} className="text-gray-700" />
//               </Button>

//               {/* Dashboard Title */}
//               <div className="flex items-center space-x-4">
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
//                   Dashboard
//                 </h1>
//                 <div className="hidden md:flex items-center space-x-3">
//                   <div className="h-6 w-px bg-gradient-to-b from-gray-300 to-gray-100"></div>
//                   <span className="text-sm text-gray-500 font-medium">Welcome back</span>
//                 </div>
//               </div>
//             </div>

//             {/* Right Section */}
//             <div className="flex items-center">
//               {/* Logout Button */}
//               <Button
//                 onClick={handleLogout}
//                 variant="destructive"
//                 size="sm"
//                 className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
//               >
//                 <LogOut size={18} />
//                 <span className="font-medium">Logout</span>
//               </Button>
//             </div>
//           </div>
//         </header>

//         {/* Main Content Area */}
//         <main className="flex-1 p-6 overflow-auto">
//           <div className="max-w-7xl mx-auto">
//             {children}
//           </div>
//         </main>
//       </div>

//       {/* Global Background Effects */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
//         <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/10 via-purple-400/5 to-transparent rounded-full blur-3xl"></div>
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 via-blue-400/5 to-transparent rounded-full blur-3xl"></div>
//       </div>
//     </div>
//   );
// }

// // src/app/dashboard/layout.tsx
// 'use client';
// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Sidebar from '../../components/Sidebar';
// import '../globals.css';
// import { Loader2, Menu, LogOut } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// export default function DashboardLayout({ children }) {
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [userData, setUserData] = useState<any>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         router.replace('/');
//         return;
//       }
//       try {
//         const response = await fetch('https://backend.gdmatka.site/api/protected', {
//           headers: { 'Authorization': `Bearer ${token}` },
//         });
//         if (!response.ok) throw new Error('Invalid token');

//         const data = await response.json();
//         setUserData(data.user);
//         setIsAuthorized(true);
//       } catch (error) {
//         console.error('Auth check failed:', error);
//         localStorage.removeItem('token');
//         router.replace('/');
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     checkAuth();
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     router.replace('/');
//   };

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <Loader2 className="h-12 w-12 animate-spin" />
//       </div>
//     );
//   }

//   if (!isAuthorized) {
//     return null;
//   }

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

//       {/* Main Content */}
//       <div
//         className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'
//           }`}
//       >
//         {/* Header */}
//         <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
//           {/* Mobile Sidebar Toggle */}
//           <Button
//             variant="ghost"
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 lg:hidden"
//           >
//             <Menu size={24} />
//           </Button>

//           {/* Welcome + Logout */}
//           <div className="flex items-center gap-4 ml-auto">
//             <span className="font-semibold text-gray-700">
//               Welcome, {userData?.email || 'Admin'}
//             </span>
//             <Button
//               variant="destructive"
//               size="sm"
//               onClick={handleLogout}
//               className="flex items-center gap-2"
//             >
//               <LogOut size={18} />
//               Logout
//             </Button>
//           </div>
//         </header>

//         {/* Children */}
//         <main className="flex-1 p-4">{children}</main>
//       </div>
//     </div>
//   );
// }


// // src/app/dashboard/layout.tsx
// 'use client';
// import React from 'react';
// import { useEffect, useState } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import Sidebar from '../../components/Sidebar';
// import Dashboard from './page';
// import '../globals.css';

// export default function DashboardLayout({ children }) {
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [userData, setUserData] = useState(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const router = useRouter();
//   const pathname = usePathname();
//   const toggleSidebar = () => {
//     console.log("Toggle Sidebar");
//     setSidebarOpen(!sidebarOpen);
//   };

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         router.replace('/');
//         return;
//       }
//       try {
//         const response = await fetch('https://backend.gdmatka.site/api/protected', {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//           },
//         });
//         if (!response.ok) {
//           throw new Error('Invalid token');
//         }
//         const data = await response.json();
//         setUserData(data.user);
//         setIsAuthorized(true);
//       } catch (error) {
//         console.error('Auth check failed:', error);
//         localStorage.removeItem('token');
//         router.replace('/');
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     checkAuth();
//   }, [router]);

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthorized) {
//     return null;
//   }

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       {sidebarOpen && <Sidebar isOpen={sidebarOpen} />}
//       <div className={`flex-1 transition-all duration-300`}>
//         <Dashboard
//           userData={userData}
//           sidebarOpen={sidebarOpen}
//           toggleSidebar={toggleSidebar}
//         />
//       </div>
//     </div>
//   );
// }