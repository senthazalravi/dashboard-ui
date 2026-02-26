import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Printer,
    Wifi,
    Scan,
    Copy,
    Search,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    AlertCircle,
    Shield,
    Settings,
    FileText,
    Network,
    Download,
} from 'lucide-react';

interface PrintingDevice {
    id: number;
    device_type: string;
    vendor_id: string;
    product_id: string;
    device_name: string;
    device_id: string;
    is_connected: boolean;
    is_powered: boolean;
    is_printing: boolean;
    is_scanning: boolean;
    is_copying: boolean;
    paper_tray_count: number | null;
    paper_level: string | null;
    ink_level: string | null;
    resolution: string | null;
    color_capability: boolean;
    duplex_capability: boolean;
    network_address: string | null;
    port_name: string | null;
    driver_version: string | null;
    last_seen: string;
    status: string;
    security_flags: string;
}

interface PrintingEvent {
    id: number;
    device_id: string;
    event_type: string;
    timestamp: string;
    details: string;
}

const PrintingMonitoring = () => {
    const [devices, setDevices] = useState<PrintingDevice[]>([]);
    const [events, setEvents] = useState<PrintingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchPrintingData = async () => {
        try {
            setLoading(true);
            const [devicesRes, eventsRes] = await Promise.all([
                fetch('http://localhost:3005/api/printing/devices'),
                fetch('http://localhost:3005/api/printing/events')
            ]);

            if (!devicesRes.ok) {
                console.error('Printing devices API error:', devicesRes.status, devicesRes.statusText);
                setDevices([]);
                return;
            }
            if (!eventsRes.ok) {
                console.error('Printing events API error:', eventsRes.status, eventsRes.statusText);
                setEvents([]);
                return;
            }

            const devicesData = await devicesRes.json();
            const eventsData = await eventsRes.json();

            setDevices(devicesData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch printing data:', error);
            setDevices([]);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const savePrintingOverview = async () => {
        try {
            const overview = {
                timestamp: new Date().toISOString(),
                summary: {
                    total_devices: devices.length,
                    connected_devices: devices.filter(d => d.is_connected).length,
                    powered_devices: devices.filter(d => d.is_powered).length,
                    active_printing: devices.filter(d => d.is_printing).length,
                    active_scanning: devices.filter(d => d.is_scanning).length,
                    total_events: events.length,
                    device_types: [...new Set(devices.map(d => d.device_type))],
                    network_printers: devices.filter(d => d.network_address !== null).length,
                    color_printers: devices.filter(d => d.color_capability).length
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
                    is_printing: device.is_printing,
                    is_scanning: device.is_scanning,
                    is_copying: device.is_copying,
                    paper_tray_count: device.paper_tray_count,
                    paper_level: device.paper_level,
                    ink_level: device.ink_level,
                    resolution: device.resolution,
                    color_capability: device.color_capability,
                    duplex_capability: device.duplex_capability,
                    network_address: device.network_address,
                    port_name: device.port_name,
                    driver_version: device.driver_version,
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
            const response = await fetch('http://localhost:3005/api/save-printing-overview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(overview)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Printing overview saved:', result.filename);
            } else {
                console.error('Failed to save printing overview');
            }
        } catch (error) {
            console.error('Error saving printing overview:', error);
        }
    };

    const triggerScan = async () => {
        try {
            setScanning(true);
            const scanRes = await fetch('http://localhost:3005/api/printing/scan', {
                method: 'POST'
            });
            
            if (!scanRes.ok) {
                console.error('Printing scan API error:', scanRes.status, scanRes.statusText);
                setScanning(false);
                return;
            }
            
            // Wait for scan to complete, then refresh data and save overview
            setTimeout(async () => {
                const [devicesRes, eventsRes] = await Promise.all([
                    fetch('http://localhost:3005/api/printing/devices'),
                    fetch('http://localhost:3005/api/printing/events')
                ]);
                
                const devicesData = await devicesRes.json();
                const eventsData = await eventsRes.json();
                
                setDevices(devicesData);
                setEvents(eventsData);
                
                await savePrintingOverview(devicesData, eventsData);
                setScanning(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to trigger printing scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchPrintingData();
        const interval = setInterval(fetchPrintingData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getPrintingIcon = (deviceType: string) => {
        if (!deviceType) return <Printer className="w-5 h-5" />;
        
        switch (deviceType.toLowerCase()) {
            case 'usbprinter': return <Printer className="w-5 h-5" />;
            case 'networkprinter': return <Wifi className="w-5 h-5" />;
            case 'scanner': return <Scan className="w-5 h-5" />;
            case 'multifunctiondevice': return <Copy className="w-5 h-5" />;
            default: return <Printer className="w-5 h-5" />;
        }
    };

    const getStatusIcon = (device: PrintingDevice) => {
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

    const getStatusColor = (device: PrintingDevice) => {
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

    const getPaperLevelIcon = (paperLevel: string | null) => {
        if (!paperLevel) return <FileText className="w-3 h-3 text-gray-400" />;
        
        const level = parseInt(paperLevel.replace(/[^0-9]/g, ''));
        if (level > 70) {
            return <FileText className="w-3 h-3 text-emerald-400" />;
        } else if (level > 30) {
            return <FileText className="w-3 h-3 text-yellow-400" />;
        } else {
            return <FileText className="w-3 h-3 text-red-400" />;
        }
    };

    const getInkLevelIcon = (inkLevel: string | null) => {
        if (!inkLevel) return <Settings className="w-3 h-3 text-gray-400" />;
        
        const level = parseInt(inkLevel.replace(/[^0-9]/g, ''));
        if (level > 70) {
            return <Settings className="w-3 h-3 text-emerald-400" />;
        } else if (level > 30) {
            return <Settings className="w-3 h-3 text-yellow-400" />;
        } else {
            return <Settings className="w-3 h-3 text-red-400" />;
        }
    };

    const PrintingDeviceCard = ({ device }: { device: PrintingDevice }) => {
        const securityFlags = getSecurityFlags(device.security_flags);
        const isSuspicious = securityFlags.length > 0 || device.status === 'ERROR';
        const iconElement = getPrintingIcon(device.device_type || '');

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
                                {device.is_printing && (
                                    <div className="flex items-center gap-1">
                                        <Printer className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs text-blue-400">Printing</span>
                                    </div>
                                )}
                                {device.is_scanning && (
                                    <div className="flex items-center gap-1">
                                        <Scan className="w-3 h-3 text-purple-400" />
                                        <span className="text-xs text-purple-400">Scanning</span>
                                    </div>
                                )}
                                {device.is_copying && (
                                    <div className="flex items-center gap-1">
                                        <Copy className="w-3 h-3 text-green-400" />
                                        <span className="text-xs text-green-400">Copying</span>
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
                                    <span className="text-slate-400 block">Paper Level:</span>
                                    <div className="flex items-center gap-1">
                                        {getPaperLevelIcon(device.paper_level)}
                                        <span className="text-white text-xs">{device.paper_level || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Ink Level:</span>
                                    <div className="flex items-center gap-1">
                                        {getInkLevelIcon(device.ink_level)}
                                        <span className="text-white text-xs">{device.ink_level || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Resolution:</span>
                                    <span className="text-white text-xs">{device.resolution || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Trays:</span>
                                    <span className="text-white text-xs">{device.paper_tray_count || 'Unknown'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 block">Color:</span>
                                    <span className="text-white text-xs">{device.color_capability ? 'Yes' : 'No'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Duplex:</span>
                                    <span className="text-white text-xs">{device.duplex_capability ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                            {device.network_address && (
                                <div>
                                    <span className="text-slate-400 block">Network:</span>
                                    <div className="flex items-center gap-1">
                                        <Network className="w-3 h-3 text-blue-400" />
                                        <span className="text-white text-xs">{device.network_address}</span>
                                    </div>
                                </div>
                            )}
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
    const connectedDevices = devices.filter(d => d && d.is_connected).length;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Printing & Scanning</h1>
                <p className="text-slate-400">Monitor USB printers, network printers, scanners, and multi-function devices</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white">{devices.length}</p>
                        </div>
                        <Printer className="w-8 h-8 text-slate-600" />
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
                            <p className="text-slate-400 text-sm">Connected</p>
                            <p className="text-2xl font-bold text-blue-400">{connectedDevices}</p>
                        </div>
                        <Wifi className="w-8 h-8 text-blue-600" />
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
                            placeholder="Search printing devices..."
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={savePrintingOverview}
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
                    <Printer className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Printing Devices Found</h3>
                    <p className="text-slate-400 mb-4">No printing or scanning devices are currently connected or detected</p>
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
                        <PrintingDeviceCard key={device.id || Math.random()} device={device} />
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

export default PrintingMonitoring;
