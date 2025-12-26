"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Save, Settings, IndianRupee, Calendar, Clock, Ban, Zap, Wallet, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type LimitRow = {
    limit_id: number;
    limit_type: string;
    game_name: string | null;
    min_amount: number;
};

type AppSettings = {
    id: number;
    withdrawal_enabled: boolean;
    withdrawal_open_time: string;
    withdrawal_close_time: string;
    max_requests_per_day: number;
    withdrawal_holiday_days: string;
};

type FrontendSettings = Omit<AppSettings, 'withdrawal_holiday_days'> & {
    withdrawal_holiday_days: string[];
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MinimumLimitsPage = () => {
    const router = useRouter();
    const [limits, setLimits] = useState<LimitRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingLimitId, setUpdatingLimitId] = useState<number | null>(null);

    const [settings, setSettings] = useState<FrontendSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);

    useEffect(() => {
        fetchMinimumLimits();
        fetchAppSettings();
    }, []);

    /* ========== Minimum Limits ========== */
    const fetchMinimumLimits = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("https://backend.gdmatka.site/api/minimumlimits", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch minimum limits");
            const data = await response.json();
            setLimits(data);
        } catch (error) {
            console.error(error);
            alert("Error fetching minimum limits. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const updatedLimits = limits.map((limit) =>
            limit.limit_id === id ? { ...limit, min_amount: parseFloat(event.target.value) || 0 } : limit
        );
        setLimits(updatedLimits);
    };

    const handleUpdate = async (id: number) => {
        const limitToUpdate = limits.find((limit) => limit.limit_id === id);
        if (!limitToUpdate) return;

        if (isNaN(limitToUpdate.min_amount) || Number(limitToUpdate.min_amount) <= 0) {
            alert("Please enter a valid minimum amount.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Authentication token is missing.");
            return;
        }

        setUpdatingLimitId(id);
        try {
            const response = await fetch(`https://backend.gdmatka.site/api/minimumlimits/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    limit_type: limitToUpdate.limit_type,
                    game_name: limitToUpdate.game_name,
                    min_amount: limitToUpdate.min_amount
                }),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setLimits((prev) =>
                    prev.map((limit) =>
                        limit.limit_id === id ? { ...limit, min_amount: updatedData.min_amount } : limit
                    )
                );
                alert("Minimum limit updated successfully!");
            } else {
                alert("Failed to update the minimum limit.");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating the minimum limit. Please try again.");
        } finally {
            setUpdatingLimitId(null);
        }
    };

    const getLimitTitle = (limit: LimitRow) => {
        if (limit.limit_type === "deposit") return "Minimum Deposit";
        if (limit.limit_type === "withdrawal") return "Minimum Withdrawal";
        return `${limit.game_name} Minimum Bet`;
    };

    const getLimitIcon = (limitType: string) => {
        switch (limitType) {
            case "deposit": return <Wallet className="h-5 w-5 text-blue-500" />;
            case "withdrawal": return <Coins className="h-5 w-5 text-green-500" />;
            default: return <Zap className="h-5 w-5 text-orange-500" />;
        }
    };

    /* ========== App Settings (Withdrawal window) ========== */
    const fetchAppSettings = async () => {
        setSettingsLoading(true);
        try {
            const response = await fetch("https://backend.gdmatka.site/api/app-settings");
            if (!response.ok) throw new Error("Failed to fetch app settings");
            const data: AppSettings = await response.json();

            const toHHMM = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : "10:00");
            setSettings({
                ...data,
                withdrawal_open_time: toHHMM(data.withdrawal_open_time),
                withdrawal_close_time: toHHMM(data.withdrawal_close_time),
                max_requests_per_day: data.max_requests_per_day || 3,
                withdrawal_holiday_days: data.withdrawal_holiday_days ? data.withdrawal_holiday_days.split(',') : [],
            });
        } catch (e) {
            console.error(e);
            alert("Error fetching withdrawal settings.");
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleHolidayChange = (day: string, checked: boolean) => {
        if (!settings) return;
        const currentHolidays = settings.withdrawal_holiday_days;
        let newHolidays: string[];

        if (checked) {
            newHolidays = [...currentHolidays, day];
        } else {
            newHolidays = currentHolidays.filter(d => d !== day);
        }
        setSettings({ ...settings, withdrawal_holiday_days: newHolidays });
    };

    const saveAppSettings = async () => {
        if (!settings) return;
        const timeRe = /^\d{2}:\d{2}$/;
        if (!timeRe.test(settings.withdrawal_open_time) || !timeRe.test(settings.withdrawal_close_time)) {
            alert("Please enter time in HH:MM (24-hr) format.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Admin token missing. Please login again.");
            return;
        }

        setSettingsSaving(true);
        try {
            const response = await fetch("https://backend.gdmatka.site/api/app-settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    withdrawal_enabled: Boolean(settings.withdrawal_enabled),
                    withdrawal_open_time: settings.withdrawal_open_time,
                    withdrawal_close_time: settings.withdrawal_close_time,
                    max_requests_per_day: settings.max_requests_per_day,
                    withdrawal_holiday_days: settings.withdrawal_holiday_days,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
            await fetchAppSettings();
            alert("Withdrawal settings updated.");
        } catch (e) {
            console.error(e);
            alert("Error updating settings.");
        } finally {
            setSettingsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 shadow-sm border-gray-200"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Limit Management</h1>
                            <p className="text-gray-600 mt-1">Configure minimum amounts and withdrawal settings</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={fetchMinimumLimits}
                            disabled={isLoading}
                            className="shadow-sm"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh Limits
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Deposit Limits</p>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">
                                        ₹{limits.find(l => l.limit_type === "deposit")?.min_amount || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-200 rounded-full">
                                    <Wallet className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Withdrawal Limits</p>
                                    <p className="text-2xl font-bold text-green-900 mt-1">
                                        ₹{limits.find(l => l.limit_type === "withdrawal")?.min_amount || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-200 rounded-full">
                                    <Coins className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-600">Game Limits</p>
                                    <p className="text-2xl font-bold text-orange-900 mt-1">
                                        {limits.filter(l => l.limit_type === "game_bet").length}
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-200 rounded-full">
                                    <Zap className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Minimum Limits Card */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-blue-600" />
                                    Minimum Amount Limits
                                </CardTitle>
                                <Badge variant="secondary" className="text-sm">
                                    {limits.length} Limits
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <RefreshCw className="animate-spin text-gray-400 mr-3 h-6 w-6" />
                                    <span className="text-gray-500">Loading limits...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {limits.map((limit) => (
                                        <div
                                            key={limit.limit_id}
                                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getLimitIcon(limit.limit_type)}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {getLimitTitle(limit)}
                                                    </h3>
                                                    {limit.limit_type === "game_bet" && (
                                                        <p className="text-sm text-gray-500">Game: {limit.game_name}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        value={limit.min_amount}
                                                        onChange={(e) => handleChange(limit.limit_id, e)}
                                                        className="w-32 pl-8 text-right font-medium"
                                                        disabled={updatingLimitId === limit.limit_id}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => handleUpdate(limit.limit_id)}
                                                    disabled={updatingLimitId === limit.limit_id}
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {updatingLimitId === limit.limit_id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Update"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Withdrawal Settings Card */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-green-600" />
                                    Withdrawal Settings
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    onClick={fetchAppSettings}
                                    disabled={settingsLoading}
                                    size="sm"
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${settingsLoading ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {settingsLoading || !settings ? (
                                <div className="flex justify-center items-center h-48">
                                    <RefreshCw className="animate-spin text-gray-400 mr-3 h-6 w-6" />
                                    <span className="text-gray-500">Loading settings...</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Enable Withdrawals */}
                                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Enable Withdrawals</h3>
                                            <p className="text-sm text-gray-500">Allow users to withdraw funds</p>
                                        </div>
                                        <Switch
                                            checked={settings.withdrawal_enabled}
                                            onCheckedChange={(checked) =>
                                                setSettings({ ...settings, withdrawal_enabled: checked })
                                            }
                                        />
                                    </div>

                                    {/* Time Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                                Open Time
                                            </label>
                                            <Input
                                                type="time"
                                                value={settings.withdrawal_open_time}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, withdrawal_open_time: e.target.value })
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                                                <Clock className="h-4 w-4 text-red-500" />
                                                Close Time
                                            </label>
                                            <Input
                                                type="time"
                                                value={settings.withdrawal_close_time}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, withdrawal_close_time: e.target.value })
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Max Requests */}
                                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Maximum Requests Per Day
                                        </label>
                                        <Input
                                            type="number"
                                            value={settings.max_requests_per_day}
                                            onChange={(e) =>
                                                setSettings({ ...settings, max_requests_per_day: parseInt(e.target.value) || 0 })
                                            }
                                            placeholder="e.g., 3"
                                            min="1"
                                            max="10"
                                        />
                                    </div>

                                    {/* Holiday Days */}
                                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Ban className="h-4 w-4 text-orange-500" />
                                            <h3 className="font-semibold text-gray-900">Holiday Days</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">Select days when withdrawals are disabled</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {daysOfWeek.map((day) => (
                                                <div key={day} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`day-${day}`}
                                                        checked={settings.withdrawal_holiday_days.includes(day)}
                                                        onCheckedChange={(checked) => handleHolidayChange(day, !!checked)}
                                                    />
                                                    <Label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                                                        {day.slice(0, 3)}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end pt-4">
                                        <Button 
                                            onClick={saveAppSettings} 
                                            disabled={settingsSaving}
                                            className="bg-green-600 hover:bg-green-700"
                                            size="lg"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {settingsSaving ? "Saving..." : "Save Settings"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MinimumLimitsPage;


// "use client";
// import { useState, useEffect } from "react";
// import { ArrowLeft, RefreshCw, Save } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";

// type LimitRow = {
//     limit_id: number;
//     limit_type: string;
//     game_name: string | null;
//     min_amount: number;
// };

// type AppSettings = {
//     id: number;
//     withdrawal_enabled: boolean;
//     withdrawal_open_time: string;
//     withdrawal_close_time: string;
//     max_requests_per_day: number;
//     withdrawal_holiday_days: string; // API से स्ट्रिंग आएगी
// };

// // फ्रंटएंड में हम इसे string[] की तरह मैनेज करेंगे
// type FrontendSettings = Omit<AppSettings, 'withdrawal_holiday_days'> & {
//     withdrawal_holiday_days: string[];
// };

// const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// const MinimumLimitsPage = () => {
//     const router = useRouter();
//     const [limits, setLimits] = useState<LimitRow[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [updatingLimitId, setUpdatingLimitId] = useState<number | null>(null);

//     const [settings, setSettings] = useState<FrontendSettings | null>(null);
//     const [settingsLoading, setSettingsLoading] = useState(true);
//     const [settingsSaving, setSettingsSaving] = useState(false);

//     useEffect(() => {
//         fetchMinimumLimits();
//         fetchAppSettings();
//     }, []);

//     /* ========== Minimum Limits ========== */
//     const fetchMinimumLimits = async () => {
//         setIsLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const response = await fetch("https://backend.gdmatka.site/api/minimumlimits", {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (!response.ok) throw new Error("Failed to fetch minimum limits");
//             const data = await response.json();
//             setLimits(data);
//         } catch (error) {
//             console.error(error);
//             alert("Error fetching minimum limits. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
//         const updatedLimits = limits.map((limit) =>
//             limit.limit_id === id ? { ...limit, min_amount: parseFloat(event.target.value) || 0 } : limit
//         );
//         setLimits(updatedLimits);
//     };

//     const handleUpdate = async (id: number) => {
//         const limitToUpdate = limits.find((limit) => limit.limit_id === id);
//         if (!limitToUpdate) return;

//         if (isNaN(limitToUpdate.min_amount) || Number(limitToUpdate.min_amount) <= 0) {
//             alert("Please enter a valid minimum amount.");
//             return;
//         }

//         const token = localStorage.getItem("token");
//         if (!token) {
//             alert("Authentication token is missing.");
//             return;
//         }

//         setUpdatingLimitId(id);
//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/minimumlimits/${id}`, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     limit_type: limitToUpdate.limit_type,
//                     game_name: limitToUpdate.game_name,
//                     min_amount: limitToUpdate.min_amount
//                 }),
//             });

//             if (response.ok) {
//                 const updatedData = await response.json();
//                 setLimits((prev) =>
//                     prev.map((limit) =>
//                         limit.limit_id === id ? { ...limit, min_amount: updatedData.min_amount } : limit
//                     )
//                 );
//                 alert("Minimum limit updated successfully!");
//             } else {
//                 alert("Failed to update the minimum limit.");
//             }
//         } catch (error) {
//             console.error(error);
//             alert("Error updating the minimum limit. Please try again.");
//         } finally {
//             setUpdatingLimitId(null);
//         }
//     };

//     const getLimitTitle = (limit: LimitRow) => {
//         if (limit.limit_type === "deposit") return "Minimum Deposit";
//         if (limit.limit_type === "withdrawal") return "Minimum Withdrawal";
//         return `${limit.game_name} Minimum Bet`;
//     };

//     /* ========== App Settings (Withdrawal window) ========== */
//     const fetchAppSettings = async () => {
//         setSettingsLoading(true);
//         try {
//             const response = await fetch("https://backend.gdmatka.site/api/app-settings");
//             if (!response.ok) throw new Error("Failed to fetch app settings");
//             const data: AppSettings = await response.json();

//             const toHHMM = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : "10:00");
//             setSettings({
//                 ...data,
//                 withdrawal_open_time: toHHMM(data.withdrawal_open_time),
//                 withdrawal_close_time: toHHMM(data.withdrawal_close_time),
//                 max_requests_per_day: data.max_requests_per_day || 3,
//                 withdrawal_holiday_days: data.withdrawal_holiday_days ? data.withdrawal_holiday_days.split(',') : [],
//             });
//         } catch (e) {
//             console.error(e);
//             alert("Error fetching withdrawal settings.");
//         } finally {
//             setSettingsLoading(false);
//         }
//     };

//     const handleHolidayChange = (day: string, checked: boolean) => {
//         if (!settings) return;
//         const currentHolidays = settings.withdrawal_holiday_days;
//         let newHolidays: string[];

//         if (checked) {
//             newHolidays = [...currentHolidays, day];
//         } else {
//             newHolidays = currentHolidays.filter(d => d !== day);
//         }
//         setSettings({ ...settings, withdrawal_holiday_days: newHolidays });
//     };

//     const saveAppSettings = async () => {
//         if (!settings) return;
//         const timeRe = /^\d{2}:\d{2}$/;
//         if (!timeRe.test(settings.withdrawal_open_time) || !timeRe.test(settings.withdrawal_close_time)) {
//             alert("Please enter time in HH:MM (24-hr) format.");
//             return;
//         }

//         const token = localStorage.getItem("token");
//         if (!token) {
//             alert("Admin token missing. Please login again.");
//             return;
//         }

//         setSettingsSaving(true);
//         try {
//             const response = await fetch("https://backend.gdmatka.site/api/app-settings", {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     withdrawal_enabled: Boolean(settings.withdrawal_enabled),
//                     withdrawal_open_time: settings.withdrawal_open_time,
//                     withdrawal_close_time: settings.withdrawal_close_time,
//                     max_requests_per_day: settings.max_requests_per_day,
//                     withdrawal_holiday_days: settings.withdrawal_holiday_days, // ऐरे भेजें
//                 }),
//             });

//             if (!response.ok) {
//                 throw new Error("Failed to save settings");
//             }
//             await fetchAppSettings();
//             alert("Withdrawal settings updated.");
//         } catch (e) {
//             console.error(e);
//             alert("Error updating settings.");
//         } finally {
//             setSettingsSaving(false);
//         }
//     };

//     return (
//         <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-6">
//             {/* ---------------- MINIMUM LIMITS ---------------- */}
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <div className="flex items-center space-x-2 md:space-x-4">
//                         <Button
//                             variant="outline"
//                             size="icon"
//                             onClick={() => router.back()}
//                             className="h-8 w-8 md:h-10 md:w-10"
//                         >
//                             <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
//                         </Button>
//                         <CardTitle className="text-lg md:text-2xl font-bold">Minimum Limits</CardTitle>
//                     </div>
//                     <Button
//                         variant="outline"
//                         onClick={fetchMinimumLimits}
//                         disabled={isLoading}
//                         className="w-full sm:w-auto"
//                         size="sm"
//                     >
//                         <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
//                         Refresh
//                     </Button>
//                 </CardHeader>

//                 <CardContent>
//                     {isLoading ? (
//                         <div className="flex justify-center items-center h-48 md:h-64">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading minimum limits...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-3 md:space-y-4">
//                             {limits.map((limit) => (
//                                 <div
//                                     key={limit.limit_id}
//                                     className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-3 md:p-4 rounded-lg"
//                                 >
//                                     <div className="flex-1 mb-3 sm:mb-0">
//                                         <h3 className="text-base md:text-lg font-semibold">{getLimitTitle(limit)}</h3>
//                                         {limit.limit_type === "game_bet" && (
//                                             <p className="text-gray-500 text-sm md:text-base">Game Type: {limit.game_name}</p>
//                                         )}
//                                     </div>

//                                     <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
//                                         <div className="flex items-center w-full sm:w-auto">
//                                             <span className="text-gray-500 mr-2 whitespace-nowrap">₹</span>
//                                             <Input
//                                                 type="number"
//                                                 value={limit.min_amount}
//                                                 onChange={(e) => handleChange(limit.limit_id, e)}
//                                                 className="w-full sm:w-24 text-right"
//                                                 disabled={isLoading || updatingLimitId === limit.limit_id}
//                                             />
//                                         </div>

//                                         <Button
//                                             onClick={() => handleUpdate(limit.limit_id)}
//                                             disabled={isLoading || updatingLimitId === limit.limit_id}
//                                             variant="default"
//                                             className="w-full sm:w-auto"
//                                             size="sm"
//                                         >
//                                             {updatingLimitId === limit.limit_id ? "Updating..." : "Update"}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* ---------------- WITHDRAWAL SETTINGS (APP) ---------------- */}
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <CardTitle className="text-lg md:text-2xl font-bold">Withdrawal Settings (App)</CardTitle>
//                     <div className="flex gap-2">
//                         <Button
//                             variant="outline"
//                             onClick={fetchAppSettings}
//                             disabled={settingsLoading}
//                             className="w-full sm:w-auto"
//                             size="sm"
//                         >
//                             <RefreshCw className={`h-4 w-4 mr-2 ${settingsLoading ? "animate-spin" : ""}`} />
//                             Refresh
//                         </Button>
//                     </div>
//                 </CardHeader>
//                 <CardContent>
//                     {settingsLoading || !settings ? (
//                         <div className="flex justify-center items-center h-40">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading settings...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-4">
//                             <div className="flex items-center justify-between bg-gray-100 p-3 md:p-4 rounded-lg">
//                                 <div>
//                                     <p className="font-semibold">Enable Withdrawals</p>
//                                     <p className="text-sm text-gray-500">Turn ON/OFF withdrawals in the app.</p>
//                                 </div>
//                                 <label className="inline-flex items-center cursor-pointer select-none">
//                                     <input
//                                         type="checkbox"
//                                         className="sr-only peer"
//                                         checked={settings.withdrawal_enabled}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, withdrawal_enabled: e.target.checked })
//                                         }
//                                     />
//                                     <div className="w-11 h-6 bg-gray-300 rounded-full peer focus:outline-none peer-checked:bg-blue-600 relative transition">
//                                         <span className="absolute left-0.5 top-0.5 h-5 w-5 bg-white rounded-full transition peer-checked:translate-x-5" />
//                                     </div>
//                                 </label>
//                             </div>

//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 <div className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                     <label className="text-sm text-gray-600">Open Time (24-hr)</label>
//                                     <Input
//                                         type="time"
//                                         step={60}
//                                         value={settings.withdrawal_open_time}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, withdrawal_open_time: e.target.value })
//                                         }
//                                         className="mt-1"
//                                     />
//                                 </div>
//                                 <div className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                     <label className="text-sm text-gray-600">Close Time (24-hr)</label>
//                                     <Input
//                                         type="time"
//                                         step={60}
//                                         value={settings.withdrawal_close_time}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, withdrawal_close_time: e.target.value })
//                                         }
//                                         className="mt-1"
//                                     />
//                                 </div>
//                                 <div className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                     <label className="text-sm text-gray-600">Max Requests / Day</label>
//                                     <Input
//                                         type="number"
//                                         value={settings.max_requests_per_day}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, max_requests_per_day: parseInt(e.target.value) || 0 })
//                                         }
//                                         className="mt-1"
//                                         placeholder="e.g., 3"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                 <Label className="text-base font-semibold">Withdrawal Holiday Days</Label>
//                                 <p className="text-sm text-gray-500 mb-3">
//                                     Select the days when withdrawals will be disabled.
//                                 </p>
//                                 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
//                                     {daysOfWeek.map((day) => (
//                                         <div key={day} className="flex items-center space-x-2">
//                                             <Checkbox
//                                                 id={`day-${day}`}
//                                                 checked={settings.withdrawal_holiday_days.includes(day)}
//                                                 onCheckedChange={(checked) => handleHolidayChange(day, !!checked)}
//                                             />
//                                             <Label htmlFor={`day-${day}`} className="cursor-pointer">
//                                                 {day}
//                                             </Label>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="flex justify-end">
//                                 <Button onClick={saveAppSettings} disabled={settingsSaving} size="sm">
//                                     <Save className="h-4 w-4 mr-2" />
//                                     {settingsSaving ? "Saving..." : "Save Settings"}
//                                 </Button>
//                             </div>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default MinimumLimitsPage;

// "use client";
// import { useState, useEffect } from "react";
// import { ArrowLeft, RefreshCw, Save } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// type LimitRow = {
//     limit_id: number;
//     limit_type: string;      // 'deposit' | 'withdrawal' | 'game_bet'
//     game_name: string | null;
//     min_amount: number;
// };

// type AppSettings = {
//     id: number;
//     withdrawal_enabled: boolean;
//     withdrawal_open_time: string;   // "HH:MM:SS" (API) — UI me "HH:MM" dikha rahe
//     withdrawal_close_time: string;  // "HH:MM:SS"
// };

// const MinimumLimitsPage = () => {
//     const router = useRouter();

//     // Minimum limits state
//     const [limits, setLimits] = useState<LimitRow[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [updatingLimitId, setUpdatingLimitId] = useState<number | null>(null);

//     // App Settings state
//     const [settings, setSettings] = useState<AppSettings | null>(null);
//     const [settingsLoading, setSettingsLoading] = useState(true);
//     const [settingsSaving, setSettingsSaving] = useState(false);

//     useEffect(() => {
//         fetchMinimumLimits();
//         fetchAppSettings();
//     }, []);

//     /* ========== Minimum Limits ========== */
//     const fetchMinimumLimits = async () => {
//         setIsLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const response = await fetch("https://backend.gdmatka.site/api/minimumlimits", {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (!response.ok) throw new Error("Failed to fetch minimum limits");
//             const data = await response.json();
//             setLimits(data);
//         } catch (error) {
//             console.error(error);
//             alert("Error fetching minimum limits. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
//         const updatedLimits = limits.map((limit) =>
//             limit.limit_id === id ? { ...limit, min_amount: parseFloat(event.target.value) || 0 } : limit
//         );
//         setLimits(updatedLimits);
//     };

//     const handleUpdate = async (id: number) => {
//         const limitToUpdate = limits.find((limit) => limit.limit_id === id);
//         if (!limitToUpdate) return;

//         if (isNaN(limitToUpdate.min_amount) || Number(limitToUpdate.min_amount) <= 0) {
//             alert("Please enter a valid minimum amount.");
//             return;
//         }

//         const token = localStorage.getItem("token");
//         if (!token) {
//             alert("Authentication token is missing.");
//             return;
//         }

//         setUpdatingLimitId(id);

//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/minimumlimits/${id}`, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     limit_type: limitToUpdate.limit_type,
//                     game_name: limitToUpdate.game_name,
//                     min_amount: limitToUpdate.min_amount
//                 }),
//             });

//             if (response.ok) {
//                 const updatedData = await response.json();
//                 setLimits((prev) =>
//                     prev.map((limit) =>
//                         limit.limit_id === id ? { ...limit, min_amount: updatedData.min_amount } : limit
//                     )
//                 );
//                 alert("Minimum limit updated successfully!");
//             } else {
//                 const txt = await response.text();
//                 console.error(txt);
//                 alert("Failed to update the minimum limit.");
//             }
//         } catch (error) {
//             console.error(error);
//             alert("Error updating the minimum limit. Please try again.");
//         } finally {
//             setUpdatingLimitId(null);
//         }
//     };

//     const getLimitTitle = (limit: LimitRow) => {
//         if (limit.limit_type === "deposit") return "Minimum Deposit";
//         if (limit.limit_type === "withdrawal") return "Minimum Withdrawal";
//         return `${limit.game_name} Minimum Bet`;
//     };

//     /* ========== App Settings (Withdrawal window) ========== */
//     const fetchAppSettings = async () => {
//         setSettingsLoading(true);
//         try {
//             const response = await fetch("https://backend.gdmatka.site/api/app-settings");
//             if (!response.ok) throw new Error("Failed to fetch app settings");
//             const data: AppSettings = await response.json();

//             // API returns "HH:MM:SS" — UI sake: keep as "HH:MM"
//             const toHHMM = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : t || "10:00");
//             setSettings({
//                 ...data,
//                 withdrawal_open_time: toHHMM(data.withdrawal_open_time),
//                 withdrawal_close_time: toHHMM(data.withdrawal_close_time),
//             });
//         } catch (e) {
//             console.error(e);
//             alert("Error fetching withdrawal settings.");
//         } finally {
//             setSettingsLoading(false);
//         }
//     };

//     const saveAppSettings = async () => {
//         if (!settings) return;
//         // Quick validations
//         const timeRe = /^\d{2}:\d{2}$/;
//         if (!timeRe.test(settings.withdrawal_open_time) || !timeRe.test(settings.withdrawal_close_time)) {
//             alert("Please enter time in HH:MM (24-hr) format.");
//             return;
//         }

//         const token = localStorage.getItem("token");
//         if (!token) {
//             alert("Admin token missing. Please login again.");
//             return;
//         }

//         setSettingsSaving(true);
//         try {
//             const response = await fetch("https://backend.gdmatka.site/api/app-settings", {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     withdrawal_enabled: Boolean(settings.withdrawal_enabled),
//                     withdrawal_open_time: settings.withdrawal_open_time,   // "HH:MM"
//                     withdrawal_close_time: settings.withdrawal_close_time, // "HH:MM"
//                 }),
//             });

//             if (!response.ok) {
//                 const txt = await response.text();
//                 console.error(txt);
//                 alert("Failed to update withdrawal settings.");
//                 return;
//             }

//             await fetchAppSettings(); // refresh
//             alert("Withdrawal settings updated.");
//         } catch (e) {
//             console.error(e);
//             alert("Error updating settings.");
//         } finally {
//             setSettingsSaving(false);
//         }
//     };

//     return (
//         <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-6">
//             {/* ---------------- MINIMUM LIMITS ---------------- */}
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <div className="flex items-center space-x-2 md:space-x-4">
//                         <Button
//                             variant="outline"
//                             size="icon"
//                             onClick={() => router.back()}
//                             className="h-8 w-8 md:h-10 md:w-10"
//                         >
//                             <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
//                         </Button>
//                         <CardTitle className="text-lg md:text-2xl font-bold">Minimum Limits</CardTitle>
//                     </div>
//                     <Button
//                         variant="outline"
//                         onClick={fetchMinimumLimits}
//                         disabled={isLoading}
//                         className="w-full sm:w-auto"
//                         size="sm"
//                     >
//                         <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
//                         Refresh
//                     </Button>
//                 </CardHeader>

//                 <CardContent>
//                     {isLoading ? (
//                         <div className="flex justify-center items-center h-48 md:h-64">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading minimum limits...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-3 md:space-y-4">
//                             {limits.map((limit) => (
//                                 <div
//                                     key={limit.limit_id}
//                                     className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-3 md:p-4 rounded-lg"
//                                 >
//                                     <div className="flex-1 mb-3 sm:mb-0">
//                                         <h3 className="text-base md:text-lg font-semibold">{getLimitTitle(limit)}</h3>
//                                         {limit.limit_type === "game_bet" && (
//                                             <p className="text-gray-500 text-sm md:text-base">Game Type: {limit.game_name}</p>
//                                         )}
//                                     </div>

//                                     <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
//                                         <div className="flex items-center w-full sm:w-auto">
//                                             <span className="text-gray-500 mr-2 whitespace-nowrap">₹</span>
//                                             <Input
//                                                 type="number"
//                                                 value={limit.min_amount}
//                                                 onChange={(e) => handleChange(limit.limit_id, e)}
//                                                 className="w-full sm:w-24 text-right"
//                                                 disabled={isLoading || updatingLimitId === limit.limit_id}
//                                             />
//                                         </div>

//                                         <Button
//                                             onClick={() => handleUpdate(limit.limit_id)}
//                                             disabled={isLoading || updatingLimitId === limit.limit_id}
//                                             variant="default"
//                                             className="w-full sm:w-auto"
//                                             size="sm"
//                                         >
//                                             {updatingLimitId === limit.limit_id ? "Updating..." : "Update"}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             ))}

//                             {limits.length === 0 && !isLoading && (
//                                 <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
//                                     No minimum limits found. Try refreshing the page.
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* ---------------- WITHDRAWAL SETTINGS (APP) ---------------- */}
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <CardTitle className="text-lg md:text-2xl font-bold">Withdrawal Settings (App)</CardTitle>
//                     <div className="flex gap-2">
//                         <Button
//                             variant="outline"
//                             onClick={fetchAppSettings}
//                             disabled={settingsLoading}
//                             className="w-full sm:w-auto"
//                             size="sm"
//                         >
//                             <RefreshCw className={`h-4 w-4 mr-2 ${settingsLoading ? "animate-spin" : ""}`} />
//                             Refresh
//                         </Button>
//                     </div>
//                 </CardHeader>

//                 <CardContent>
//                     {settingsLoading || !settings ? (
//                         <div className="flex justify-center items-center h-40">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading settings...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-4">
//                             {/* Enabled toggle */}
//                             <div className="flex items-center justify-between bg-gray-100 p-3 md:p-4 rounded-lg">
//                                 <div>
//                                     <p className="font-semibold">Enable Withdrawals</p>
//                                     <p className="text-sm text-gray-500">Turn ON/OFF withdrawals in the app.</p>
//                                 </div>
//                                 <label className="inline-flex items-center cursor-pointer select-none">
//                                     <input
//                                         type="checkbox"
//                                         className="sr-only peer"
//                                         checked={settings.withdrawal_enabled}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, withdrawal_enabled: e.target.checked })
//                                         }
//                                     />
//                                     {/* simple tailwind switch */}
//                                     <div className="w-11 h-6 bg-gray-300 rounded-full peer focus:outline-none peer-checked:bg-blue-600 relative transition">
//                                         <span className="absolute left-0.5 top-0.5 h-5 w-5 bg-white rounded-full transition peer-checked:translate-x-5" />
//                                     </div>
//                                 </label>
//                             </div>

//                             {/* Open/Close time */}
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                     <label className="text-sm text-gray-600">Open Time (24-hr)</label>
//                                     <Input
//                                         type="time"
//                                         step={60}
//                                         value={settings.withdrawal_open_time}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, withdrawal_open_time: e.target.value })
//                                         }
//                                         className="mt-1"
//                                     />
//                                 </div>
//                                 <div className="bg-gray-100 p-3 md:p-4 rounded-lg">
//                                     <label className="text-sm text-gray-600">Close Time (24-hr)</label>
//                                     <Input
//                                         type="time"
//                                         step={60}
//                                         value={settings.withdrawal_close_time}
//                                         onChange={(e) =>
//                                             setSettings({ ...settings, withdrawal_close_time: e.target.value })
//                                         }
//                                         className="mt-1"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="flex justify-end">
//                                 <Button onClick={saveAppSettings} disabled={settingsSaving} size="sm">
//                                     <Save className="h-4 w-4 mr-2" />
//                                     {settingsSaving ? "Saving..." : "Save Settings"}
//                                 </Button>
//                             </div>

//                             <p className="text-xs text-gray-500">
//                                 Note: Time window applies in Asia/Kolkata (IST). Client app will be blocked
//                                 automatically outside this window.
//                             </p>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default MinimumLimitsPage;


// "use client";
// import { useState, useEffect } from "react";
// import { ArrowLeft, RefreshCw } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// const MinimumLimitsPage = () => {
//     const router = useRouter();
//     const [limits, setLimits] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [updatingLimitId, setUpdatingLimitId] = useState(null);

//     useEffect(() => {
//         fetchMinimumLimits();
//     }, []);

//     const fetchMinimumLimits = async () => {
//         setIsLoading(true);
//         try {
//             const token = localStorage.getItem("token");
//             const response = await fetch("https://backend.gdmatka.site/api/minimumlimits", {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error("Failed to fetch minimum limits");
//             }

//             const data = await response.json();
//             setLimits(data);
//         } catch (error) {
//             console.error(error);
//             alert("Error fetching minimum limits. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleChange = (id, event) => {
//         const updatedLimits = limits.map((limit) =>
//             limit.limit_id === id ? { ...limit, min_amount: parseFloat(event.target.value) || 0 } : limit
//         );
//         setLimits(updatedLimits);
//     };

//     const handleUpdate = async (id) => {
//         const limitToUpdate = limits.find((limit) => limit.limit_id === id);

//         if (!limitToUpdate) return;

//         if (isNaN(limitToUpdate.min_amount) || limitToUpdate.min_amount <= 0) {
//             alert("Please enter a valid minimum amount.");
//             return;
//         }

//         const token = localStorage.getItem("token");

//         if (!token) {
//             alert("Authentication token is missing.");
//             return;
//         }

//         setUpdatingLimitId(id);

//         try {
//             const response = await fetch(`https://backend.gdmatka.site/api/minimumlimits/${id}`, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     limit_type: limitToUpdate.limit_type,
//                     game_name: limitToUpdate.game_name,
//                     min_amount: limitToUpdate.min_amount
//                 }),
//             });

//             if (response.ok) {
//                 const updatedData = await response.json();
//                 setLimits((prevLimits) =>
//                     prevLimits.map((limit) =>
//                         limit.limit_id === id ? { ...limit, min_amount: updatedData.min_amount } : limit
//                     )
//                 );
//                 alert("Minimum limit updated successfully!");
//             } else {
//                 alert("Failed to update the minimum limit.");
//             }
//         } catch (error) {
//             console.error(error);
//             alert("Error updating the minimum limit. Please try again.");
//         } finally {
//             setUpdatingLimitId(null);
//         }
//     };

//     const getLimitTitle = (limit) => {
//         if (limit.limit_type === 'deposit') {
//             return 'Minimum Deposit';
//         } else if (limit.limit_type === 'withdrawal') {
//             return 'Minimum Withdrawal';
//         } else {
//             return `${limit.game_name} Minimum Bet`;
//         }
//     };

//     return (
//         <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
//             <Card className="shadow-md">
//                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//                     <div className="flex items-center space-x-2 md:space-x-4">
//                         <Button
//                             variant="outline"
//                             size="icon"
//                             onClick={() => router.back()}
//                             className="h-8 w-8 md:h-10 md:w-10"
//                         >
//                             <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
//                         </Button>
//                         <CardTitle className="text-lg md:text-2xl font-bold">Minimum Limits</CardTitle>
//                     </div>
//                     <Button
//                         variant="outline"
//                         onClick={fetchMinimumLimits}
//                         disabled={isLoading}
//                         className="w-full sm:w-auto"
//                         size="sm"
//                     >
//                         <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
//                         Refresh
//                     </Button>
//                 </CardHeader>
//                 <CardContent>
//                     {isLoading ? (
//                         <div className="flex justify-center items-center h-48 md:h-64">
//                             <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//                             <p className="text-gray-500">Loading minimum limits...</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-3 md:space-y-4">
//                             {limits.map((limit) => (
//                                 <div
//                                     key={limit.limit_id}
//                                     className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-3 md:p-4 rounded-lg"
//                                 >
//                                     <div className="flex-1 mb-3 sm:mb-0">
//                                         <h3 className="text-base md:text-lg font-semibold">{getLimitTitle(limit)}</h3>
//                                         {limit.limit_type === 'game_bet' && (
//                                             <p className="text-gray-500 text-sm md:text-base">Game Type: {limit.game_name}</p>
//                                         )}
//                                     </div>
//                                     <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
//                                         <div className="flex items-center w-full sm:w-auto">
//                                             <span className="text-gray-500 mr-2 whitespace-nowrap">₹</span>
//                                             <Input
//                                                 type="number"
//                                                 value={limit.min_amount}
//                                                 onChange={(e) => handleChange(limit.limit_id, e)}
//                                                 className="w-full sm:w-24 text-right"
//                                                 disabled={isLoading || updatingLimitId === limit.limit_id}
//                                             />
//                                         </div>
//                                         <Button
//                                             onClick={() => handleUpdate(limit.limit_id)}
//                                             disabled={isLoading || updatingLimitId === limit.limit_id}
//                                             variant="default"
//                                             className="w-full sm:w-auto"
//                                             size="sm"
//                                         >
//                                             {updatingLimitId === limit.limit_id ? 'Updating...' : 'Update'}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             ))}

//                             {limits.length === 0 && !isLoading && (
//                                 <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
//                                     No minimum limits found. Try refreshing the page.
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// export default MinimumLimitsPage;