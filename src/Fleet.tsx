import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  ArrowUpRight,
  FileText,
  Monitor,
  Zap,
  Clock
} from "lucide-react";

interface Machine {
  id: string;
  last_seen: string;
  cpu_temp: number;
  status: string;
}

export default function Fleet() {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    fetch("http://localhost:3005/api/fleet")
      .then(res => res.json())
      .then(setMachines);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        {/* Header */}
        <motion.header variants={itemVariants} className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-600 w-2 h-6 rounded-full" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Infrastructure Node</h4>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Fleet Management</h2>
            <p className="text-slate-500 font-medium">Real-time oversight of all verified Citadel nodes</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Nodes</p>
              <p className="text-2xl font-black text-slate-800">{machines.length}</p>
            </div>
          </div>
        </motion.header>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {machines.map((m) => (
            <motion.div
              key={m.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 group transition-all hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                  <Monitor className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {m.status}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">{m.id}</h3>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-6">
                <Clock className="w-3 h-3" />
                Last ping: {m.last_seen}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temperature</p>
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${m.cpu_temp > 60 ? 'text-amber-500' : 'text-blue-500'}`} />
                    <span className="text-lg font-bold text-slate-800">{m.cpu_temp}°C</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance</p>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-lg font-bold text-slate-800">100%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`http://localhost:3005/api/reports/${m.id}.pdf`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Report
                </a>
                <button className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Add New Node Placeholder */}
          <motion.button
            variants={itemVariants}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Enroll New Node</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
