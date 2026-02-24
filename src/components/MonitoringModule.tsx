import { motion } from "framer-motion";
import {
    Shield,
    Activity,
    Info,
    Cpu,
    HardDrive,
    Zap,
    Mic,
    Camera,
    Network,
    Wifi,
    Printer,
    Box,
    Keyboard,
    ShieldCheck,
    Search,
    Filter,
    ArrowUpRight,
    Clock,
    Server
} from "lucide-react";

interface SubDevice {
    name: string;
    status: "Secure" | "Monitoring" | "Warning";
}

interface MonitoringParam {
    label: string;
    value: string;
}

interface CategoryData {
    title: string;
    description: string;
    icon: any;
    color: string;
    subDevices: string[];
    monitoringParams: string[];
}

const categoryMap: Record<string, CategoryData> = {
    storage: {
        title: "Removable & Storage Devices",
        description: "Primary data-exfiltration vectors. Monitoring all mass-storage interfaces.",
        icon: HardDrive,
        color: "rose",
        subDevices: ["USB Flash Drives", "External HDD/SSD", "USB CD/DVD", "SD Card Readers", "Thunderbolt Storage", "NVMe Enclosures", "Smartphones (MTP)", "Mass Storage Adapters"],
        monitoringParams: ["Device VID/PID", "Serial Number", "Mount Events", "Read/Write Volume", "File Hash Activity", "Copy Spikes"]
    },
    hid: {
        title: "Human Interface Devices (HID)",
        description: "Protection against BadUSB and keyboard injection attacks.",
        icon: Keyboard,
        color: "amber",
        subDevices: ["Keyboards", "Mice", "Gaming Controllers", "Barcode Scanners", "Smart Card Readers", "KVM Switches", "Rubber Ducky Devices"],
        monitoringParams: ["HID Class Changes", "Composite Devices", "Unexpected Injection Patterns", "Rapid Keystroke Anomalies"]
    },
    audio: {
        title: "Audio Devices",
        description: "Eavesdropping prevention and audio stream integrity monitoring.",
        icon: Mic,
        color: "indigo",
        subDevices: ["Microphones", "Line-in Devices", "Headsets", "USB Sound Cards", "HDMI Audio Channels"],
        monitoringParams: ["Activation Events", "Audio Stream Start/Stop", "Device Enumeration", "Audio Driver Loads"]
    },
    video: {
        title: "Video & Imaging Devices",
        description: "Surveillance detection and visual data transfer monitoring.",
        icon: Camera,
        color: "blue",
        subDevices: ["Webcams", "HDMI Capture Cards", "USB Capture Devices", "Screen Grabbers", "Virtual Cameras", "Display Adapters", "Projectors", "Video Walls"],
        monitoringParams: ["Camera Activation", "Frame Capture Access", "Display Config Changes", "EDID Detection", "GPU Driver Re-init"]
    },
    network: {
        title: "Network-Related Peripherals",
        description: "Air-gap integrity and unauthorized interface detection.",
        icon: Network,
        color: "emerald",
        subDevices: ["Ethernet Adapters", "USB Wi-Fi Dongles", "Bluetooth Adapters", "NFC Readers", "LTE/5G Modems", "Zigbee Adapters", "Serial Bridges"],
        monitoringParams: ["Interface Creation", "MAC Address Changes", "Link State Changes", "RF Driver Loads", "Hidden AP Scans"]
    },
    wireless: {
        title: "Wireless & Covert Channels",
        description: "Monitoring RF emissions and short-range wireless protocols.",
        icon: Wifi,
        color: "violet",
        subDevices: ["Bluetooth Activity", "RF Emissions", "USB RF Sticks", "IR Devices", "Smartwatches", "Smart Glasses"],
        monitoringParams: ["Radio Stack Activation", "Power State Transitions", "Unknown RF Hardware IDs"]
    },
    power: {
        title: "Power & Hardware Layer",
        description: "Monitoring power delivery and system bus topology.",
        icon: Zap,
        color: "yellow",
        subDevices: ["UPS Interfaces", "Smart PD Controllers", "Thunderbolt Docks", "USB Hubs", "PCIe Hot-plug", "External GPUs"],
        monitoringParams: ["Thunderbolt Chain Changes", "Hub Topology Shifts", "Power Draw Anomalies", "PCI Bus Re-enumeration"]
    },
    printing: {
        title: "Printing & Scanning",
        description: "Prevention of data leakage via hardcopy and scanning.",
        icon: Printer,
        color: "orange",
        subDevices: ["USB Printers", "Network Printers", "Scanners", "Multi-function Devices"],
        monitoringParams: ["Print Spool Events", "Scan Initiation", "Printer VID/PID", "Large Outbound Spool Files"]
    },
    firmware: {
        title: "BIOS / Firmware-Level",
        description: "High-assurance monitoring of low-level system integrity.",
        icon: ShieldCheck,
        color: "cyan",
        subDevices: ["UEFI Updates", "Secure Boot State", "TPM State", "Firmware Hash Changes", "Option ROM Loading"],
        monitoringParams: ["State Persistence", "Verification Failures", "Unauthorized Updates"]
    },
    virtual: {
        title: "Virtual & Logical Devices",
        description: "Monitoring software-defined hardware and kernel-level abstractions.",
        icon: Box,
        color: "fuchsia",
        subDevices: ["Virtual Network Adapters", "Virtual Audio Devices", "Virtual USB Controllers", "Hypervisor Devices", "Loopback Mounts", "RAM Disks"],
        monitoringParams: ["Device Class Creation", "Driver Injection", "Kernel Module Loads"]
    }
};

export default function MonitoringModule({ category }: { category: string }) {
    const data = categoryMap[category] || categoryMap.storage;
    const Icon = data.icon;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="relative min-h-screen">
            {/* Decorative background elements */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-${data.color}-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none`} />
            <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] bg-${data.color}-500/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none`} />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="p-8 max-w-7xl mx-auto relative z-10"
            >
                {/* Header */}
                <motion.header variants={itemVariants} className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`bg-${data.color}-600 w-2 h-6 rounded-full`} />
                            <h4 className={`text-xs font-bold uppercase tracking-[0.2em] text-${data.color}-600`}>Security Node</h4>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{data.title}</h2>
                        <p className="text-slate-500 font-medium">{data.description}</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search resources..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </motion.header>

                {/* Top Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 bg-${data.color}-50 text-${data.color}-600 rounded-lg flex items-center justify-center`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Device Classes</span>
                        </div>
                        <span className="text-4xl font-black text-slate-800">{data.subDevices.length}</span>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Parameters</span>
                        </div>
                        <span className="text-4xl font-black text-slate-800">{data.monitoringParams.length}</span>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xl font-black text-emerald-600 uppercase">Secure</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Last Scan</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800">2m ago</span>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sub-Devices Analysis */}
                    <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <Box className="w-4 h-4 text-slate-600" />
                                Monitored Device Classes
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-2">
                                {data.subDevices.map((device, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <span className="text-sm font-semibold text-slate-700">{device}</span>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md">IDLE</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Active Monitoring Parameters */}
                    <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <Activity className="w-4 h-4 text-slate-600" />
                                Security Watchpoints
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-3">
                                {data.monitoringParams.map((param, idx) => (
                                    <div key={idx} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{param}</span>
                                            <div className="flex gap-1">
                                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="h-full bg-blue-500/40"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
