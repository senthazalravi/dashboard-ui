import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Keyboard,
    Mouse,
    Gamepad2,
    Barcode,
    CreditCard,
    Monitor,
    Shield,
    Activity,
    Search,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TriangleAlert
} from 'lucide-react';

interface HIDDevice {
    id: number;
    device_type: string;
    vendor_id: string;
    product_id: string;
    serial_number: string;
    device_name: string;
    is_connected: boolean;
    last_seen: string;
    status: string;
    device_path: string;
}

interface HIDEvent {
    id: number;
    device_serial: string;
    event_type: string;
    timestamp: string;
    details: string;
}

const HID_TYPE_ICONS: Record<string, any> = {
    "Keyboard": Keyboard,
    "Mouse": Mouse,
    "Gaming Controller": Gamepad2,
    "Barcode Scanner": Barcode,
    "Smart Card Reader": CreditCard,
    "KVM Switch": Monitor,
    "Rubber Ducky Device": Shield,
};

export default function HIDMonitoring() {
    const [devices, setDevices] = useState<HIDDevice[]>([]);
    const [events, setEvents] = useState<HIDEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchHIDData = async () => {
        try {
            setLoading(true);
            const [devicesRes, eventsRes] = await Promise.all([
                fetch('http://localhost:3005/api/hid/devices'),
                fetch('http://localhost:3005/api/hid/events')
            ]);

            const devicesData = await devicesRes.json();
            const eventsData = await eventsRes.json();

            setDevices(devicesData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch HID data:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerScan = async () => {
        try {
            setScanning(true);
            await fetch('http://localhost:3005/api/hid/scan', {
                method: 'POST'
            });
            // Wait a moment for scan to complete, then refresh data
            setTimeout(() => {
                fetchHIDData();
                setScanning(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to trigger HID scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchHIDData();
        const interval = setInterval(fetchHIDData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (device: HIDDevice) => {
        if (device.is_connected) {
            return <CheckCircle className="w-4 h-4 text-emerald-400" />;
        } else {
            return <XCircle className="w-4 h-4 text-red-400" />;
        }
    };

    const getStatusColor = (device: HIDDevice) => {
        if (device.is_connected) {
            return 'border-emerald-500/20 bg-emerald-500/5';
        } else {
            return 'border-red-500/20 bg-red-500/5';
        }
    };

    const isSuspiciousDevice = (device: HIDDevice) => {
        const suspiciousPatterns = [
            'rubber ducky',
            'ducky',
            'bash bunny',
            'usb attack',
            'malicious device',
            'unknown device',
            'hid keyboard device'
        ];
        
        const deviceNameLower = device.device_name.toLowerCase();
        return suspiciousPatterns.some(pattern => deviceNameLower.includes(pattern)) ||
               device.device_type === 'Rubber Ducky Device';
    };

    const DeviceCard = ({ device }: { device: HIDDevice }) => {
        const Icon = HID_TYPE_ICONS[device.device_type] || Keyboard;
        const isSuspicious = isSuspiciousDevice(device);
        
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-white/10 backdrop-blur-xl border rounded-xl p-6 transition-all duration-300 ${getStatusColor(device)} ${
                    isSuspicious ? 'border-red-500/50 bg-red-500/10' : ''
                }`}
            >
                {isSuspicious && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                        <TriangleAlert className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400 font-medium">SUSPICIOUS</span>
                    </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSuspicious ? 'bg-red-900/50' : 'bg-slate-700'
                        }`}>
                            <Icon className={`w-5 h-5 ${
                                isSuspicious ? 'text-red-400' : 'text-slate-300'
                            }`} />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg">{device.device_type}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(device)}
                                <span className={`text-sm font-medium ${
                                    device.is_connected ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                    {device.is_connected ? 'Connected' : 'IDLE'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {device.is_connected ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 block">Device Name:</span>
                                <span className="text-white text-xs break-words">{device.device_name}</span>
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
                            <div>
                                <span className="text-slate-400 block">Serial Number:</span>
                                <span className="text-white font-mono text-xs break-all">{device.serial_number}</span>
                            </div>
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
                            <Keyboard className="w-8 h-8 text-amber-400" />
                            Human Interface Devices (HID) Monitoring
                        </h1>
                        <p className="text-slate-400">Real-time monitoring of keyboards, mice, gaming controllers, and security devices</p>
                    </div>
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

            {/* Device Type Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                {Object.entries(deviceStats).map(([deviceType, stats]) => {
                    const Icon = HID_TYPE_ICONS[deviceType] || Keyboard;
                    return (
                        <motion.div
                            key={deviceType}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center"
                        >
                            <Icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
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
                    <span className="text-slate-400 ml-3">Loading HID devices...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {devices.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <Keyboard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No HID Devices Found</h3>
                            <p className="text-slate-400 mb-6">Connect keyboards, mice, or other input devices to begin monitoring</p>
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
                        <Activity className="w-6 h-6 text-amber-400" />
                        Recent HID Events
                    </h2>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-slate-400 font-medium">Timestamp</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Event Type</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Device Serial</th>
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
                                                {event.device_serial}
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
