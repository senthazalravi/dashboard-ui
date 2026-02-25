import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    FileText,
    BrainCircuit,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    Play
} from "lucide-react";

interface AiConfig {
    ollama_url: string;
    model_name: string;
}

interface ReportInfo {
    filename: string;
    created_at: string;
}

export default function GovernanceSettings() {
    const [config, setConfig] = useState<AiConfig>({ ollama_url: "http://localhost:11434", model_name: "llama3" });
    const [status, setStatus] = useState<{ status: string; message: string }>({ status: "", message: "" });
    const [reports, setReports] = useState<ReportInfo[]>([]);
    const [analyzing, setAnalyzing] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    const fetchConfig = async () => {
        try {
            const res = await fetch("http://localhost:3005/api/ai/settings");
            const data = await res.json();
            setConfig(data);
        } catch (err) {
            console.error("Fetch config failed", err);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch("http://localhost:3005/api/ai/status");
            const data = await res.json();
            setStatus({ status: data.status || "unknown", message: data.message || "Status check failed" });
            if (data.available_models) {
                setAvailableModels(data.available_models);
            }
        } catch (err) {
            setStatus({ status: "offline", message: "Status check failed" });
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch("http://localhost:3005/api/reports");
            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error("Fetch reports failed", err);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchStatus();
        fetchReports();
    }, []);

    const saveConfig = async () => {
        try {
            await fetch("http://localhost:3005/api/ai/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            fetchStatus();
        } catch (err) {
            console.error("Save config failed", err);
        }
    };

    const runAnalysis = async (filename: string) => {
        setAnalyzing(filename);
        setAnalysisResult(null);
        try {
            const res = await fetch("http://localhost:3005/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename })
            });
            const data = await res.json();
            setAnalysisResult(data.analysis);
        } catch (err) {
            setAnalysisResult("AI Analysis failed. Ensure Ollama is running and the model is pulled.");
        } finally {
            setAnalyzing(null);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const modelOptions = availableModels.length > 0 ? availableModels : [
        "gemma3",
        "gpt-oss:20b",
        "llama3",
        "mistral",
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto relative z-10">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                {/* Header */}
                <motion.header variants={itemVariants} className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-600 w-2 h-6 rounded-full" />
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Cognitive Governance</h4>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">AI & Ethics Console</h2>
                        <p className="text-slate-500 font-medium">Configure and audit the local AI co-pilot behavior</p>
                    </div>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Config Panel */}
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 lg:col-span-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" />
                            Node Configuration
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 capitalize mb-1.5 tracking-widest uppercase">Ollama Base URL</label>
                                <input
                                    type="text"
                                    value={config.ollama_url}
                                    onChange={(e) => setConfig({ ...config, ollama_url: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 capitalize mb-1.5 tracking-widest uppercase">Active Model</label>
                                <select
                                    value={config.model_name}
                                    onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                >
                                    {modelOptions.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={`p-4 rounded-2xl flex items-center gap-3 border ${status.status === 'online' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                                }`}>
                                {status.status === 'online' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                )}
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${status.status === 'online' ? 'text-emerald-700' : 'text-rose-700'
                                        }`}>
                                        {status.status}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{status.message}</p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveConfig}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Apply AI Topology
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* AI Lab / Log Analysis */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/20 p-8 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <BrainCircuit className="w-32 h-32 text-blue-400" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3 relative z-10">
                                <BrainCircuit className="w-6 h-6 text-blue-400" />
                                Advanced AI Lab
                            </h3>
                            <p className="text-slate-400 text-sm mb-8 relative z-10">Select a verified security report for deep cognitive analysis.</p>

                            <div className="space-y-4 relative z-10">
                                {reports.map((report, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white tracking-tight">{report.filename}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{report.created_at}</p>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => runAnalysis(report.filename)}
                                            disabled={analyzing !== null}
                                            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                        >
                                            {analyzing === report.filename ? (
                                                <LoaderCircle className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Play className="w-5 h-5 fill-current" />
                                            )}
                                        </motion.button>
                                    </div>
                                ))}
                            </div>

                            <AnimatePresence>
                                {analysisResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="mt-8 p-6 bg-slate-800 border-l-4 border-blue-500 rounded-r-2xl"
                                    >
                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Autonomous Analysis Report</h4>
                                        <div className="text-slate-300 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                                            {analysisResult}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
