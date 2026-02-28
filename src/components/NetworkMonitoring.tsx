import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Network,
    Wifi,
    Bluetooth,
    CreditCard,
    Smartphone,
    Radio,
    Cable,
    Activity,
    Search,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TriangleAlert,
    AlertCircle,
    Download,
} from 'lucide-react';

interface NetworkDevice {
    id: number;
    device_type: string;
    vendor_id: string;
    product_id: string;
    mac_address: string;
    interface_name: string;
    is_connected: boolean;
    ip_address?: string;
    connection_type: string;
    last_seen: string;
    status: string;
    security_flags: string;
}

interface NetworkEvent {
    id: number;
    device_mac: string;
    event_type: string;
    timestamp: string;
    details: string;
}

const NETWORK_TYPE_ICONS: Record<string, any> = {
    "Ethernet Adapter": Network,
    "HID Keyboard Device": Network,
    "USB Wi-Fi Dongle": Wifi,
    "Bluetooth Adapter": Bluetooth,
    "NFC Reader": CreditCard,
    "LTE/5G Modem": Smartphone,
    "Zigbee Adapter": Radio,
    "Serial Bridge": Cable,
};

export default function NetworkMonitoring() {
    const [devices, setDevices] = useState<NetworkDevice[]>([]);
    const [events, setEvents] = useState<NetworkEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchNetworkData = async () => {
        try {
            setLoading(true);
            const [devicesRes, eventsRes] = await Promise.all([
                fetch('http://localhost:3005/api/network/devices'),
                fetch('http://localhost:3005/api/network/events')
            ]);

            const devicesData = await devicesRes.json();
            const eventsData = await eventsRes.json();

            setDevices(devicesData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch network data:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveNetworkOverview = async () => {
        try {
            const overview = {
                timestamp: new Date().toISOString(),
                summary: {
                    total_devices: devices.length,
                    connected_devices: devices.filter(d => d.is_connected).length,
                    total_events: events.length,
                    device_types: [...new Set(devices.map(d => d.device_type))],
                    wireless_devices: devices.filter(d => d.connection_type.includes('Wi-Fi') || d.connection_type.includes('Bluetooth')).length,
                    ethernet_devices: devices.filter(d => d.connection_type.includes('Ethernet')).length
                },
                devices: devices.map(device => ({
                    id: device.id,
                    device_type: device.device_type,
                    vendor_id: device.vendor_id,
                    product_id: device.product_id,
                    mac_address: device.mac_address,
                    interface_name: device.interface_name,
                    is_connected: device.is_connected,
                    ip_address: device.ip_address,
                    connection_type: device.connection_type,
                    last_seen: device.last_seen,
                    status: device.status,
                    security_flags: device.security_flags
                })),
                events: events.map(event => ({
                    id: event.id,
                    device_mac: event.device_mac,
                    event_type: event.event_type,
                    timestamp: event.timestamp,
                    details: event.details
                }))
            };

            // Save to JSON file via API
            const response = await fetch('http://localhost:3005/api/save-network-overview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(overview)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Network overview saved:', result.filename);
            } else {
                console.error('Failed to save network overview');
            }
        } catch (error) {
            console.error('Error saving network overview:', error);
        }
    };

    const triggerScan = async () => {
        try {
            setScanning(true);
            await fetch('http://localhost:3005/api/network/scan', {
                method: 'POST'
            });
            // Wait a moment for scan to complete, then refresh data and save overview
            setTimeout(async () => {
                const [devicesRes, eventsRes] = await Promise.all([
                    fetch('http://localhost:3005/api/network/devices'),
                    fetch('http://localhost:3005/api/network/events')
                ]);
                
                const devicesData = await devicesRes.json();
                const eventsData = await eventsRes.json();
                
                setDevices(devicesData);
                setEvents(eventsData);
                
                await saveNetworkOverview();
                setScanning(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to trigger network scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchNetworkData();
        const interval = setInterval(fetchNetworkData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (device: NetworkDevice) => {
        if (device.status === 'ACTIVE') {
            return <CheckCircle className="w-4 h-4 text-emerald-400" />;
        } else if (device.status === 'NOT_AVAILABLE') {
            return <AlertCircle className="w-4 h-4 text-gray-400" />;
        } else {
            return <XCircle className="w-4 h-4 text-red-400" />;
        }
    };

    const getStatusColor = (device: NetworkDevice) => {
        if (device.status === 'ACTIVE') {
            return 'border-emerald-500/20 bg-emerald-500/5';
        } else if (device.status === 'NOT_AVAILABLE') {
            return 'border-gray-500/20 bg-gray-500/5';
        } else {
            return 'border-red-500/20 bg-red-500/5';
        }
    };

    const getSecurityFlags = (security_flags: string) => {
        try {
            return JSON.parse(security_flags) as string[];
        } catch {
            return [];
        }
    };

    const isSuspiciousDevice = (device: NetworkDevice) => {
        const flags = getSecurityFlags(device.security_flags);
        return flags.length > 0 || 
               device.mac_address === "UNKNOWN" ||
               device.vendor_id === "UNKNOWN" ||
               device.device_type === "USB Wi-Fi Dongle" ||
               device.device_type === "Serial Bridge";
    };

    const DeviceCard = ({ device }: { device: NetworkDevice }) => {
        const Icon = NETWORK_TYPE_ICONS[device.device_type] || Network;
        const isSuspicious = isSuspiciousDevice(device);
        const securityFlags = getSecurityFlags(device.security_flags);
        
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-white/10 backdrop-blur-xl border rounded-xl p-6 transition-all duration-300 ${getStatusColor(device)} ${
                    isSuspicious ? 'border-orange-500/50 bg-orange-500/10' : ''
                }`}
            >
                {isSuspicious && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full">
                        <TriangleAlert className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-400 font-medium">SUSPICIOUS</span>
                    </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSuspicious ? 'bg-orange-900/50' : 'bg-slate-700'
                        }`}>
                            <Icon className={`w-5 h-5 ${
                                isSuspicious ? 'text-orange-400' : 'text-slate-300'
                            }`} />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg">{device.device_type}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(device)}
                                <span className={`text-sm font-medium ${
                                    device.status === 'ACTIVE' ? 'text-emerald-400' : 
                                    device.status === 'NOT_AVAILABLE' ? 'text-gray-400' : 'text-red-400'
                                }`}>
                                    {device.status === 'ACTIVE' ? 'Connected' : 
                                     device.status === 'NOT_AVAILABLE' ? 'Not Available' : 'Error'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {device.is_connected ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Interface:</span>
                                    <span className="text-white text-xs break-words">{device.interface_name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">MAC Address:</span>
                                    <span className="text-white font-mono text-xs">{device.mac_address}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Vendor ID:</span>
                                    <span className="text-white font-mono text-xs">{device.vendor_id}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Product ID:</span>
                                    <span className="text-white font-mono text-xs">{device.product_id}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">IP Address:</span>
                                    <span className="text-white font-mono text-xs">{device.ip_address || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Connection Type:</span>
                                    <span className="text-white text-xs">{device.connection_type}</span>
                                </div>
                            </div>
                            {securityFlags.length > 0 && (
                                <div>
                                    <span className="text-slate-400 block">Security Flags:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {securityFlags.map((flag, index) => (
                                            <span key={index} className="px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-xs text-orange-400 font-medium">
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>Last seen: {new Date(device.last_seen).toLocaleString()}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Device not available</p>
                        <p className="text-slate-500 text-xs mt-1">Device is idle or disconnected</p>
                    </div>
                )}
            </motion.div>
        );
    };

    const getDeviceTypeStats = () => {
        const stats: Record<string, { total: number; connected: number }> = {};
        
        devices.forEach(device => {
            if (!stats[device.device_type]) {
                stats[device.device_type] = { total: 0, connected: 0 };
            }
            stats[device.device_type].total++;
            if (device.is_connected) {
                stats[device.device_type].connected++;
            }
        });
        
        return stats;
    };

    const deviceStats = getDeviceTypeStats();

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Network className="w-8 h-8 text-emerald-400" />
                            Network Gateways Monitoring
                        </h1>
                        <p className="text-slate-400">Real-time monitoring of network adapters and communication interfaces</p>
                    </div>
                    <div className="flex items-center gap-3">
                    <button
                        onClick={saveNetworkOverview}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Save Overview
                    </button>
                    <button
                        onClick={triggerScan}
                        disabled={scanning}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                        {scanning ? 'Scanning...' : 'Scan Now'}
                    </button>
                </div>
                </div>
            </div>

            {/* Device Type Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                {Object.entries(deviceStats).map(([deviceType, stats]) => {
                    const Icon = NETWORK_TYPE_ICONS[deviceType] || Network;
                    return (
                        <motion.div
                            key={deviceType}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center"
                        >
                            <Icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <div className="text-white font-semibold text-lg">{stats.connected}</div>
                            <div className="text-slate-400 text-xs">{deviceType}</div>
                            <div className="text-slate-500 text-xs mt-1">{stats.total} total</div>
                        </motion.div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    <span className="text-slate-400 ml-3">Loading network devices...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {devices.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Network Devices Found</h3>
                            <p className="text-slate-400 mb-6">Connect network adapters to begin monitoring</p>
                            <button
                                onClick={triggerScan}
                                disabled={scanning}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Search className="w-4 h-4" />
                                Scan for Devices
                            </button>
                        </div>
                    ) : (
                        devices.map((device) => (
                            <DeviceCard key={device.id} device={device} />
                        ))
                    )}
                </div>
            )}

            {/* Recent Events */}
            {events.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        Recent Network Events
                    </h2>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-slate-400 font-medium">Timestamp</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Event Type</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Device MAC</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.slice(0, 10).map((event) => (
                                        <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-slate-300 text-sm">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    event.event_type === 'CONNECTED' 
                                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                                        : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {event.event_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 font-mono text-sm">
                                                {event.device_mac}
                                            </td>
                                            <td className="p-4 text-slate-300 text-sm">
                                                {event.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
