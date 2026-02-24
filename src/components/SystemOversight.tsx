import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Monitor,
    HardDrive,
    Mic,
    Network,
    Keyboard,
    Search,
    RefreshCw,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Camera,
    Wifi
} from 'lucide-react';

interface SystemDevice {
    id: string;
    name: string;
    type: 'storage' | 'audio' | 'network' | 'hid' | 'video' | 'wireless';
    deviceType: string;
    status: 'ACTIVE' | 'NOT_AVAILABLE' | 'ERROR' | 'IDLE';
    vendor: string;
    product: string;
    serial: string;
    lastSeen: string;
    securityFlags: string[];
    details?: Record<string, any>;
}

const SystemOversight = () => {
    const [devices, setDevices] = useState<SystemDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'storage' | 'audio' | 'network' | 'hid' | 'video' | 'wireless'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'NOT_AVAILABLE' | 'ERROR'>('all');
    const [scanning, setScanning] = useState(false);

    const fetchAllDevices = async () => {
        try {
            setLoading(true);
            
            // Fetch all device types
            const [storageRes, audioRes, networkRes, hidRes, videoRes, wirelessRes] = await Promise.all([
                fetch('http://localhost:3005/api/storage/devices'),
                fetch('http://localhost:3005/api/audio/devices'),
                fetch('http://localhost:3005/api/network/devices'),
                fetch('http://localhost:3005/api/hid/devices'),
                fetch('http://localhost:3005/api/video/devices'),
                fetch('http://localhost:3005/api/wireless/devices')
            ]);

            const [storageData, audioData, networkData, hidData, videoData, wirelessData] = await Promise.all([
                storageRes.json(),
                audioRes.json(),
                networkRes.json(),
                hidRes.json(),
                videoRes.json(),
                wirelessRes.json()
            ]);

            // Transform and combine all devices
            const allDevices: SystemDevice[] = [
                ...storageData.map((device: any) => ({
                    id: `storage-${device.id}`,
                    name: device.device_name || 'Unknown Storage',
                    type: 'storage' as const,
                    deviceType: device.device_type,
                    status: device.status,
                    vendor: device.vendor_id,
                    product: device.product_id,
                    serial: device.serial_number,
                    lastSeen: device.last_seen,
                    securityFlags: device.security_flags ? JSON.parse(device.security_flags) : [],
                    details: {
                        capacity: device.capacity_bytes,
                        mountPoint: device.mount_point
                    }
                })),
                ...audioData.map((device: any) => ({
                    id: `audio-${device.id}`,
                    name: device.device_name || 'Unknown Audio',
                    type: 'audio' as const,
                    deviceType: device.device_type,
                    status: device.status,
                    vendor: device.vendor_id,
                    product: device.product_id,
                    serial: device.device_id,
                    lastSeen: device.last_seen,
                    securityFlags: device.security_flags ? JSON.parse(device.security_flags) : [],
                    details: {
                        sampleRate: device.sample_rate,
                        bitDepth: device.bit_depth,
                        channels: device.channels,
                        isRecording: device.is_recording,
                        isPlayback: device.is_playback
                    }
                })),
                ...networkData.map((device: any) => ({
                    id: `network-${device.id}`,
                    name: device.device_name || 'Unknown Network',
                    type: 'network' as const,
                    deviceType: device.device_type,
                    status: device.status,
                    vendor: device.vendor_id,
                    product: device.product_id,
                    serial: device.mac_address,
                    lastSeen: device.last_seen,
                    securityFlags: device.security_flags ? JSON.parse(device.security_flags) : [],
                    details: {
                        ipAddress: device.ip_address,
                        interfaceName: device.interface_name,
                        connectionType: device.connection_type
                    }
                })),
                ...hidData.map((device: any) => ({
                    id: `hid-${device.id}`,
                    name: device.device_name || 'Unknown HID',
                    type: 'hid' as const,
                    deviceType: device.device_type,
                    status: device.status,
                    vendor: device.vendor_id,
                    product: device.product_id,
                    serial: device.serial_number,
                    lastSeen: device.last_seen,
                    securityFlags: device.security_flags ? JSON.parse(device.security_flags) : [],
                    details: {
                        devicePath: device.device_path
                    }
                })),
                ...videoData.map((device: any) => ({
                    id: `video-${device.id}`,
                    name: device.device_name || 'Unknown Video',
                    type: 'video' as const,
                    deviceType: device.device_type,
                    status: device.status,
                    vendor: device.vendor_id,
                    product: device.product_id,
                    serial: device.device_id,
                    lastSeen: device.last_seen,
                    securityFlags: device.security_flags ? JSON.parse(device.security_flags) : [],
                    details: {
                        resolution: device.resolution,
                        frameRate: device.frame_rate,
                        format: device.format,
                        isStreaming: device.is_streaming
                    }
                })),
                ...wirelessData.map((device: any) => ({
                    id: `wireless-${device.id}`,
                    name: device.device_name || 'Unknown Wireless',
                    type: 'wireless' as const,
                    deviceType: device.device_type,
                    status: device.status,
                    vendor: device.vendor_id,
                    product: device.product_id,
                    serial: device.device_id,
                    lastSeen: device.last_seen,
                    securityFlags: device.security_flags ? JSON.parse(device.security_flags) : [],
                    details: {
                        signalStrength: device.signal_strength,
                        frequency: device.frequency,
                        protocol: device.protocol,
                        batteryLevel: device.battery_level,
                        isActive: device.is_active
                    }
                }))
            ];

            setDevices(allDevices);
        } catch (error) {
            console.error('Failed to fetch system devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerFullScan = async () => {
        try {
            setScanning(true);
            
            // Trigger scans for all device types
            await Promise.all([
                fetch('http://localhost:3005/api/storage/scan', { method: 'POST' }),
                fetch('http://localhost:3005/api/audio/scan', { method: 'POST' }),
                fetch('http://localhost:3005/api/network/scan', { method: 'POST' }),
                fetch('http://localhost:3005/api/hid/scan', { method: 'POST' }),
                fetch('http://localhost:3005/api/video/scan', { method: 'POST' }),
                fetch('http://localhost:3005/api/wireless/scan', { method: 'POST' })
            ]);

            // Wait for scans to complete, then refresh data
            setTimeout(() => {
                fetchAllDevices();
                setScanning(false);
            }, 5000);
        } catch (error) {
            console.error('Failed to trigger full scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchAllDevices();
        const interval = setInterval(fetchAllDevices, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'storage': return <HardDrive className="w-5 h-5" />;
            case 'audio': return <Mic className="w-5 h-5" />;
            case 'network': return <Network className="w-5 h-5" />;
            case 'hid': return <Keyboard className="w-5 h-5" />;
            case 'video': return <Camera className="w-5 h-5" />;
            case 'wireless': return <Wifi className="w-5 h-5" />;
            default: return <Monitor className="w-5 h-5" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'NOT_AVAILABLE': return <AlertCircle className="w-4 h-4 text-gray-400" />;
            case 'ERROR': return <XCircle className="w-4 h-4 text-red-400" />;
            case 'IDLE': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-emerald-400';
            case 'NOT_AVAILABLE': return 'text-gray-400';
            case 'ERROR': return 'text-red-400';
            case 'IDLE': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'storage': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'audio': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'network': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'hid': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'video': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'wireless': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.product.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || device.type === filterType;
        const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
        
        return matchesSearch && matchesType && matchesStatus;
    });

    const formatCapacity = (bytes?: number) => {
        if (!bytes || bytes === 0) return 'Unknown';
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(1)} GB`;
    };

    const activeDevices = devices.filter(d => d.status === 'ACTIVE').length;
    const unavailableDevices = devices.filter(d => d.status === 'NOT_AVAILABLE').length;
    const errorDevices = devices.filter(d => d.status === 'ERROR').length;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">System Oversight</h1>
                <p className="text-slate-400">Comprehensive view of all connected and available devices</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white">{devices.length}</p>
                        </div>
                        <Monitor className="w-8 h-8 text-slate-600" />
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
                            <p className="text-slate-400 text-sm">Not Available</p>
                            <p className="text-2xl font-bold text-gray-400">{unavailableDevices}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-gray-600" />
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Errors</p>
                            <p className="text-2xl font-bold text-red-400">{errorDevices}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search devices..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="storage">Storage</option>
                            <option value="audio">Audio</option>
                            <option value="network">Network</option>
                            <option value="hid">HID</option>
                            <option value="video">Video</option>
                            <option value="wireless">Wireless</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="NOT_AVAILABLE">Not Available</option>
                            <option value="ERROR">Error</option>
                        </select>
                        <button
                            onClick={triggerFullScan}
                            disabled={scanning}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                            {scanning ? 'Scanning...' : 'Full Scan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Device List */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                        <p className="text-slate-400">Loading system devices...</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="p-8 text-center">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">No devices found</p>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or perform a full scan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900 border-b border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Device</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Vendor/Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Serial/ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Security</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Seen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredDevices.map((device) => (
                                    <motion.tr
                                        key={device.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="hover:bg-slate-700/50 transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(device.type)}`}>
                                                    {getDeviceIcon(device.type)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{device.name}</div>
                                                    <div className="text-slate-400 text-sm">{device.deviceType}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(device.type)}`}>
                                                {device.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(device.status)}
                                                <span className={`text-sm font-medium ${getStatusColor(device.status)}`}>
                                                    {device.status === 'ACTIVE' ? 'Active' : 
                                                     device.status === 'NOT_AVAILABLE' ? 'Not Available' : 'Error'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm">
                                                <div className="text-white font-mono">{device.vendor}</div>
                                                <div className="text-slate-400">{device.product}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-mono text-slate-300 break-all max-w-xs">
                                                {device.serial}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-slate-300">
                                                {device.type === 'storage' && device.details?.capacity && (
                                                    <div>Capacity: {formatCapacity(device.details.capacity)}</div>
                                                )}
                                                {device.type === 'audio' && device.details?.sampleRate && (
                                                    <div>{device.details.sampleRate}Hz / {device.details.bitDepth}bit</div>
                                                )}
                                                {device.type === 'network' && device.details?.ipAddress && (
                                                    <div>IP: {device.details.ipAddress}</div>
                                                )}
                                                {device.type === 'hid' && (
                                                    <div>HID Device</div>
                                                )}
                                                {device.type === 'video' && device.details?.resolution && (
                                                    <div>{device.details.resolution} @ {device.details.frameRate}fps</div>
                                                )}
                                                {device.type === 'video' && device.details?.isStreaming && (
                                                    <div className="text-red-400">Currently Streaming</div>
                                                )}
                                                {device.type === 'wireless' && device.details?.signalStrength && (
                                                    <div>Signal: {device.details.signalStrength}</div>
                                                )}
                                                {device.type === 'wireless' && device.details?.frequency && (
                                                    <div>Frequency: {device.details.frequency}</div>
                                                )}
                                                {device.type === 'wireless' && device.details?.batteryLevel && (
                                                    <div>Battery: {device.details.batteryLevel}</div>
                                                )}
                                                {device.type === 'wireless' && device.details?.isActive && (
                                                    <div className="text-yellow-400">Currently Active</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {device.securityFlags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {device.securityFlags.slice(0, 2).map((flag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded border border-orange-500/30"
                                                        >
                                                            {flag}
                                                        </span>
                                                    ))}
                                                    {device.securityFlags.length > 2 && (
                                                        <span className="px-2 py-1 text-xs bg-slate-600 text-slate-300 rounded">
                                                            +{device.securityFlags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Shield className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-sm text-emerald-400">Secure</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {new Date(device.lastSeen).toLocaleString()}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemOversight;
