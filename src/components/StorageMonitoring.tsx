import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    HardDrive,
    Shield,
    Activity,
    Search,
    RefreshCw,
    Usb,
    Database,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

interface StorageDevice {
    id: number;
    device_type: string;
    vendor_id: string;
    product_id: string;
    serial_number: string;
    capacity_bytes: number;
    is_connected: boolean;
    mount_point?: string;
    last_seen: string;
    status: string;
}

interface StorageEvent {
    id: number;
    device_serial: string;
    event_type: string;
    timestamp: string;
    details: string;
}

const STORAGE_TYPE_ICONS: Record<string, any> = {
    "USB Flash Drive": Usb,
    "External HDD/SSD": HardDrive,
    "External SSD": HardDrive,
    "USB CD/DVD": Database,
    "SD Card Reader": Database,
    "Thunderbolt Storage": Shield,
    "NVMe Enclosure": HardDrive,
    "Smartphone (MTP)": Database,
    "Mass Storage Adapter": Usb,
};

export default function StorageMonitoring() {
    const [devices, setDevices] = useState<StorageDevice[]>([]);
    const [events, setEvents] = useState<StorageEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchStorageData = async () => {
        try {
            setLoading(true);
            const [devicesRes, eventsRes] = await Promise.all([
                fetch('http://localhost:3005/api/storage/devices'),
                fetch('http://localhost:3005/api/storage/events')
            ]);

            const devicesData = await devicesRes.json();
            const eventsData = await eventsRes.json();

            setDevices(devicesData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch storage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveStorageOverview = async (devices: StorageDevice[], events: StorageEvent[]) => {
        try {
            const overview = {
                timestamp: new Date().toISOString(),
                summary: {
                    total_devices: devices.length,
                    connected_devices: devices.filter(d => d.is_connected).length,
                    total_events: events.length,
                    storage_types: [...new Set(devices.map(d => d.device_type))],
                    total_capacity_gb: devices.reduce((sum, d) => sum + (d.capacity_bytes / (1024 * 1024 * 1024)), 0)
                },
                devices: devices.map(device => ({
                    id: device.id,
                    device_type: device.device_type,
                    vendor_id: device.vendor_id,
                    product_id: device.product_id,
                    serial_number: device.serial_number,
                    capacity_bytes: device.capacity_bytes,
                    capacity_gb: device.capacity_bytes / (1024 * 1024 * 1024),
                    is_connected: device.is_connected,
                    mount_point: device.mount_point,
                    last_seen: device.last_seen,
                    status: device.status
                })),
                events: events.map(event => ({
                    id: event.id,
                    device_serial: event.device_serial,
                    event_type: event.event_type,
                    timestamp: event.timestamp,
                    details: event.details
                }))
            };

            // Save to JSON file via API
            const response = await fetch('http://localhost:3005/api/save-storage-overview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(overview)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Storage overview saved:', result.filename);
            } else {
                console.error('Failed to save storage overview');
            }
        } catch (error) {
            console.error('Error saving storage overview:', error);
        }
    };

    const triggerScan = async () => {
        try {
            setScanning(true);
            await fetch('http://localhost:3005/api/storage/scan', {
                method: 'POST'
            });
            // Wait a moment for scan to complete, then refresh data and save overview
            setTimeout(async () => {
                const [devicesRes, eventsRes] = await Promise.all([
                    fetch('http://localhost:3005/api/storage/devices'),
                    fetch('http://localhost:3005/api/storage/events')
                ]);
                
                const devicesData = await devicesRes.json();
                const eventsData = await eventsRes.json();
                
                setDevices(devicesData);
                setEvents(eventsData);
                
                await saveStorageOverview(devicesData, eventsData);
                setScanning(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to trigger scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchStorageData();
        const interval = setInterval(fetchStorageData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (device: StorageDevice) => {
        if (device.status === 'ACTIVE') {
            return <CheckCircle className="w-4 h-4 text-emerald-400" />;
        } else if (device.status === 'NOT_AVAILABLE') {
            return <AlertCircle className="w-4 h-4 text-gray-400" />;
        } else {
            return <XCircle className="w-4 h-4 text-red-400" />;
        }
    };

    const getStatusColor = (device: StorageDevice) => {
        if (device.status === 'ACTIVE') {
            return 'border-emerald-500/20 bg-emerald-500/5';
        } else if (device.status === 'NOT_AVAILABLE') {
            return 'border-gray-500/20 bg-gray-500/5';
        } else {
            return 'border-red-500/20 bg-red-500/5';
        }
    };

    const formatCapacity = (bytes: number) => {
        if (bytes === 0) return 'Unknown';
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(1)} GB`;
    };

    const DeviceCard = ({ device }: { device: StorageDevice }) => {
        const Icon = STORAGE_TYPE_ICONS[device.device_type] || Database;
        
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-white/10 backdrop-blur-xl border rounded-xl p-6 transition-all duration-300 ${getStatusColor(device)}`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-300" />
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Capacity:</span>
                                    <span className="text-white text-xs">{formatCapacity(device.capacity_bytes)}</span>
                                </div>
                                {device.mount_point && (
                                    <div>
                                        <span className="text-slate-400 block">Mount Point:</span>
                                        <span className="text-white font-mono text-xs">{device.mount_point}</span>
                                    </div>
                                )}
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
                        <p className="text-slate-500 text-xs mt-1">Connect device to monitor</p>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <HardDrive className="w-8 h-8 text-rose-400" />
                            Storage & Mass Media Monitoring
                        </h1>
                        <p className="text-slate-400">Real-time monitoring of all storage devices and mass media interfaces</p>
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

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    <span className="text-slate-400 ml-3">Loading storage devices...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {devices.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Storage Devices Found</h3>
                            <p className="text-slate-400 mb-6">Connect storage devices to begin monitoring</p>
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
                        <Activity className="w-6 h-6 text-blue-400" />
                        Recent Storage Events
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
