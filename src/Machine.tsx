import { useEffect, useState } from "react";
import AICoPilot from "./components/AICoPilot";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Cpu, HardDrive, Activity, ArrowUpRight, Shield, Zap, FileText, Eye, Download, Plus, LoaderCircle, X } from "lucide-react";

interface UsbEvent {
  timestamp: string;
  action: string;
  vid: string;
  pid: string;
}

interface EventLog {
  timestamp: string;
  message: string;
}

interface Machine {
  id: string;
  last_seen: string;
  cpu_temp: number;
  status: string;
}

interface ReportInfo {
  filename: string;
  created_at: string;
}

interface MachineProps {
  hideSidebar?: boolean;
}

export default function Machine({ hideSidebar }: MachineProps) {
  const [usbEvents, setUsbEvents] = useState<UsbEvent[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [usbRes, logsRes, fleetRes, reportsRes] = await Promise.all([
        fetch("http://localhost:3005/api/usb"),
        fetch("http://localhost:3005/api/eventlogs"),
        fetch("http://localhost:3005/api/fleet"),
        fetch("http://localhost:3005/api/reports")
      ]);

      const usb = await usbRes.json();
      const logs = await logsRes.json();
      const fleet = await fleetRes.json();
      const reportsList = await reportsRes.json();

      setUsbEvents(usb);
      setEventLogs(logs);
      setReports(reportsList);
      if (fleet && fleet.length > 0) setMachine(fleet[0]);
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
        console.log("⚡ Instant refresh triggered via SSE (Dashboard)");
        fetchData();
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error (Dashboard):", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const clearLogs = () => {
    fetch("http://localhost:3005/api/logs", { method: "DELETE" })
      .then(() => {
        setUsbEvents([]);
        setEventLogs([]);
      });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:3005/api/reports/generate", { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Generate report error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

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
              <span className="bg-blue-600 w-2 h-6 rounded-full" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Enterprise Security</h4>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Oversight</h2>
            <p className="text-slate-500 font-medium">Monitoring active nodes and verified endpoints</p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#fff1f2' }}
              whileTap={{ scale: 0.98 }}
              onClick={clearLogs}
              className="flex items-center gap-2 bg-white text-rose-600 border border-slate-200 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Clear Evidence
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all text-sm font-semibold flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Security Audit
              <ArrowUpRight className="w-4 h-4 opacity-50" />
            </motion.button>
          </div>
        </motion.header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* CPU Temp Card - Gradient variant */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Thermals</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-black text-slate-800 tabular-nums leading-none">
                  {machine ? machine.cpu_temp.toFixed(1) : "--"}
                  <span className="text-xl font-bold ml-1 text-slate-400">°C</span>
                </span>
              </div>
              <AnimatePresence mode="wait">
                {machine && machine.cpu_temp > 80 ? (
                  <motion.span
                    key="heat-warn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-100 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
                    CRITICAL HEAT
                  </motion.span>
                ) : (
                  <motion.span
                    key="heat-ok"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                    NOMINAL
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Machine Status Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Node Status</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">
                {machine?.status || "Off"}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-emerald-600 text-[10px] font-black tracking-widest uppercase">Encryption Active</span>
                <span className="text-slate-400 text-xs font-medium">Uptime: 14h 22m</span>
              </div>
            </div>
          </motion.div>

          {/* USB Devices Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Physical I/O</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-slate-800 leading-none tabular-nums">{usbEvents.length}</span>
              <div className="flex flex-col items-end">
                <span className="text-amber-600 text-[10px] font-black tracking-widest uppercase mb-1">Port Monitoring</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-3 h-1 rounded-full ${i <= (usbEvents.length % 5) ? 'bg-amber-400' : 'bg-slate-100'}`} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* USB Events Table */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="px-8 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 tracking-tight">Access Log</h3>
                <p className="text-xs text-slate-400 font-medium italic">Physical port connection history</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Realtime Feed</span>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                    <th className="px-8 py-4">Timeline</th>
                    <th className="px-8 py-4 text-center">Operation</th>
                    <th className="px-8 py-4">Identifier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usbEvents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center text-slate-400 text-sm font-medium italic">
                        No physical intrusion detected on current node.
                      </td>
                    </tr>
                  ) : (
                    usbEvents.slice(0, 8).map((e, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 tracking-tight tabular-nums">
                              {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase">
                              {new Date(e.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${e.action === "INSERTED"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                              {e.action === "INSERTED" ? <Zap className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                              {e.action}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600 font-mono tracking-tighter">VID: {e.vid}</span>
                            <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tighter">PID: {e.pid}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {usbEvents.length > 8 && (
              <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 text-center">
                <button className="text-[10px] font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                  View Full Investigation History
                </button>
              </div>
            )}
          </motion.div>

          {/* System Logs - Slim variant */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-5 border-b border-white/5 bg-slate-900 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                System Telemetry
              </h3>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <div className="w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar-dark max-h-[500px]">
              {eventLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-xs font-mono uppercase tracking-widest px-4">
                  Waiting for encrypted data stream...
                </div>
              ) : (
                eventLogs.map((e, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-1 text-[8px] font-black uppercase tracking-widest">
                      <span className="text-blue-400">{new Date(e.timestamp).toLocaleTimeString()}</span>
                      <span className="text-slate-500 group-hover:text-blue-300 transition-colors">Thread: 0x{((idx + 1) * 73).toString(16)}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono break-words">{e.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* PDF Reports Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Security Assessment Reports</h3>
              <p className="text-sm text-slate-500">Automated diagnostic and audit documentation</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateReport}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Scan & Generate Report
            </motion.button>
          </div>
          <div className="p-8">
            {reports.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No reports generated yet. Click above to start a security scan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -2 }}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate" title={report.filename}>
                          {report.filename}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          Generated: {report.created_at}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingReport(report.filename)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <a
                        href={`http://localhost:3005/api/reports/${report.filename}`}
                        download
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* AI Co-Pilot Component */}
      <AICoPilot />

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewingReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-800 tracking-tight">{viewingReport}</span>
                </div>
                <button
                  onClick={() => setViewingReport(null)}
                  className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-slate-100">
                <iframe
                  src={`http://localhost:3005/api/reports/${viewingReport}`}
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        @keyframes subtle-float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
