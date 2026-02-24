import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Mic,
    AudioLines,
    Headphones,
    Usb,
    Monitor,
    Activity,
    Search,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TriangleAlert,
    Volume2,
    VolumeX,
    Radio,
    AlertCircle
} from 'lucide-react';

interface AudioDevice {
    id: number;
    device_type: string;
    vendor_id: string;
    product_id: string;
    device_name: string;
    device_id: string;
    is_connected: boolean;
    is_recording: boolean;
    is_playback: boolean;
    sample_rate?: string;
    bit_depth?: string;
    channels?: string;
    last_seen: string;
    status: string;
    security_flags: string;
}

interface AudioEvent {
    id: number;
    device_id: string;
    event_type: string;
    timestamp: string;
    details: string;
}

const AUDIO_TYPE_ICONS: Record<string, any> = {
    "Microphone": Mic,
    "Line-in Device": AudioLines,
    "Headset": Headphones,
    "USB Sound Card": Usb,
    "HDMI Audio Channel": Monitor,
};

export default function AudioMonitoring() {
    const [devices, setDevices] = useState<AudioDevice[]>([]);
    const [events, setEvents] = useState<AudioEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const fetchAudioData = async () => {
        try {
            setLoading(true);
            const [devicesRes, eventsRes] = await Promise.all([
                fetch('http://localhost:3005/api/audio/devices'),
                fetch('http://localhost:3005/api/audio/events')
            ]);

            const devicesData = await devicesRes.json();
            const eventsData = await eventsRes.json();

            setDevices(devicesData);
            setEvents(eventsData);
        } catch (error) {
            console.error('Failed to fetch audio data:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerScan = async () => {
        try {
            setScanning(true);
            await fetch('http://localhost:3005/api/audio/scan', {
                method: 'POST'
            });
            // Wait a moment for scan to complete, then refresh data
            setTimeout(() => {
                fetchAudioData();
                setScanning(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to trigger audio scan:', error);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchAudioData();
        const interval = setInterval(fetchAudioData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (device: AudioDevice) => {
        if (device.status === 'ACTIVE') {
            return <CheckCircle className="w-4 h-4 text-emerald-400" />;
        } else if (device.status === 'NOT_AVAILABLE') {
            return <AlertCircle className="w-4 h-4 text-gray-400" />;
        } else {
            return <XCircle className="w-4 h-4 text-red-400" />;
        }
    };

    const getStatusColor = (device: AudioDevice) => {
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

    const isSuspiciousDevice = (device: AudioDevice) => {
        const flags = getSecurityFlags(device.security_flags);
        return flags.length > 0 || 
               device.vendor_id === "UNKNOWN" ||
               device.device_type === "USB Sound Card" ||
               device.is_recording;
    };

    const DeviceCard = ({ device }: { device: AudioDevice }) => {
        const Icon = AUDIO_TYPE_ICONS[device.device_type] || AudioLines;
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
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    {device.is_recording ? (
                                        <Radio className="w-3 h-3 text-red-400" />
                                    ) : (
                                        <VolumeX className="w-3 h-3 text-slate-500" />
                                    )}
                                    <span className="text-xs text-slate-400">Recording</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {device.is_playback ? (
                                        <Volume2 className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <VolumeX className="w-3 h-3 text-slate-500" />
                                    )}
                                    <span className="text-xs text-slate-400">Playback</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs text-slate-400">Active</span>
                                </div>
                            </div>
                            {(device.sample_rate || device.bit_depth || device.channels) && (
                                <div className="grid grid-cols-3 gap-4">
                                    {device.sample_rate && (
                                        <div>
                                            <span className="text-slate-400 block">Sample Rate:</span>
                                            <span className="text-white text-xs">{device.sample_rate}</span>
                                        </div>
                                    )}
                                    {device.bit_depth && (
                                        <div>
                                            <span className="text-slate-400 block">Bit Depth:</span>
                                            <span className="text-white text-xs">{device.bit_depth}</span>
                                        </div>
                                    )}
                                    {device.channels && (
                                        <div>
                                            <span className="text-slate-400 block">Channels:</span>
                                            <span className="text-white text-xs">{device.channels}</span>
                                        </div>
                                    )}
                                </div>
                            )}
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
        const stats: Record<string, { total: number; connected: number; recording: number }> = {};
        
        devices.forEach(device => {
            if (!stats[device.device_type]) {
                stats[device.device_type] = { total: 0, connected: 0, recording: 0 };
            }
            stats[device.device_type].total++;
            if (device.is_connected) {
                stats[device.device_type].connected++;
            }
            if (device.is_recording) {
                stats[device.device_type].recording++;
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
                            <Mic className="w-8 h-8 text-indigo-400" />
                            Audio Devices Monitoring
                        </h1>
                        <p className="text-slate-400">Real-time monitoring of microphones, audio interfaces, and sound devices</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {Object.entries(deviceStats).map(([deviceType, stats]) => {
                    const Icon = AUDIO_TYPE_ICONS[deviceType] || AudioLines;
                    return (
                        <motion.div
                            key={deviceType}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center"
                        >
                            <Icon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                            <div className="text-white font-semibold text-lg">{stats.connected}</div>
                            <div className="text-slate-400 text-xs">{deviceType}</div>
                            <div className="text-slate-500 text-xs mt-1">{stats.total} total</div>
                            {stats.recording > 0 && (
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <Radio className="w-3 h-3 text-red-400" />
                                    <span className="text-xs text-red-400">{stats.recording} recording</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    <span className="text-slate-400 ml-3">Loading audio devices...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {devices.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <Mic className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Audio Devices Found</h3>
                            <p className="text-slate-400 mb-6">Connect audio devices to begin monitoring</p>
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
                        <Activity className="w-6 h-6 text-indigo-400" />
                        Recent Audio Events
                    </h2>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-slate-400 font-medium">Timestamp</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Event Type</th>
                                        <th className="text-left p-4 text-slate-400 font-medium">Device ID</th>
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
                                                {event.device_id}
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
