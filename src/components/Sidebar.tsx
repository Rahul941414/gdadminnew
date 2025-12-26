"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Users, Gamepad, CheckCircle, UserCog, Wallet, ChevronDown,
    Clipboard, Bell, WalletMinimal, PhoneCall, Play, Type, Download, X, Menu,
    BarChart3, Settings, Shield, Zap, Sparkles, Gem, Crown, RotateCw, FileText // <-- 1. आइकॉन इम्पोर्ट किया गया
} from "lucide-react";

/** ---------- types & utils ---------- */
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type SubItem = { path: string; label: string; badge?: string };
type Item = { 
  path?: string; 
  icon: IconType; 
  label: string; 
  subItems?: SubItem[]; 
  badge?: string;
  premium?: boolean;
};

const cls = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");
const storageKey = "gdmatka.sidebar.expanded";

/** ---------- data ---------- */
const NAV: Item[] = [
  { 
    path: "/dashboard", 
    icon: Home, 
    label: "Dashboard",
    badge: "NEW"
  },
  {
    label: "Game Management",
    icon: Gamepad,
    subItems: [
      { path: "/game-management/gamelist", label: "Game List", badge: "Updated" },
      { path: "/game-management/gameprices", label: "Game Prices" },
    ],
  },
  {
    label: "Games & Numbers",
    icon: Zap,
    subItems: [
      { path: "/games/single-digit", label: "Single Digit" },
      { path: "/games/jodi-digit", label: "Jodi Digit" },
      { path: "/games/single-pana", label: "Single Pana" },
      { path: "/games/double-pana", label: "Double Pana" },
      { path: "/games/triple-pana", label: "Triple Pana" },
      { path: "/games/half-sangam", label: "Half Sangam" },
      { path: "/games/full-sangam", label: "Full Sangam", badge: "Hot" },
    ],
  },
  { 
    path: "/user-management", 
    icon: Users, 
    label: "User Management",
    badge: "1.2k"
  },
  { 
    path: "/declare-result", 
    icon: CheckCircle, 
    label: "Declare Result",
    premium: true
  },
  { path: "/welcome-text", icon: Type, label: "Welcome Text" },
  { 
    path: "/withdrawals", 
    icon: Wallet, 
    label: "Withdrawal",
    badge: "Pending"
  },
  { path: "/funds", icon: BarChart3, label: "Funds" },
  { path: "/upi", icon: Shield, label: "UPI ID" },
  { path: "/notice", icon: Clipboard, label: "Notice Board" },
  { 
    path: "/notifications", 
    icon: Bell, 
    label: "Notifications",
    badge: "12"
  },
  { path: "/howtoplay", icon: Play, label: "How To Play" },
  { path: "/bets", icon: Gem, label: "Bets" },
  { path: "/minimum", icon: WalletMinimal, label: "Minimum Limits" },
  { path: "/contactinfo", icon: PhoneCall, label: "Contact Info" },
  { path: "/apkupdate", icon: Download, label: "APK Update" },
  { 
    path: "/payment-gateway-management", 
    icon: Settings, 
    label: "Payment Gateway",
    premium: true
  },
  { 
  path: "/daily-reports", 
  icon: FileText, 
  label: "Daily Reports",
  badge: "P&L"
},
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

/** ---------- component ---------- */
export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [totalDeposits, setTotalDeposits] = useState<number | null>(null);
  const [totalWithdrawals, setTotalWithdrawals] = useState<number | null>(null);
  const [totalProfit, setTotalProfit] = useState<number | null>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // hydrate expanded state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setExpanded(JSON.parse(raw));
    } catch {}
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(expanded));
    } catch {}
  }, [expanded]);

  // Auto-expand group if current path falls inside it
  useEffect(() => {
    NAV.forEach((item, i) => {
      if (!item.subItems) return;
      const match = item.subItems.some((s) => pathname.startsWith(s.path));
      if (match) {
        setExpanded((p) => ({ ...p, [i]: true }));
      }
    });
  }, [pathname]);

  // financial summary - FIXED API CALL
  const fetchFinancialData = async () => {
    setLoadingFinancial(true);
    setFinancialError(null);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch("https://backend.gdmatka.site/api/financial-summary", { 
        headers,
        cache: "no-store" 
      });
      
      console.log('Financial API Response Status:', res.status);
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Financial API Data:', data);
      
      // Different possible response formats
      const deposits = Number(data.totalDeposits || data.deposits || data.total_deposits || 0);
      const withdrawals = Number(data.totalWithdrawals || data.withdrawals || data.total_withdrawals || 0);
      
      setTotalDeposits(deposits);
      setTotalWithdrawals(withdrawals);
      setTotalProfit(deposits - withdrawals);
      
    } catch (error) {
      console.error('Financial data fetch error:', error);
      setFinancialError(error instanceof Error ? error.message : 'Failed to fetch financial data');
      // Set demo data for testing
      setTotalDeposits(1250000);
      setTotalWithdrawals(890000);
      setTotalProfit(360000);
    } finally {
      setLoadingFinancial(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // keyboard close (Esc)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsOpen]);

  const NeonRail = useMemo(
    () => (
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-500 rounded-r-full shadow-[0_0_15px_2px_rgba(56,189,248,0.7)]" />
    ),
    []
  );

  const FinancialShimmer = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-3 rounded bg-gradient-to-r from-slate-700/50 to-slate-600/50" />
      <div className="h-3 w-2/3 rounded bg-gradient-to-r from-slate-700/50 to-slate-600/50" />
    </div>
  );

  const toggle = (i: number) => setExpanded((p) => ({ ...p, [i]: !p[i] }));

  const Badge = ({ text, type = "default" }: { text: string; type?: "default" | "premium" | "warning" | "success" }) => (
    <span className={cls(
      "px-2 py-1 text-xs font-medium rounded-full border",
      type === "premium" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
      type === "warning" ? "bg-red-500/20 text-red-300 border-red-500/30" :
      type === "success" ? "bg-green-500/20 text-green-300 border-green-500/30" :
      "bg-blue-500/20 text-blue-300 border-blue-500/30"
    )}>
      {text}
    </span>
  );

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <>
      {/* Sidebar shell */}
      <aside
        className={cls(
          "fixed inset-y-0 left-0 z-50 w-80 transform transition-all duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 backdrop-blur-2xl",
          "border-r border-white/5 shadow-2xl shadow-black/50",
          "flex flex-col"
        )}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-slate-900 shadow-lg animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                GD Matka
              </h2>
              <p className="text-xs text-slate-400/90 font-medium">Admin Control Panel</p>
            </div>
          </div>
          <button
            aria-label="Close sidebar"
            onClick={() => setIsOpen(false)}
            className="lg:hidden rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Financial Summary - FIXED SECTION */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-900/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Financial Summary</h3>
            <button 
              onClick={fetchFinancialData}
              disabled={loadingFinancial}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh financial data"
            >
              <RotateCw className={`h-3 w-3 text-slate-400 ${loadingFinancial ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {financialError && (
            <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-300">{financialError}</p>
              <p className="text-xs text-red-400/80 mt-1">Showing demo data</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-xs text-slate-400 mb-1">Deposits</div>
              <div className="text-sm font-semibold text-green-400">
                {loadingFinancial ? (
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  formatCurrency(totalDeposits || 0)
                )}
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-xs text-slate-400 mb-1">Withdrawals</div>
              <div className="text-sm font-semibold text-red-400">
                {loadingFinancial ? (
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  formatCurrency(totalWithdrawals || 0)
                )}
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-xs text-slate-400 mb-1">Profit</div>
              <div className="text-sm font-semibold text-blue-400">
                {loadingFinancial ? (
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse"></div>
                ) : (
                  formatCurrency(totalProfit || 0)
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span>
              {totalDeposits && totalWithdrawals ? 
                `${Math.round((totalWithdrawals / totalDeposits) * 100)}%` : '0%'
              }
            </span>
          </div>
          <div className="w-full bg-slate-700/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: totalDeposits && totalWithdrawals && totalDeposits > 0
                  ? `${Math.min(100, (totalWithdrawals / totalDeposits) * 100)}%` 
                  : '0%' 
              }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          <nav className="space-y-1">
            {NAV.map((item, i) => {
              const isActive = item.path ? pathname === item.path : false;
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;

              if (hasSubItems) {
                const isOpenGroup = !!expanded[i];
                const groupActive = item.subItems!.some((s) => pathname.startsWith(s.path));

                return (
                  <div key={`${item.label}-${i}`} className="group">
                    <button
                      onClick={() => toggle(i)}
                      aria-expanded={isOpenGroup}
                      className={cls(
                        "w-full flex items-center justify-between gap-3 rounded-xl transition-all duration-200",
                        "px-4 py-3",
                        groupActive
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                          : "hover:bg-white/5 hover:border-white/10 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cls(
                          "relative p-2 rounded-lg transition-all duration-200",
                          groupActive 
                            ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg" 
                            : "bg-slate-800/50 group-hover:bg-slate-700/50"
                        )}>
                          <Icon className={cls(
                            "h-4 w-4 transition-all",
                            groupActive ? "text-white" : "text-slate-300"
                          )} />
                          {item.premium && (
                            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                        <span className={cls(
                          "text-sm font-medium truncate",
                          groupActive ? "text-white" : "text-slate-200"
                        )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge text={item.badge} type={item.premium ? "premium" : "default"} />
                        )}
                      </div>
                      <ChevronDown
                        className={cls(
                          "h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                          isOpenGroup ? "rotate-180" : "rotate-0"
                        )}
                      />
                    </button>

                    <div
                      className={cls(
                        "ml-4 mt-1 overflow-hidden transition-all duration-300",
                        isOpenGroup ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="relative pl-3 py-2">
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded bg-gradient-to-b from-blue-500/50 to-purple-500/50" />
                        <div className="space-y-1">
                          {item.subItems!.map((s) => {
                            const active = pathname === s.path;
                            return (
                              <Link
                                key={s.path}
                                href={s.path}
                                className={cls(
                                  "block rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group/subitem",
                                  active
                                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                                    : "text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={cls(
                                      "h-2 w-2 rounded-full transition-all",
                                      active 
                                        ? "bg-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_6px_#60a5fa]" 
                                        : "bg-slate-600 group-hover/subitem:bg-slate-500"
                                    )} />
                                    <span className="truncate">{s.label}</span>
                                  </div>
                                  {s.badge && (
                                    <Badge text={s.badge} type="default" />
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Single link item
              return (
                <Link
                  key={`${item.label}-${i}`}
                  href={item.path!}
                  className={cls(
                    "group relative flex items-center gap-3 rounded-xl transition-all duration-200",
                    "px-4 py-3 border",
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "border-transparent hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  {isActive && <div className="absolute inset-y-0 -left-3">{NeonRail}</div>}
                  <div className={cls(
                    "relative p-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg" 
                      : "bg-slate-800/50 group-hover:bg-slate-700/50"
                  )}>
                    <item.icon className={cls(
                      "h-4 w-4 transition-all",
                      isActive ? "text-white" : "text-slate-300"
                    )} />
                    {item.premium && (
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
                    )}
                  </div>
                  <span className={cls(
                    "text-sm font-medium flex-1 truncate",
                    isActive ? "text-white" : "text-slate-200"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge 
                      text={item.badge} 
                      type={item.premium ? "premium" : item.badge === "Pending" ? "warning" : "default"} 
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>v2.1.0 • Premium</span>
            <span>🟢 Online</span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}



// "use client";
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   Home, Users, Gamepad, CheckCircle, UserCog, Wallet, ChevronDown,
//   Clipboard, Bell, WalletMinimal, PhoneCall, Play, Type, Download, X, Menu
// } from "lucide-react";

// /** ---------- types & utils ---------- */
// type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
// type SubItem = { path: string; label: string };
// type Item = { path?: string; icon: IconType; label: string; subItems?: SubItem[] };

// const cls = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");
// const storageKey = "gdmatka.sidebar.expanded";

// /** ---------- data ---------- */
// const NAV: Item[] = [
//   { path: "/dashboard", icon: Home, label: "Dashboard" },
//   {
//     label: "Game Management",
//     icon: Users,
//     subItems: [
//       { path: "/game-management/gamelist", label: "Game List" },
//       { path: "/game-management/gameprices", label: "Game Prices" },
//     ],
//   },
//   {
//     label: "Games & Numbers",
//     icon: Gamepad,
//     subItems: [
//       { path: "/games/single-digit", label: "Single Digit" },
//       { path: "/games/jodi-digit", label: "Jodi Digit" },
//       { path: "/games/single-pana", label: "Single Pana" },
//       { path: "/games/double-pana", label: "Double Pana" },
//       { path: "/games/triple-pana", label: "Triple Pana" },
//       { path: "/games/half-sangam", label: "Half Sangam" },
//       { path: "/games/full-sangam", label: "Full Sangam" },
//     ],
//   },
//   { path: "/user-management", icon: UserCog, label: "User Management" },
//   { path: "/declare-result", icon: CheckCircle, label: "Declare Result" },
//   { path: "/welcome-text", icon: Type, label: "Welcome Text" },
//   { path: "/withdrawals", icon: Wallet, label: "Withdrawal" },
//   { path: "/funds", icon: Wallet, label: "Funds" },
//   { path: "/upi", icon: Wallet, label: "UPI ID" },
//   { path: "/notice", icon: Clipboard, label: "Notice Board" },
//   { path: "/notifications", icon: Bell, label: "Notifications" },
//   { path: "/howtoplay", icon: Play, label: "How To Play" },
//   { path: "/bets", icon: CheckCircle, label: "Bets" },
//   { path: "/minimum", icon: WalletMinimal, label: "Minimum Limits" },
//   { path: "/contactinfo", icon: PhoneCall, label: "Contact Info" },
//   { path: "/apkupdate", icon: Download, label: "APK Update" },
//   { path: "/payment-gateway-management", icon: Wallet, label: "Payment Gateway" },
// ];

// interface SidebarProps {
//   isOpen: boolean;
//   setIsOpen: (v: boolean) => void;
// }

// /** ---------- component ---------- */
// export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
//   const pathname = usePathname();
//   const [expanded, setExpanded] = useState<Record<number, boolean>>({});
//   const [totalDeposits, setTotalDeposits] = useState<number | null>(null);
//   const [totalWithdrawals, setTotalWithdrawals] = useState<number | null>(null);
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // hydrate expanded state from localStorage
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem(storageKey);
//       if (raw) setExpanded(JSON.parse(raw));
//     } catch {}
//   }, []);
//   useEffect(() => {
//     try {
//       localStorage.setItem(storageKey, JSON.stringify(expanded));
//     } catch {}
//   }, [expanded]);

//   // Auto-expand group if current path falls inside it
//   useEffect(() => {
//     NAV.forEach((item, i) => {
//       if (!item.subItems) return;
//       const match = item.subItems.some((s) => pathname.startsWith(s.path));
//       if (match) {
//         setExpanded((p) => ({ ...p, [i]: true }));
//       }
//     });
//   }, [pathname]);

//   // financial summary
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch("https://backend.gdmatka.site/api/financial-summary", { cache: "no-store" });
//         if (!res.ok) return;
//         const data = await res.json();
//         setTotalDeposits(Number(data.totalDeposits ?? 0));
//         setTotalWithdrawals(Number(data.totalWithdrawals ?? 0));
//       } catch {
//         // silent fail – UI will show shimmer
//       }
//     })();
//   }, []);

//   // keyboard close (Esc)
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setIsOpen(false);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [setIsOpen]);

//   const NeonRail = useMemo(
//     () => (
//       <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-cyan-400 via-blue-500 to-fuchsia-500 rounded-r-full shadow-[0_0_18px_2px_rgba(56,189,248,0.6)]" />
//     ),
//     []
//   );

//   const Shimmer = () => (
//     <div className="animate-pulse space-y-2">
//       <div className="h-3 rounded bg-slate-700/50" />
//       <div className="h-3 w-2/3 rounded bg-slate-700/50" />
//     </div>
//   );

//   const toggle = (i: number) => setExpanded((p) => ({ ...p, [i]: !p[i] }));

//   return (
//     <>
//       {/* Sidebar shell */}
//       <aside
//         className={cls(
//           "fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300",
//           isOpen ? "translate-x-0" : "-translate-x-full",
//           "bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(59,130,246,0.15),transparent_60%)]",
//           "bg-slate-900/90 backdrop-blur-xl border-r border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.35)]",
//           "flex flex-col"
//         )}
//         aria-label="Sidebar navigation"
//       >
//         {/* Header */}
//         <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
//           <div className="flex items-center gap-3">
//             <div className="grid h-9 w-9 place-content-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-600 shadow-lg">
//               <Menu className="h-5 w-5 text-white" />
//             </div>
//             <div>
//               <h2 className="text-lg font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
//                 Admin Panel
//               </h2>
//               <p className="text-[11px] text-slate-400/80">GD Matka • Control Center</p>
//             </div>
//           </div>
//           <button
//             aria-label="Close sidebar"
//             onClick={() => setIsOpen(false)}
//             className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
//           >
//             <X className="h-5 w-5" />
//           </button>
//           {/* subtle glow */}
//           <div className="pointer-events-none absolute -inset-x-4 -bottom-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
//         </div>

//         {/* Nav */}
//         <div
//           ref={scrollRef}
//           className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent"
//         >
//           {NAV.map((item, i) => {
//             const isActive = item.path ? pathname === item.path : false;
//             const Icon = item.icon;

//             if (item.subItems) {
//               const isOpenGroup = !!expanded[i];
//               const groupActive = item.subItems.some((s) => pathname.startsWith(s.path));

//               return (
//                 <div key={`${item.label}-${i}`} className="mb-1.5">
//                   <button
//                     onClick={() => toggle(i)}
//                     aria-expanded={isOpenGroup}
//                     className={cls(
//                       "group w-full flex items-center justify-between gap-3 rounded-xl border transition-all",
//                       "px-3.5 py-2.5",
//                       groupActive
//                         ? "border-blue-500/30 bg-blue-500/10 shadow-[inset_0_0_10px_rgba(37,99,235,0.20)]"
//                         ? "border-blue-500/30 bg-blue-500/10"
//                         : ""
//                         : "border-white/5 hover:border-white/10 hover:bg-white/5"
//                     )}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={cls(
//                         "grid h-9 w-9 place-content-center rounded-lg transition-all",
//                         groupActive ? "bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30" : "bg-white/5 group-hover:bg-white/10"
//                       )}>
//                         <Icon className={cls("h-5 w-5", groupActive ? "text-blue-400" : "text-slate-300")} />
//                       </div>
//                       <span className={cls("text-sm font-medium", groupActive ? "text-white" : "text-slate-200")}>
//                         {item.label}
//                       </span>
//                     </div>
//                     <ChevronDown
//                       className={cls(
//                         "h-4 w-4 text-slate-400 transition-transform",
//                         isOpenGroup ? "rotate-180" : "rotate-0"
//                       )}
//                     />
//                   </button>

//                   <div
//                     className={cls(
//                       "ml-5 mt-1 overflow-hidden transition-all",
//                       isOpenGroup ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
//                     )}
//                   >
//                     <div className="relative pl-4 py-2">
//                       {/* vertical neon rail */}
//                       <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded bg-gradient-to-b from-blue-500 via-cyan-400 to-fuchsia-500 opacity-70" />
//                       <div className="space-y-1.5">
//                         {item.subItems.map((s) => {
//                           const active = pathname === s.path;
//                           return (
//                             <Link
//                               key={s.path}
//                               href={s.path}
//                               className={cls(
//                                 "block rounded-lg px-3 py-2 text-sm transition",
//                                 active
//                                   ? "relative bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/30"
//                                   : "text-slate-300 hover:text-white hover:bg-white/5 ring-1 ring-transparent hover:ring-white/10"
//                               )}
//                             >
//                               <div className="flex items-center gap-2.5">
//                                 <span
//                                   className={cls(
//                                     "h-1.5 w-1.5 rounded-full",
//                                     active ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.9)]" : "bg-slate-500"
//                                   )}
//                                 />
//                                 <span className="truncate">{s.label}</span>
//                               </div>
//                               {active && <div className="absolute inset-y-0 -left-3">{NeonRail}</div>}
//                             </Link>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             }

//             // single link
//             return (
//               <Link
//                 key={`${item.label}-${i}`}
//                 href={item.path!}
//                 className={cls(
//                   "group relative mb-1.5 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition",
//                   isActive
//                     ? "border-blue-500/30 bg-blue-500/10 shadow-[inset_0_0_10px_rgba(37,99,235,0.20)]"
//                     : "border-white/5 hover:border-white/10 hover:bg-white/5"
//                 )}
//               >
//                 {isActive && <div className="absolute inset-y-0 -left-3">{NeonRail}</div>}
//                 <div
//                   className={cls(
//                     "grid h-9 w-9 place-content-center rounded-lg transition-all",
//                     isActive ? "bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30" : "bg-white/5 group-hover:bg-white/10"
//                   )}
//                 >
//                   <item.icon className={cls("h-5 w-5", isActive ? "text-blue-400" : "text-slate-300")} />
//                 </div>
//                 <span className={cls("text-sm font-medium", isActive ? "text-white" : "text-slate-200")}>
//                   {item.label}
//                 </span>
//               </Link>
//             );
//           })}
//         </div>

//         {/* Financial Summary */}
//         <div className="mt-auto border-t border-white/10 px-4 py-3">
//           <div className="grid grid-cols-2 gap-3">
//             <div className="rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
//               <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Deposits</p>
//               <div className="mt-1 text-sm font-semibold text-emerald-400">
//                 {totalDeposits === null ? <Shimmer /> : <>₹{totalDeposits.toLocaleString("en-IN")}</>}
//               </div>
//             </div>
//             <div className="rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
//               <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Withdrawals</p>
//               <div className="mt-1 text-sm font-semibold text-rose-400">
//                 {totalWithdrawals === null ? <Shimmer /> : <>₹{totalWithdrawals.toLocaleString("en-IN")}</>}
//               </div>
//             </div>
//           </div>
//           <p className="mt-2 text-[10px] text-slate-500">
//             Figures auto-refresh on reload • Live snapshot
//           </p>
//         </div>

//         {/* Footer gradient */}
//         <div className="h-4 bg-gradient-to-t from-slate-900/90 to-transparent" />
//       </aside>

//       {/* Overlay for mobile */}
//       {isOpen && (
//         <button
//           className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
//           aria-label="Close sidebar overlay"
//           onClick={() => setIsOpen(false)}
//         />
//       )}
//     </>
//   );
// }


// "use client";
// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from 'next/navigation';
// import {
//   Home, Users, Gamepad, CheckCircle, UserCog, Wallet, ChevronDown,
//   Clipboard, Bell, WalletMinimal, PhoneCall, Play, Type, ChevronRight, Download, X, Menu
// } from "lucide-react";

// export default function Sidebar({ isOpen, setIsOpen }) {
//   const [expandedMenus, setExpandedMenus] = useState({});
//   const activePath = usePathname();

//   const navItems = [
//     { path: "/dashboard", icon: Home, label: "Dashboard" },
//     {
//       label: "Game Management",
//       icon: Users,
//       subItems: [
//         { path: "/game-management/gamelist", label: "Game List" },
//         { path: "/game-management/gameprices", label: "Game Prices" },
//       ],
//     },
//     {
//       label: "Games and Numbers",
//       icon: Gamepad,
//       subItems: [
//         { path: "/games/single-digit", label: "Single Digit" },
//         { path: "/games/jodi-digit", label: "Jodi Digit" },
//         { path: "/games/single-pana", label: "Single Pana" },
//         { path: "/games/double-pana", label: "Double Pana" },
//         { path: "/games/triple-pana", label: "Triple Pana" },
//         { path: "/games/half-sangam", label: "Half Sangam" },
//         { path: "/games/full-sangam", label: "Full Sangam" },
//       ],
//     },
//     { path: "/user-management", icon: UserCog, label: "User Management" },
//     { path: "/declare-result", icon: CheckCircle, label: "Declare Result" },
//     { path: "/welcome-text", icon: Type, label: "Welcome Text" },
//     { path: "/withdrawals", icon: Wallet, label: "Withdrawal" },
//     { path: "/funds", icon: Wallet, label: "Funds" },
//     { path: "/upi", icon: Wallet, label: "UPI ID" },
//     { path: "/notice", icon: Clipboard, label: "Notice Board" },
//     { path: "/notifications", icon: Bell, label: "Notifications" },
//     { path: "/howtoplay", icon: Play, label: "How To Play" },
//     { path: "/bets", icon: CheckCircle, label: "Bets" },
//     { path: "/minimum", icon: WalletMinimal, label: "Minimum Limits" },
//     { path: "/contactinfo", icon: PhoneCall, label: "Contact Info" },
//     { path: "/apkupdate", icon: Download, label: "APK Update" },
//     { path: "/payment-gateway-management", icon: Wallet, label: "Payment Gateway" }
//   ];

//   const toggleMenu = (index) => {
//     setExpandedMenus(prev => ({ ...prev, [index]: !prev[index] }));
//   };

//   return (
//     <>
//       {/* Sidebar */}
//       <aside className={`fixed inset-y-0 left-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl text-white w-72 min-h-screen border-r border-slate-700/50 flex flex-col transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-all duration-300 ease-in-out z-50 shadow-2xl`}>
        
//         {/* Header */}
//         <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
//               <Menu size={18} className="text-white" />
//             </div>
//             <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
//               Admin Panel
//             </h2>
//           </div>
//           <button 
//             onClick={() => setIsOpen(false)} 
//             className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-110"
//           >
//             <X size={20} className="text-slate-400 hover:text-white" />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
//           {navItems.map(({ path, icon: Icon, label, subItems }, index) => (
//             <div key={`${label}-${index}`} className="group">
//               {subItems ? (
//                 <div>
//                   <button
//                     onClick={() => toggleMenu(index)}
//                     className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 hover:bg-slate-700/50 hover:shadow-lg group-hover:scale-[1.02] border border-transparent hover:border-slate-600/50"
//                   >
//                     <div className="flex items-center gap-3">
//                       {Icon && (
//                         <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-gradient-to-r group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-200">
//                           <Icon size={18} className="text-slate-300 group-hover:text-blue-400" />
//                         </div>
//                       )}
//                       <span className="text-sm font-medium text-slate-200 group-hover:text-white">{label}</span>
//                     </div>
//                     <ChevronDown 
//                       size={16} 
//                       className={`transition-all duration-200 text-slate-400 group-hover:text-blue-400 ${
//                         expandedMenus[index] ? "rotate-180" : ""
//                       }`} 
//                     />
//                   </button>
                  
//                   <div className={`overflow-hidden transition-all duration-300 ${
//                     expandedMenus[index] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
//                   }`}>
//                     <div className="ml-6 mt-2 pl-4 border-l-2 border-gradient-to-b from-blue-500 to-purple-600 space-y-1 py-2">
//                       {subItems.map((subItem) => (
//                         <Link 
//                           key={subItem.path} 
//                           href={subItem.path} 
//                           className={`block py-2.5 px-4 text-sm rounded-lg transition-all duration-200 border border-transparent ${
//                             activePath === subItem.path 
//                               ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 font-semibold border-blue-500/30 shadow-lg" 
//                               : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:border-slate-600/50 hover:shadow-md"
//                           }`}
//                         >
//                           <div className="flex items-center gap-2">
//                             <div className={`w-1.5 h-1.5 rounded-full ${
//                               activePath === subItem.path ? "bg-blue-400" : "bg-slate-500"
//                             }`}></div>
//                             {subItem.label}
//                           </div>
//                         </Link>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <Link 
//                   href={path} 
//                   className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border border-transparent hover:scale-[1.02] ${
//                     activePath === path 
//                       ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30 shadow-lg" 
//                       : "hover:bg-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600/50 hover:shadow-lg"
//                   }`}
//                 >
//                   {Icon && (
//                     <div className={`p-2 rounded-lg transition-all duration-200 ${
//                       activePath === path
//                         ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30"
//                         : "bg-slate-700/50 group-hover:bg-gradient-to-r group-hover:from-blue-500/20 group-hover:to-purple-500/20"
//                     }`}>
//                       <Icon size={18} className={activePath === path ? "text-blue-400" : "text-slate-300"} />
//                     </div>
//                   )}
//                   <span className="text-sm font-medium">{label}</span>
//                 </Link>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* Footer gradient */}
//         <div className="h-4 bg-gradient-to-t from-slate-900 to-transparent"></div>
//       </aside>

//       {/* Overlay */}
//       {isOpen && (
//         <div 
//           onClick={() => setIsOpen(false)} 
//           className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
//         ></div>
//       )}
//     </>
//   );
// } 