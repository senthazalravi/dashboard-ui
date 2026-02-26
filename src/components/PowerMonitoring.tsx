import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Battery,
    Usb,
    Monitor,
    Search,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    AlertCircle,
    Shield,
    Power,
    Zap as Thunderbolt,
    Cpu,
    Database,
    Download,
} from 'lucide-react';

interface PowerDevice {
    id: number;
    device_type: string;
    vendor_id: string;
    product_id: string;
    device_name: string;
    device_id: string;
    is_connected: boolean;
    is_powered: boolean;
    power_consumption: string | null;
    voltage: string | null;
    amperage: string | null;
    capacity: string | null;
    battery_level: string | null;
    port_count: number | null;
    last_seen: string;
    status: string;
    security_flags: string;
}

interface PowerEvent {
    id: number;
    device_id: string;
    event_type: string;
    timestamp: string;
    details: string;
}

const PowerMonitoring = () => {
    const [devices, setDevices] = useState<PowerDevice[]>([]);
    const [events, setEvents] = useState<PowerEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchPowerData = async () => {
        try {
            setLoading(true);
            const [devicesRes, eventsRes] = await Promise.all([
                fetch('http://localhost:3005/api/power/devices'),
                fetch('http://localhost:3005/api/power/events')
            ]);

            // Check if responses are ok before parsing JSON
            if (!devicesRes.ok) {
                console.error('Power devices API error:', devicesRes.status, devicesRes.statusText);
                setDevices([]);
                return;
            }
            if (!eventsRes.ok) {
                console.error('Power events API error:', eventsRes.status, eventsRes.statusText);
                setEvents([]);
                return;
            }

            const devicesData = await devicesRes.json();
            const eventsData = await eventsRes.json();

            setDevices(devicesData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch power data:', error);
            // Set empty arrays on error to prevent crashes
            setDevices([]);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const savePowerOverview = async () => {
        try {
            const overview = {
                timestamp: new Date().toISOString(),
                summary: {
                    total_devices: devices.length,
                    powered_devices: devices.filter(d => d.is_powered).length,
                    total_events: events.length,
                    device_types: [...new Set(devices.map(d => d.device_type))],
                    battery_devices: devices.filter(d => d.battery_level !== null).length,
                    ups_devices: devices.filter(d => d.device_type.includes('UPS')).length
                },
                devices: devices.map(device => ({
                    id: device.id,
                    device_type: device.device_type,
                    vendor_id: device.vendor_id,
                    product_id: device.product_id,
                    device_name: device.device_name,
                    device_id: device.device_id,
                    is_connected: device.is_connected,
                    is_powered: device.is_powered,
                    power_consumption: device.power_consumption,
                    voltage: device.voltage,
                    amperage: device.amperage,
                    capacity: device.capacity,
                    battery_level: device.battery_level,
                    port_count: device.port_count,
                    last_seen: device.last_seen,
                    status: device.status,
                    security_flags: device.security_flags
                })),
                events: events.map(event => ({
                    id: event.id,
                    device_id: event.device_id,
                    event_type: event.event_type,
                    timestamp: event.timestamp,
                    details: event.details
                }))
            };

            // Save to JSON file via API
            const response = await fetch('http://localhost:3005/api/save-power-overview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(overview)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Power overview saved:', result.filename);
            } else {
                console.error('Failed to save power overview');
            }
        } catch (error) {
            console.error('Error saving power overview:', error);
        }
    };

    const triggerScan = async () => {
        try {
            setScanning(true);
            const scanRes = await fetch('http://localhost:3005/api/power/scan', {
                method: 'POST'
            });
            
            if (!scanRes.ok) {
                console.error('Power scan API error:', scanRes.status, scanRes.statusText);
                setScanning(false);
                return;
            }
            
            // Wait for scan to complete, then refresh data and save overview
            setTimeout(async () => {
                const [devicesRes, eventsRes] = await Promise.all([
                    fetch('http://localhost:3005/api/power/devices'),
                    fetch('http://localhost:3005/api/power/events')
                ]);
                
                const devicesData = await devicesRes.json();
                const eventsData = await eventsRes.json();
                
                setDevices(devicesData);
                setEvents(eventsData);
                
                await savePowerOverview(devicesData, eventsData);
                setScanning(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to trigger power scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchPowerData();
        const interval = setInterval(fetchPowerData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getPowerIcon = (deviceType: string) => {
        if (!deviceType) return <Zap className="w-5 h-5" />;
        
        switch (deviceType.toLowerCase()) {
            case 'ups interface': return <Battery className="w-5 h-5" />;
            case 'smart pd controller': return <Database className="w-5 h-5" />;
            case 'thunderbolt dock': return <Thunderbolt className="w-5 h-5" />;
            case 'usb hub': return <Usb className="w-5 h-5" />;
            case 'pcie hot-plug': return <Monitor className="w-5 h-5" />;
            case 'external gpu': return <Cpu className="w-5 h-5" />;
            default: return <Power className="w-5 h-5" />;
        }
    };

    const getStatusIcon = (device: PowerDevice) => {
        if (device.status === 'ACTIVE') {
            return <CheckCircle className="w-4 h-4 text-emerald-400" />;
        } else if (device.status === 'IDLE') {
            return <AlertCircle className="w-4 h-4 text-yellow-400" />;
        } else if (device.status === 'NOT_AVAILABLE') {
            return <AlertCircle className="w-4 h-4 text-gray-400" />;
        } else {
            return <XCircle className="w-4 h-4 text-red-400" />;
        }
    };

    const getStatusColor = (device: PowerDevice) => {
        if (device.status === 'ACTIVE') {
            return 'border-emerald-500/20 bg-emerald-500/5';
        } else if (device.status === 'IDLE') {
            return 'border-yellow-500/20 bg-yellow-500/5';
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

    const getPowerConsumptionIcon = (isPowered: boolean, consumption: string | null) => {
        if (!isPowered) return <Power className="w-3 h-3 text-gray-400" />;
        
        if (!consumption) return <Zap className="w-3 h-3 text-gray-400" />;
        
        const power = parseInt(consumption.replace(/[^0-9]/g, ''));
        if (power > 100) {
            return <Zap className="w-3 h-3 text-red-400" />;
        } else if (power > 50) {
            return <Zap className="w-3 h-3 text-yellow-400" />;
        } else {
            return <Zap className="w-3 h-3 text-emerald-400" />;
        }
    };

    const getBatteryIcon = (batteryLevel: string | null) => {
        if (!batteryLevel) return <Battery className="w-3 h-3 text-gray-400" />;
        
        const level = parseInt(batteryLevel.replace(/[^0-9]/g, ''));
        if (level > 70) {
            return <Battery className="w-3 h-3 text-emerald-400" />;
        } else if (level > 30) {
            return <Battery className="w-3 h-3 text-yellow-400" />;
        } else {
            return <Battery className="w-3 h-3 text-red-400" />;
        }
    };

    const PowerDeviceCard = ({ device }: { device: PowerDevice }) => {
        const securityFlags = getSecurityFlags(device.security_flags);
        const isSuspicious = securityFlags.length > 0 || device.status === 'ERROR';
        const iconElement = getPowerIcon(device.device_type || '');

        return (
            <motion.div
                key={device.id || 0}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-slate-800 rounded-lg p-4 border ${getStatusColor(device)} ${
                    isSuspicious ? 'ring-2 ring-orange-500/50' : ''
                }`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSuspicious ? 'bg-orange-900/50' : 'bg-slate-700'
                        }`}>
                            {iconElement}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg">{device.device_type || 'Unknown Device'}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(device)}
                                <span className={`text-sm font-medium ${
                                    device.status === 'ACTIVE' ? 'text-emerald-400' : 
                                     device.status === 'IDLE' ? 'text-yellow-400' :
                                     device.status === 'NOT_AVAILABLE' ? 'text-gray-400' : 'text-red-400'
                                }`}>
                                    {device.status === 'ACTIVE' ? 'Active' : 
                                     device.status === 'IDLE' ? 'Idle' :
                                     device.status === 'NOT_AVAILABLE' ? 'Not Available' : 'Error'}
                                </span>
                                {device.is_powered && (
                                    <div className="flex items-center gap-1">
                                        {getPowerConsumptionIcon(device.is_powered, device.power_consumption)}
                                        <span className="text-xs text-emerald-400">Powered</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {device.is_connected ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 block">Device Name:</span>
                                <span className="text-white text-xs break-words">{device.device_name || 'Unknown Device'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Vendor ID:</span>
                                    <span className="text-white font-mono text-xs">{device.vendor_id || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Product ID:</span>
                                    <span className="text-white font-mono text-xs">{device.product_id || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Power:</span>
                                    <div className="flex items-center gap-1">
                                        {getPowerConsumptionIcon(device.is_powered, device.power_consumption)}
                                        <span className="text-white text-xs">{device.power_consumption || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Voltage:</span>
                                    <span className="text-white text-xs">{device.voltage || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Amperage:</span>
                                    <span className="text-white text-xs">{device.amperage || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Capacity:</span>
                                    <span className="text-white text-xs">{device.capacity || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Battery:</span>
                                    <div className="flex items-center gap-1">
                                        {getBatteryIcon(device.battery_level)}
                                        <span className="text-white text-xs">{device.battery_level || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Ports:</span>
                                    <span className="text-white text-xs">{device.port_count || 'Unknown'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Device ID:</span>
                                <span className="text-white font-mono text-xs break-all">{device.device_id || 'Unknown'}</span>
                            </div>
                        </div>
                        
                        {securityFlags.length > 0 && (
                            <div className="pt-3 border-t border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-orange-400" />
                                    <span className="text-sm font-medium text-orange-400">Security Flags</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {securityFlags.slice(0, 3).map((flag, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded border border-orange-500/30"
                                        >
                                            {flag}
                                        </span>
                                    ))}
                                    {securityFlags.length > 3 && (
                                        <span className="px-2 py-1 text-xs bg-slate-600 text-slate-300 rounded">
                                            +{securityFlags.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Device not available</p>
                        <p className="text-slate-500 text-xs mt-1">Connect device to monitor</p>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-4 pt-3 border-t border-slate-700">
                    <Clock className="w-3 h-3" />
                    <span>Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Unknown'}</span>
                </div>
            </motion.div>
        );
    };

    const activeDevices = devices.filter(d => d && d.status === 'ACTIVE').length;
    const idleDevices = devices.filter(d => d && d.status === 'IDLE').length;
    const poweredDevices = devices.filter(d => d && d.is_connected && d.is_powered).length;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Power & Hardware Layer</h1>
                <p className="text-slate-400">Monitor UPS, PD controllers, Thunderbolt docks, USB hubs, PCIe devices, and external GPUs</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white">{devices.length}</p>
                        </div>
                        <Zap className="w-8 h-8 text-slate-600" />
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Active</p>
                            <p className="text-2xl font-bold text-emerald-400">{activeDevices}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Idle</p>
                            <p className="text-2xl font-bold text-yellow-400">{idleDevices}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Powered</p>
                            <p className="text-2xl font-bold text-blue-400">{poweredDevices}</p>
                        </div>
                        <Power className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search power devices..."
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={savePowerOverview}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Save Overview
                    </button>
                    <button
                        onClick={triggerScan}
                        disabled={scanning}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                        {scanning ? 'Scanning...' : 'Scan Devices'}
                    </button>
                </div>
            </div>

            {/* Device Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-lg p-4 border border-slate-700 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-slate-700 rounded animate-pulse mb-2"></div>
                                    <div className="h-3 bg-slate-700 rounded animate-pulse w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-3 bg-slate-700 rounded animate-pulse w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : devices.length === 0 ? (
                <div className="text-center py-12">
                    <Zap className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Power Devices Found</h3>
                    <p className="text-slate-400 mb-4">No power devices are currently connected or detected</p>
                    <button
                        onClick={triggerScan}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Scan for Devices
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.filter(d => d).map((device) => (
                        <PowerDeviceCard key={device.id || Math.random()} device={device} />
                    ))}
                </div>
            )}

            {/* Recent Events */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Events</h2>
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    {events.length === 0 ? (
                        <div className="p-8 text-center">
                            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-400">No recent events</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700">
                            {events.filter(e => e).slice(0, 5).map((event) => (
                                <div key={event.id || Math.random()} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{event.event_type || 'Unknown Event'}</p>
                                            <p className="text-slate-400 text-xs">{event.details || 'No details available'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs">
                                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown time'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PowerMonitoring;
