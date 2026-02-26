import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Network,
  Mic,
  Usb,
  Monitor,
  HardDrive,
  RefreshCw,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

type Mode = "overview" | "details";

type VirtualLogicalDevice = {
  id: number;
  device_class: string;
  device_type: string;
  vendor_id: string;
  product_id: string;
  device_name: string;
  device_id: string;
  is_present: boolean;
  last_seen: string;
  status: string;
  security_flags: string;
  raw_json: string;
};

type VirtualLogicalEvent = {
  id: number;
  device_type: string;
  event_type: string;
  timestamp: string;
  details: string;
};

const CLASS_ICON: Record<string, any> = {
  network: Network,
  audio: Mic,
  usb: Usb,
  hypervisor: Monitor,
  mount: HardDrive,
  storage: HardDrive,
};

function safeParseFlags(flags: string): string[] {
  try {
    const parsed = JSON.parse(flags);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function badgeForStatus(status: string) {
  const s = (status || "UNKNOWN").toUpperCase();
  if (s.includes("UP") || s.includes("OK") || s.includes("ACTIVE") || s.includes("ATTACHED")) {
    return {
      icon: CheckCircle,
      className: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
      label: s,
    };
  }
  if (s.includes("DOWN") || s.includes("ERROR") || s.includes("FAILED") || s.includes("DISABLED")) {
    return {
      icon: XCircle,
      className: "bg-rose-500/10 text-rose-700 border border-rose-500/20",
      label: s,
    };
  }
  return {
    icon: AlertTriangle,
    className: "bg-slate-500/10 text-slate-700 border border-slate-500/20",
    label: s,
  };
}

export default function VirtualLogicalMonitoring({ mode }: { mode: Mode }) {
  const [devices, setDevices] = useState<VirtualLogicalDevice[]>([]);
  const [events, setEvents] = useState<VirtualLogicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const saveVirtualOverview = async () => {
        try {
            const overview = {
                timestamp: new Date().toISOString(),
                summary: {
                    total_devices: devices.length,
                    present_devices: devices.filter(d => d.is_present).length,
                    total_events: events.length,
                    device_classes: [...new Set(devices.map(d => d.device_class))],
                    device_types: [...new Set(devices.map(d => d.device_type))],
                    hypervisor_devices: devices.filter(d => d.device_class === 'hypervisor').length,
                    network_devices: devices.filter(d => d.device_class === 'network').length
                },
                devices: devices.map(device => ({
                    id: device.id,
                    device_class: device.device_class,
                    device_type: device.device_type,
                    vendor_id: device.vendor_id,
                    product_id: device.product_id,
                    device_name: device.device_name,
                    device_id: device.device_id,
                    is_present: device.is_present,
                    last_seen: device.last_seen,
                    status: device.status,
                    security_flags: safeParseFlags(device.security_flags),
                    raw_json: device.raw_json
                })),
                events: events.map(event => ({
                    id: event.id,
                    device_type: event.device_type,
                    event_type: event.event_type,
                    timestamp: event.timestamp,
                    details: event.details
                }))
            };

            // Save to JSON file via API
            const response = await fetch('http://localhost:3005/api/save-virtual-overview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(overview)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Virtual overview saved:', result.filename);
            } else {
                console.error('Failed to save virtual overview');
            }
        } catch (error) {
            console.error('Error saving virtual overview:', error);
        }
    };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [devicesRes, eventsRes] = await Promise.all([
        fetch("http://localhost:3005/api/virtual/devices"),
        fetch("http://localhost:3005/api/virtual/events"),
      ]);

      const devicesData = devicesRes.ok ? ((await devicesRes.json()) as VirtualLogicalDevice[]) : [];
      const eventsData = eventsRes.ok ? ((await eventsRes.json()) as VirtualLogicalEvent[]) : [];

      setDevices(devicesData);
      setEvents(eventsData);
    } catch (e) {
      console.error("Failed to fetch virtual/logical data:", e);
      setDevices([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAll();
      await saveVirtualOverview();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      const flags = safeParseFlags(d.security_flags).join(" ");
      return (
        d.device_type.toLowerCase().includes(q) ||
        d.device_class.toLowerCase().includes(q) ||
        d.device_name.toLowerCase().includes(q) ||
        d.device_id.toLowerCase().includes(q) ||
        flags.toLowerCase().includes(q)
      );
    });
  }, [devices, query]);

  const grouped = useMemo(() => {
    const by: Record<string, VirtualLogicalDevice[]> = {};
    for (const d of filteredDevices) {
      const key = d.device_class || "unknown";
      if (!by[key]) by[key] = [];
      by[key].push(d);
    }
    return by;
  }, [filteredDevices]);

  const counts = useMemo(() => {
    const total = devices.length;
    const virtualNic = devices.filter((d) => d.device_type === "Virtual Network Adapter").length;
    const virtualAudio = devices.filter((d) => d.device_type === "Virtual Audio Device").length;
    const virtualUsb = devices.filter((d) => d.device_type === "Virtual USB Controller").length;
    const hypervisor = devices.filter((d) => d.device_type === "Hypervisor Device").length;
    const loopback = devices.filter((d) => d.device_type === "Loopback Mount").length;
    const ramdisks = devices.filter((d) => d.device_type === "RAM Disk").length;
    const flagged = devices.filter((d) => safeParseFlags(d.security_flags).length > 0).length;

    return { total, virtualNic, virtualAudio, virtualUsb, hypervisor, loopback, ramdisks, flagged };
  }, [devices]);

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end mb-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-fuchsia-600 w-2 h-6 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-600">Virtual & Logical</h4>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Box className="w-7 h-7 text-fuchsia-600" />
            Virtual & Logical Devices
          </h2>
          <p className="text-slate-500 font-medium">
            Monitoring virtual adapters, software-defined devices, hypervisor artifacts, loopback mounts, and RAM disks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            <input
              type="text"
              placeholder="Search devices, classes, flags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all w-72 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
          <button
            onClick={saveVirtualOverview}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            Save Overview
          </button>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        </div>
      </motion.header>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading virtual & logical devices...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-fuchsia-50 text-fuchsia-700 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total</span>
              </div>
              <span className="text-4xl font-black text-slate-800">{counts.total}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Virtual NICs</span>
              </div>
              <span className="text-4xl font-black text-slate-800">{counts.virtualNic}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Virtual Audio</span>
              </div>
              <span className="text-4xl font-black text-slate-800">{counts.virtualAudio}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Flagged</span>
              </div>
              <span className="text-4xl font-black text-slate-800">{counts.flagged}</span>
            </div>
          </div>

          {mode === "overview" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <Box className="w-4 h-4 text-slate-600" />
                    Device Classes
                  </h3>
                </div>

                <div className="p-6 space-y-3">
                  {Object.keys(grouped).length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">No virtual/logical devices found.</div>
                  ) : (
                    Object.entries(grouped).map(([cls, list]) => {
                      const Icon = CLASS_ICON[cls] || Box;
                      return (
                        <div
                          key={cls}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-800 uppercase tracking-wide">{cls}</div>
                                <div className="text-xs text-slate-500">{list.length} items</div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">
                              Hypervisor: {counts.hypervisor} | Loopback: {counts.loopback} | RAM: {counts.ramdisks}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {list.slice(0, 4).map((d) => {
                              const flags = safeParseFlags(d.security_flags);
                              return (
                                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-800 truncate">{d.device_name}</div>
                                    <div className="text-xs text-slate-500 font-mono truncate">{d.device_id}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {flags.length > 0 && (
                                      <span className="px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                        {flags[0]}
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${badgeForStatus(d.status).className}`}>
                                      {badgeForStatus(d.status).label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    Recent Activity
                  </h3>
                </div>

                <div className="p-6">
                  {events.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">No events recorded yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {events.slice(0, 12).map((e) => (
                        <div key={e.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-mono text-slate-600">{e.timestamp}</div>
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-slate-500/10 text-slate-700 border border-slate-500/20">
                              {e.event_type}
                            </span>
                          </div>
                          <div className="mt-2 text-sm font-bold text-slate-800">{e.device_type}</div>
                          <div className="mt-1 text-xs text-slate-500">{e.details}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 tracking-tight">Virtual & Logical Devices Details</h3>
                  <p className="text-xs text-slate-400 font-medium italic">Evidence-grade inventory and flags</p>
                </div>

                <div className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                          <th className="text-left py-3 pr-4">Class</th>
                          <th className="text-left py-3 pr-4">Type</th>
                          <th className="text-left py-3 pr-4">Name</th>
                          <th className="text-left py-3 pr-4">Status</th>
                          <th className="text-left py-3 pr-4">Flags</th>
                          <th className="text-left py-3">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDevices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                              No devices to show.
                            </td>
                          </tr>
                        ) : (
                          filteredDevices.slice(0, 250).map((d) => {
                            const flags = safeParseFlags(d.security_flags);
                            const badge = badgeForStatus(d.status);
                            const Icon = CLASS_ICON[d.device_class] || Box;
                            return (
                              <tr key={d.id} className="hover:bg-slate-50/60">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-mono text-slate-700">{d.device_class}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{d.device_type}</td>
                                <td className="py-3 pr-4">
                                  <div className="text-sm font-semibold text-slate-800">{d.device_name}</div>
                                  <div className="text-xs font-mono text-slate-500 break-all">{d.device_id}</div>
                                </td>
                                <td className="py-3 pr-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${badge.className}`}>
                                    <badge.icon className="w-3.5 h-3.5 inline-block -mt-0.5 mr-1" />
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-3 pr-4">
                                  {flags.length === 0 ? (
                                    <span className="text-xs text-slate-400 italic">none</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {flags.slice(0, 4).map((f, idx) => (
                                        <span
                                          key={`${d.id}-${idx}`}
                                          className="px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-700 border border-amber-500/20"
                                        >
                                          {f}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 text-xs font-mono text-slate-600">{d.last_seen}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 tracking-tight">Virtual & Logical Events</h3>
                  <p className="text-xs text-slate-400 font-medium italic">Event stream emitted by agent (if enabled)</p>
                </div>

                <div className="p-8">
                  {events.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">No events recorded yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                            <th className="text-left py-3 pr-4">Timestamp</th>
                            <th className="text-left py-3 pr-4">Type</th>
                            <th className="text-left py-3 pr-4">Event</th>
                            <th className="text-left py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {events.slice(0, 100).map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/60">
                              <td className="py-3 pr-4 text-xs font-mono text-slate-700">{e.timestamp}</td>
                              <td className="py-3 pr-4 text-sm font-bold text-slate-800">{e.device_type}</td>
                              <td className="py-3 pr-4">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-slate-500/10 text-slate-700 border border-slate-500/20">
                                  {e.event_type}
                                </span>
                              </td>
                              <td className="py-3 text-xs text-slate-500">{e.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
