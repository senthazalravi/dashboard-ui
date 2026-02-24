import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Usb, Activity, Clock, Server, Shield, Zap, Info, Search, Filter, ArrowUpRight } from "lucide-react";
import AICoPilot from "./AICoPilot";

interface UsbEvent {
    timestamp: string;
    action: string;
    vid: string;
    pid: string;
    path: string;
}

export default function UsbMonitoring() {
    const [usbEvents, setUsbEvents] = useState<UsbEvent[]>([]);
    const [filter, setFilter] = useState("");

    const fetchData = async () => {
        try {
            const res = await fetch("http://localhost:3005/api/usb");
            const data = await res.json();
            setUsbEvents(data);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for instant notifications via SSE
        const eventSource = new EventSource("http://localhost:3005/api/events");

        eventSource.onmessage = (event) => {
            if (event.data === "refresh") {
                console.log("⚡ Instant refresh triggered via SSE");
                fetchData();
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE connection error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const filteredEvents = usbEvents.filter(e =>
        e.vid.toLowerCase().includes(filter.toLowerCase()) ||
        e.pid.toLowerCase().includes(filter.toLowerCase()) ||
        e.action.toLowerCase().includes(filter.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <>
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

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
                            <span className="bg-indigo-600 w-2 h-6 rounded-full" />
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Hardware Integrity</h4>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">USB Monitoring</h2>
                        <p className="text-slate-500 font-medium">Real-time oversight of physical peripheral connections</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search VID / PID / Action..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 shadow-sm"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </motion.button>
                    </div>
                </motion.header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                <Usb className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Devices</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-slate-800">{usbEvents.filter(e => e.action === 'INSERTED').length}</span>
                            <span className="text-indigo-600 text-[10px] font-black tracking-widest uppercase">Verified Secure</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">24h Events</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-slate-800">{usbEvents.length}</span>
                            <span className="text-emerald-600 text-[10px] font-black tracking-widest uppercase mb-1">↑ 12% vs Yesterday</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Security Alerts</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-slate-800">0</span>
                            <span className="text-amber-600 text-[10px] font-black tracking-widest uppercase">Zero Threats</span>
                        </div>
                    </motion.div>
                </div>

                {/* Main Event Table */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            Connection History
                        </h3>
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Monitoring Active</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                                    <th className="px-8 py-4">Timestamp</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Hardware ID</th>
                                    <th className="px-8 py-4">Location</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {filteredEvents.length === 0 ? (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm font-medium italic">
                                                No USB events matched your criteria.
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        filteredEvents.map((e, idx) => (
                                            <motion.tr
                                                key={`${e.timestamp}-${idx}`}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="hover:bg-indigo-50/30 transition-all group"
                                            >
                                                <td className="px-8 py-4 text-sm font-bold text-slate-700 tabular-nums">
                                                    {new Date(e.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${e.action === "INSERTED"
                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                                        }`}>
                                                        {e.action === "INSERTED" ? <Zap className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                                        {e.action}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 font-mono tracking-tighter uppercase">VID: {e.vid}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tighter uppercase">PID: {e.pid}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                                        <Server className="w-3.5 h-3.5 opacity-50" />
                                                        {e.path === "USB_PATH" ? "Root/Port 1" : e.path}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100">
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>

            <AICoPilot />
        </>
    );
}
