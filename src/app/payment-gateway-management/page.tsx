'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Settings, 
  CreditCard, 
  Shield, 
  Key, 
  Link, 
  Globe, 
  Edit, 
  Save, 
  Power, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Eye,
  EyeOff
} from 'lucide-react';

interface Gateway {
    id: number;
    gateway_name: string;
    display_name: string;
    is_active: boolean;
    api_key: string | null;
    api_secret: string | null;
    create_order_url: string | null;
    webhook_url_suffix: string;
    config: Record<string, string> | null;
}

export default function PaymentGatewayManagementPage() {
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<number | null>(null);
    const [formStates, setFormStates] = useState<Record<number, Partial<Gateway>>>({});
    const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});

    const fetchGateways = async () => {
        try {
            setLoading(true);
            const res = await axios.get('https://backend.gdmatka.site/api/admin/gateways');
            setGateways(res.data);
            const initialForm: Record<number, Partial<Gateway>> = {};
            res.data.forEach((g: Gateway) => {
                initialForm[g.id] = { ...g };
            });
            setFormStates(initialForm);
        } catch (error) {
            console.error('Error fetching gateways:', error);
        } finally {
            setLoading(false);
        }
    };

    const activateGateway = async (id: number) => {
        try {
            const toBeActivated = gateways.find(g => g.id === id);
            
            const confirm = window.confirm(`"${toBeActivated?.display_name}" को एक्टिवेट करना चाहते हैं? पुराना गेटवे अपने आप डिएक्टिवेट हो जाएगा।`);
            if (!confirm) return;

            const res = await axios.put(`https://backend.gdmatka.site/api/admin/gateways/activate/${id}`);
            alert(`"${toBeActivated?.display_name}" को एक्टिवेट कर दिया गया है।`);
            fetchGateways();
        } catch (error) {
            console.error("Activation error:", error);
            alert("कुछ गड़बड़ हो गई है।");
        }
    };

    const deactivateGateway = async (id: number) => {
        const activeCount = gateways.filter(g => g.is_active).length;

        if (activeCount <= 1) {
            alert("कम से कम एक payment gateway एक्टिव रहना चाहिए।");
            return;
        }

        const confirm = window.confirm("क्या आप इस gateway को डिएक्टिव करना चाहते हैं?");
        if (!confirm) return;

        try {
            await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, {
                ...formStates[id],
                is_active: false
            });
            fetchGateways();
        } catch (error) {
            console.error('Deactivation error:', error);
        }
    };

    const handleInputChange = (id: number, field: string, value: string) => {
        setFormStates(prev => {
            const currentGateway = prev[id];
            let updatedState: Partial<Gateway> = { ...currentGateway };

            if (['merchant_id', 'secret_key', 'aes_key', 'aes_iv', 'developer_key', 'user_code', 'api_url'].includes(field)) {
                updatedState = {
                    ...updatedState,
                    config: {
                        ...(currentGateway?.config || {}),
                        [field]: value
                    }
                };
            } else {
                updatedState = { ...updatedState, [field]: value };
            }

            return {
                ...prev,
                [id]: updatedState,
            };
        });
    };

    const handleUpdate = async (id: number) => {
        try {
            setSaving(id);
            const updatedData = formStates[id];
            await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, updatedData);
            await fetchGateways();
        } catch (error) {
            console.error('Update error:', error);
            alert('Error updating gateway configuration');
        } finally {
            setSaving(null);
        }
    };

    const toggleSecretVisibility = (id: number) => {
        setShowSecrets(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getGatewayIcon = (gatewayName: string) => {
        switch (gatewayName) {
            case 'paypaylor': return <CreditCard className="h-5 w-5 text-blue-500" />;
            case 'imb': return <Shield className="h-5 w-5 text-green-500" />;
            default: return <Globe className="h-5 w-5 text-purple-500" />;
        }
    };

    const getGatewayConfig = (gateway: Gateway) => {
        const formState = formStates[gateway.id];
        const isPaypaylor = gateway.gateway_name === 'paypaylor';
        const isNewGateway = gateway.gateway_name === 'new_gateway';
        const isImb = gateway.gateway_name === 'imb';

        const configFields = [];

        if (isPaypaylor) {
            configFields.push(
                { label: 'Merchant ID', key: 'merchant_id', value: formState?.config?.merchant_id || '', placeholder: 'Enter Merchant ID' },
                { label: 'Secret Key', key: 'secret_key', value: formState?.config?.secret_key || '', placeholder: 'Enter Secret Key', secret: true },
                { label: 'AES Key', key: 'aes_key', value: formState?.config?.aes_key || '', placeholder: 'Enter AES Key', secret: true },
                { label: 'AES IV', key: 'aes_iv', value: formState?.config?.aes_iv || '', placeholder: 'Enter AES IV', secret: true }
            );
        } else if (isNewGateway) {
            configFields.push(
                { label: 'Developer Key', key: 'developer_key', value: formState?.config?.developer_key || '', placeholder: 'Enter Developer Key' },
                { label: 'User Code', key: 'user_code', value: formState?.config?.user_code || '', placeholder: 'Enter User Code' },
                { label: 'API URL', key: 'api_url', value: formState?.config?.api_url || '', placeholder: 'Enter API URL' }
            );
        } else {
            configFields.push(
                { label: 'API Key', key: 'api_key', value: formState?.api_key || '', placeholder: 'Enter API Key', secret: true },
                { label: 'API Secret', key: 'api_secret', value: formState?.api_secret || '', placeholder: 'Enter API Secret', secret: true },
                { label: 'Order URL', key: 'create_order_url', value: formState?.create_order_url || '', placeholder: 'Enter Order URL' }
            );
        }

        configFields.push(
            { label: 'Webhook URL', key: 'webhook_url_suffix', value: formState?.webhook_url_suffix || '', placeholder: 'Enter Webhook Suffix' }
        );

        return configFields;
    };

    useEffect(() => {
        fetchGateways();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                            <Settings className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Payment Gateway Management</h1>
                            <p className="text-gray-600 mt-1">Configure and manage your payment gateway settings</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={fetchGateways}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Gateways</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{gateways.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {gateways.filter(g => g.is_active).length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Play className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inactive</p>
                                <p className="text-2xl font-bold text-gray-600 mt-1">
                                    {gateways.filter(g => !g.is_active).length}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <Pause className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Need Setup</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {gateways.filter(g => !g.is_active && !g.api_key).length}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <AlertCircle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gateways Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <RefreshCw className="animate-spin text-gray-400 mr-3 h-8 w-8" />
                        <span className="text-gray-500">Loading payment gateways...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {gateways.map((gateway) => {
                            const configFields = getGatewayConfig(gateway);
                            const isActive = gateway.is_active;

                            return (
                                <div key={gateway.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Gateway Header */}
                                    <div className={`p-6 border-b ${isActive ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getGatewayIcon(gateway.gateway_name)}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                        {gateway.display_name || gateway.gateway_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{gateway.gateway_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                    isActive 
                                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </div>
                                                {isActive && (
                                                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Configuration Form */}
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {/* Display Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Display Name
                                                </label>
                                                <input
                                                    value={formStates[gateway.id]?.display_name || ''}
                                                    onChange={(e) => handleInputChange(gateway.id, 'display_name', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter display name"
                                                />
                                            </div>

                                            {/* Configuration Fields */}
                                            {configFields.map((field) => (
                                                <div key={field.key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {field.label}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={field.secret && !showSecrets[gateway.id] ? 'password' : 'text'}
                                                            value={field.value}
                                                            onChange={(e) => handleInputChange(gateway.id, field.key, e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                                            placeholder={field.placeholder}
                                                        />
                                                        {field.secret && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSecretVisibility(gateway.id)}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                {showSecrets[gateway.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                                            {isActive ? (
                                                <button
                                                    onClick={() => deactivateGateway(gateway.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    <Pause className="h-4 w-4" />
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => activateGateway(gateway.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    <Play className="h-4 w-4" />
                                                    Activate
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUpdate(gateway.id)}
                                                disabled={saving === gateway.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ml-auto"
                                            >
                                                {saving === gateway.id ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                {saving === gateway.id ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}


// 'use client';

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// interface Gateway {
//     id: number;
//     gateway_name: string;
//     display_name: string;
//     is_active: boolean;
//     api_key: string | null;
//     api_secret: string | null;
//     create_order_url: string | null;
//     webhook_url_suffix: string;
//     config: Record<string, string> | null;
// }

// export default function PaymentGatewayManagementPage() {
//     const [gateways, setGateways] = useState<Gateway[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [formStates, setFormStates] = useState<Record<number, Partial<Gateway>>>({});

//     const fetchGateways = async () => {
//         try {
//             setLoading(true);
//             const res = await axios.get('https://backend.gdmatka.site/api/admin/gateways');
//             setGateways(res.data);
//             const initialForm: Record<number, Partial<Gateway>> = {};
//             res.data.forEach((g: Gateway) => {
//                 initialForm[g.id] = { ...g };
//             });
//             setFormStates(initialForm);
//         } catch (error) {
//             console.error('Error fetching gateways:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//    // PaymentGatewayManagementPage.tsx
// const activateGateway = async (id: number) => {
//     try {
//         const toBeActivated = gateways.find(g => g.id === id);
        
//         const confirm = window.confirm(`"${toBeActivated?.display_name}" को एक्टिवेट करना चाहते हैं? पुराना गेटवे अपने आप डिएक्टिवेट हो जाएगा।`);
//         if (!confirm) return;

//         // ✅ यहाँ URL को अपडेट करें
//         const res = await axios.put(`https://backend.gdmatka.site/api/admin/gateways/activate/${id}`);

//         alert(`"${toBeActivated?.display_name}" को एक्टिवेट कर दिया गया है।`);
//         fetchGateways();
//     } catch (error) {
//         console.error("Activation error:", error);
//         alert("कुछ गड़बड़ हो गई है।");
//     }
// };
//     const deactivateGateway = async (id: number) => {
//         const activeCount = gateways.filter(g => g.is_active).length;

//         if (activeCount <= 1) {
//             alert("कम से कम एक payment gateway एक्टिव रहना चाहिए।");
//             return;
//         }

//         const confirm = window.confirm("क्या आप इस gateway को डिएक्टिव करना चाहते हैं?");
//         if (!confirm) return;

//         try {
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, {
//                 ...formStates[id],
//                 is_active: false
//             });
//             fetchGateways();
//         } catch (error) {
//             console.error('Deactivation error:', error);
//         }
//     };

//     const handleInputChange = (id: number, field: string, value: string) => {
//         setFormStates(prev => {
//             const currentGateway = prev[id];
//             let updatedState: Partial<Gateway> = { ...currentGateway };

//             if (['merchant_id', 'secret_key', 'aes_key', 'aes_iv', 'developer_key', 'user_code', 'api_url'].includes(field)) {
//                 updatedState = {
//                     ...updatedState,
//                     config: {
//                         ...(currentGateway?.config || {}),
//                         [field]: value
//                     }
//                 };
//             } else {
//                 updatedState = { ...updatedState, [field]: value };
//             }

//             return {
//                 ...prev,
//                 [id]: updatedState,
//             };
//         });
//     };

//     const handleUpdate = async (id: number) => {
//         try {
//             const updatedData = formStates[id];
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, updatedData);
//             fetchGateways();
//         } catch (error) {
//             console.error('Update error:', error);
//         }
//     };

//     useEffect(() => {
//         fetchGateways();
//     }, []);

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Payment Gateway Management</h1>
//             {loading ? (
//                 <p>Loading gateways...</p>
//             ) : (
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full border text-sm">
//                         <thead className="bg-gray-100">
//                             <tr>
//                                 <th className="border px-2 py-1">Gateway</th>
//                                 <th className="border px-2 py-1">Display Name</th>
//                                 <th className="border px-2 py-1">API Key / Merchant ID</th>
//                                 <th className="border px-2 py-1">API Secret / Client Secret</th>
//                                 <th className="border px-2 py-1">Order URL / API URL</th>
//                                 <th className="border px-2 py-1">Webhook</th>
//                                 <th className="border px-2 py-1">Active</th>
//                                 <th className="border px-2 py-1">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {gateways.map((gateway) => {
//                                 const isPaypaylor = gateway.gateway_name === 'paypaylor';
//                                 const isNewGateway = gateway.gateway_name === 'new_gateway';
//                                 const isImb = gateway.gateway_name === 'imb';

//                                 return (
//                                     <tr key={gateway.id}>
//                                         <td className="border px-2 py-1">{gateway.gateway_name}</td>
//                                         <td className="border px-2 py-1">
//                                             <input
//                                                 value={formStates[gateway.id]?.display_name || ''}
//                                                 onChange={(e) => handleInputChange(gateway.id, 'display_name', e.target.value)}
//                                                 className="w-full border px-1 py-0.5"
//                                             />
//                                         </td>
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.merchant_id || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'merchant_id', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Merchant ID"
//                                                 />
//                                             ) : isNewGateway ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.developer_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'developer_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Developer Key"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.api_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'api_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="API Key"
//                                                 />
//                                             )}
//                                         </td>
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.secret_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'secret_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Secret Key"
//                                                 />
//                                             ) : isNewGateway ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.user_code || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'user_code', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="User Code"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.api_secret || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'api_secret', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="API Secret"
//                                                 />
//                                             )}
//                                         </td>
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.aes_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'aes_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Encryption Key"
//                                                 />
//                                             ) : isNewGateway ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.api_url || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'api_url', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="API URL"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.create_order_url || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'create_order_url', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Order URL"
//                                                 />
//                                             )}
//                                         </td>
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.aes_iv || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'aes_iv', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Encryption IV"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.webhook_url_suffix || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'webhook_url_suffix', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Webhook Suffix"
//                                                 />
//                                             )}
//                                         </td>
//                                         <td className="border px-2 py-1 text-center">
//                                             <input type="checkbox" checked={gateway.is_active} readOnly />
//                                         </td>
//                                         <td className="border px-2 py-1 flex flex-col gap-1">
//                                             {gateway.is_active ? (
//                                                 <button
//                                                     onClick={() => deactivateGateway(gateway.id)}
//                                                     className="bg-red-600 text-white px-2 py-1 rounded text-xs"
//                                                 >
//                                                     Deactivate
//                                                 </button>
//                                             ) : (
//                                                 <button
//                                                     onClick={() => activateGateway(gateway.id)}
//                                                     className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
//                                                 >
//                                                     Activate
//                                                 </button>
//                                             )}
//                                             <button
//                                                 onClick={() => handleUpdate(gateway.id)}
//                                                 className="bg-green-600 text-white px-2 py-1 rounded text-xs"
//                                             >
//                                                 Save
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }

// 'use client';

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// // ✅ Updated Gateway Interface to handle the 'config' JSONB column
// interface Gateway {
//     id: number;
//     gateway_name: string;
//     display_name: string;
//     is_active: boolean;
//     api_key: string | null;
//     api_secret: string | null;
//     create_order_url: string | null;
//     webhook_url_suffix: string;
//     config: Record<string, string> | null;
// }

// export default function PaymentGatewayManagementPage() {
//     const [gateways, setGateways] = useState<Gateway[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [formStates, setFormStates] = useState<Record<number, Partial<Gateway>>>({});

//     const fetchGateways = async () => {
//         try {
//             setLoading(true);
//             const res = await axios.get('https://backend.gdmatka.site/api/admin/gateways');
//             setGateways(res.data);
//             const initialForm: Record<number, Partial<Gateway>> = {};
//             res.data.forEach((g: Gateway) => {
//                 initialForm[g.id] = { ...g };
//             });
//             setFormStates(initialForm);
//         } catch (error) {
//             console.error('Error fetching gateways:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const activateGateway = async (id: number) => {
//         try {
//             const toBeActivated = gateways.find(g => g.id === id);
            
//             const confirm = window.confirm(`"${toBeActivated?.display_name}" को एक्टिवेट करना चाहते हैं? पुराना गेटवे अपने आप डिएक्टिवेट हो जाएगा।`);
//             if (!confirm) return;

//             // Naya gateway activate karo
//             const currentForm = formStates[id];
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, {
//                 ...currentForm,
//                 is_active: true,
//             });

//             alert(`"${toBeActivated?.display_name}" को एक्टिवेट कर दिया गया है।`);
//             fetchGateways();
//         } catch (error) {
//             console.error("Activation error:", error);
//             alert("कुछ गड़बड़ हो गई है।");
//         }
//     };

//     const deactivateGateway = async (id: number) => {
//         const activeCount = gateways.filter(g => g.is_active).length;

//         if (activeCount <= 1) {
//             alert("कम से कम एक payment gateway एक्टिव रहना चाहिए।");
//             return;
//         }

//         const confirm = window.confirm("क्या आप इस gateway को डिएक्टिव करना चाहते हैं?");
//         if (!confirm) return;

//         try {
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, {
//                 ...formStates[id],
//                 is_active: false
//             });
//             fetchGateways();
//         } catch (error) {
//             console.error('Deactivation error:', error);
//         }
//     };

//     // ✅ Updated to handle both top-level and nested 'config' fields
//     const handleInputChange = (id: number, field: string, value: string) => {
//         setFormStates(prev => {
//             const currentGateway = prev[id];
//             let updatedState: Partial<Gateway> = { ...currentGateway };

//             // Check if the field belongs to the 'config' object
//             if (['merchant_id', 'secret_key', 'aes_key', 'aes_iv', 'developer_key', 'user_code', 'api_url'].includes(field)) {
//                 updatedState = {
//                     ...updatedState,
//                     config: {
//                         ...(currentGateway?.config || {}),
//                         [field]: value
//                     }
//                 };
//             } else {
//                 // Otherwise, update the top-level field directly
//                 updatedState = { ...updatedState, [field]: value };
//             }

//             return {
//                 ...prev,
//                 [id]: updatedState,
//             };
//         });
//     };

//     const handleUpdate = async (id: number) => {
//         try {
//             const updatedData = formStates[id];
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, updatedData);
//             fetchGateways();
//         } catch (error) {
//             console.error('Update error:', error);
//         }
//     };

//     useEffect(() => {
//         fetchGateways();
//     }, []);

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Payment Gateway Management</h1>
//             {loading ? (
//                 <p>Loading gateways...</p>
//             ) : (
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full border text-sm">
//                         <thead className="bg-gray-100">
//                             <tr>
//                                 <th className="border px-2 py-1">Gateway</th>
//                                 <th className="border px-2 py-1">Display Name</th>
//                                 <th className="border px-2 py-1">API Key / Merchant ID</th>
//                                 <th className="border px-2 py-1">API Secret / Client Secret</th>
//                                 <th className="border px-2 py-1">Order URL / API URL</th>
//                                 <th className="border px-2 py-1">Webhook</th>
//                                 <th className="border px-2 py-1">Active</th>
//                                 <th className="border px-2 py-1">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {gateways.map((gateway) => {
//                                 const isPaypaylor = gateway.gateway_name === 'paypaylor';
//                                 const isNewGateway = gateway.gateway_name === 'new_gateway';

//                                 return (
//                                     <tr key={gateway.id}>
//                                         <td className="border px-2 py-1">{gateway.gateway_name}</td>
//                                         <td className="border px-2 py-1">
//                                             <input
//                                                 value={formStates[gateway.id]?.display_name || ''}
//                                                 onChange={(e) => handleInputChange(gateway.id, 'display_name', e.target.value)}
//                                                 className="w-full border px-1 py-0.5"
//                                             />
//                                         </td>
//                                         {/* API Key / Merchant ID */}
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.merchant_id || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'merchant_id', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Merchant ID"
//                                                 />
//                                             ) : isNewGateway ? (
//                                                  <input
//                                                     value={formStates[gateway.id]?.config?.developer_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'developer_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Developer Key"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.api_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'api_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="API Key"
//                                                 />
//                                             )}
//                                         </td>
//                                         {/* API Secret / Client Secret */}
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.secret_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'secret_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Secret Key"
//                                                 />
//                                             ) : isNewGateway ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.user_code || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'user_code', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="User Code"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.api_secret || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'api_secret', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="API Secret"
//                                                 />
//                                             )}
//                                         </td>
//                                         {/* Order URL / API URL */}
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.aes_key || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'aes_key', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Encryption Key"
//                                                 />
//                                             ) : isNewGateway ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.api_url || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'api_url', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="API URL"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.create_order_url || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'create_order_url', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Order URL"
//                                                 />
//                                             )}
//                                         </td>
//                                         <td className="border px-2 py-1">
//                                             {isPaypaylor ? (
//                                                 <input
//                                                     value={formStates[gateway.id]?.config?.aes_iv || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'aes_iv', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Encryption IV"
//                                                 />
//                                             ) : (
//                                                 <input
//                                                     value={formStates[gateway.id]?.webhook_url_suffix || ''}
//                                                     onChange={(e) => handleInputChange(gateway.id, 'webhook_url_suffix', e.target.value)}
//                                                     className="w-full border px-1 py-0.5"
//                                                     placeholder="Webhook Suffix"
//                                                 />
//                                             )}
//                                         </td>
//                                         <td className="border px-2 py-1 text-center">
//                                             <input type="checkbox" checked={gateway.is_active} readOnly />
//                                         </td>
//                                         <td className="border px-2 py-1 flex flex-col gap-1">
//                                             {gateway.is_active ? (
//                                                 <button
//                                                     onClick={() => deactivateGateway(gateway.id)}
//                                                     className="bg-red-600 text-white px-2 py-1 rounded text-xs"
//                                                 >
//                                                     Deactivate
//                                                 </button>
//                                             ) : (
//                                                 <button
//                                                     onClick={() => activateGateway(gateway.id)}
//                                                     className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
//                                                 >
//                                                     Activate
//                                                 </button>
//                                             )}
//                                             <button
//                                                 onClick={() => handleUpdate(gateway.id)}
//                                                 className="bg-green-600 text-white px-2 py-1 rounded text-xs"
//                                             >
//                                                 Save
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }

// 'use client';

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// interface Gateway {
//     id: number;
//     gateway_name: string;
//     display_name: string;
//     is_active: boolean;
//     api_key: string;
//     api_secret: string;
//     create_order_url: string;
//     webhook_url_suffix: string;
// }

// export default function PaymentGatewayManagementPage() {
//     const [gateways, setGateways] = useState<Gateway[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [formStates, setFormStates] = useState<Record<number, Partial<Gateway>>>({});

//     const fetchGateways = async () => {
//         try {
//             setLoading(true);
//             const res = await axios.get('https://backend.gdmatka.site/api/admin/gateways');
//             setGateways(res.data);
//             const initialForm: Record<number, Partial<Gateway>> = {};
//             res.data.forEach((g: Gateway) => {
//                 initialForm[g.id] = { ...g };
//             });
//             setFormStates(initialForm);
//         } catch (error) {
//             console.error('Error fetching gateways:', error);
//         } finally {
//             setLoading(false);
//         }
//     };
//     const activateGateway = async (id: number) => {
//         try {
//             const toBeActivated = gateways.find(g => g.id === id);
//             const currentlyActive = gateways.find(g => g.is_active && g.id !== id);

//             const confirm = window.confirm(`"${toBeActivated?.display_name}" को एक्टिवेट करना चाहते हैं? पुराना गेटवे अपने आप डिएक्टिवेट हो जाएगा।`);
//             if (!confirm) return;

//             // Purana gateway deactivate करो (सिर्फ required fields के साथ)
//             if (currentlyActive) {
//                 await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${currentlyActive.id}`, {
//                     display_name: currentlyActive.display_name,
//                     api_key: currentlyActive.api_key,
//                     api_secret: currentlyActive.api_secret,
//                     create_order_url: currentlyActive.create_order_url,
//                     webhook_url_suffix: currentlyActive.webhook_url_suffix,
//                     is_active: false,
//                 });
//             }

//             // Naya gateway activate करो (सिर्फ required fields)
//             const currentForm = formStates[id];
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, {
//                 display_name: currentForm.display_name,
//                 api_key: currentForm.api_key,
//                 api_secret: currentForm.api_secret,
//                 create_order_url: currentForm.create_order_url,
//                 webhook_url_suffix: currentForm.webhook_url_suffix,
//                 is_active: true,
//             });

//             alert(`"${toBeActivated?.display_name}" को एक्टिवेट कर दिया गया है।`);
//             fetchGateways();
//         } catch (error) {
//             console.error("Activation error:", error);
//             alert("कुछ गड़बड़ हो गई है।");
//         }
//     };


//     const deactivateGateway = async (id: number) => {
//         const activeCount = gateways.filter(g => g.is_active).length;

//         if (activeCount <= 1) {
//             alert("कम से कम एक payment gateway एक्टिव रहना चाहिए।");
//             return;
//         }

//         const confirm = window.confirm("क्या आप इस gateway को डिएक्टिव करना चाहते हैं?");
//         if (!confirm) return;

//         try {
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, {
//                 ...formStates[id],
//                 is_active: false
//             });
//             fetchGateways();
//         } catch (error) {
//             console.error('Deactivation error:', error);
//         }
//     };

//     const handleInputChange = (id: number, field: string, value: string) => {
//         setFormStates(prev => ({
//             ...prev,
//             [id]: {
//                 ...prev[id],
//                 [field]: value,
//             },
//         }));
//     };

//     const handleUpdate = async (id: number) => {
//         try {
//             const updatedData = formStates[id];
//             await axios.put(`https://backend.gdmatka.site/api/admin/gateways/${id}`, updatedData);
//             fetchGateways();
//         } catch (error) {
//             console.error('Update error:', error);
//         }
//     };

//     useEffect(() => {
//         fetchGateways();
//     }, []);

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Payment Gateway Management</h1>
//             {loading ? (
//                 <p>Loading gateways...</p>
//             ) : (
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full border text-sm">
//                         <thead className="bg-gray-100">
//                             <tr>
//                                 <th className="border px-2 py-1">Gateway</th>
//                                 <th className="border px-2 py-1">Display Name</th>
//                                 <th className="border px-2 py-1">API Key</th>
//                                 <th className="border px-2 py-1">API Secret</th>
//                                 <th className="border px-2 py-1">Order URL</th>
//                                 <th className="border px-2 py-1">Webhook</th>
//                                 <th className="border px-2 py-1">Active</th>
//                                 <th className="border px-2 py-1">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {gateways.map((gateway) => (
//                                 <tr key={gateway.id}>
//                                     <td className="border px-2 py-1">{gateway.gateway_name}</td>
//                                     <td className="border px-2 py-1">
//                                         <input
//                                             value={formStates[gateway.id]?.display_name || ''}
//                                             onChange={(e) => handleInputChange(gateway.id, 'display_name', e.target.value)}
//                                             className="w-full border px-1 py-0.5"
//                                         />
//                                     </td>
//                                     <td className="border px-2 py-1">
//                                         <input
//                                             value={formStates[gateway.id]?.api_key || ''}
//                                             onChange={(e) => handleInputChange(gateway.id, 'api_key', e.target.value)}
//                                             className="w-full border px-1 py-0.5"
//                                         />
//                                     </td>
//                                     <td className="border px-2 py-1">
//                                         <input
//                                             value={formStates[gateway.id]?.api_secret || ''}
//                                             onChange={(e) => handleInputChange(gateway.id, 'api_secret', e.target.value)}
//                                             className="w-full border px-1 py-0.5"
//                                         />
//                                     </td>
//                                     <td className="border px-2 py-1">
//                                         <input
//                                             value={formStates[gateway.id]?.create_order_url || ''}
//                                             onChange={(e) => handleInputChange(gateway.id, 'create_order_url', e.target.value)}
//                                             className="w-full border px-1 py-0.5"
//                                         />
//                                     </td>
//                                     <td className="border px-2 py-1">
//                                         <input
//                                             value={formStates[gateway.id]?.webhook_url_suffix || ''}
//                                             onChange={(e) => handleInputChange(gateway.id, 'webhook_url_suffix', e.target.value)}
//                                             className="w-full border px-1 py-0.5"
//                                         />
//                                     </td>
//                                     <td className="border px-2 py-1 text-center">
//                                         <input type="checkbox" checked={gateway.is_active} readOnly />
//                                     </td>
//                                     <td className="border px-2 py-1 flex flex-col gap-1">
//                                         {gateway.is_active ? (
//                                             <button
//                                                 onClick={() => deactivateGateway(gateway.id)}
//                                                 className="bg-red-600 text-white px-2 py-1 rounded text-xs"
//                                             >
//                                                 Deactivate
//                                             </button>
//                                         ) : (
//                                             <button
//                                                 onClick={() => activateGateway(gateway.id)}
//                                                 className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
//                                             >
//                                                 Activate
//                                             </button>
//                                         )}
//                                         <button
//                                             onClick={() => handleUpdate(gateway.id)}
//                                             className="bg-green-600 text-white px-2 py-1 rounded text-xs"
//                                         >
//                                             Save
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }
