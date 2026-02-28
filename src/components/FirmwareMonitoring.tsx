import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  RefreshCw,
  Lock,
  Cpu,
  Fingerprint,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

type TriState = "ENABLED" | "DISABLED" | "UNKNOWN";

type Health = "NOMINAL" | "WARNING" | "CRITICAL" | "UNKNOWN";

interface UefiUpdateEvent {
  timestamp: string;
  version: string;
  status: "APPLIED" | "PENDING" | "FAILED";
  source?: string;
  details?: string;
}

interface FirmwareHashMeasurement {
  timestamp: string;
  component: string;
  hash: string;
  baseline_hash?: string;
  status: "MATCH" | "CHANGED" | "UNKNOWN";
  notes?: string;
}

interface OptionRomEvent {
  timestamp: string;
  device: string;
  vendor?: string;
  action: "LOADED" | "BLOCKED" | "UNKNOWN";
  notes?: string;
}

interface FirmwareStatusPayload {
  node_id?: string;
  last_check?: string;
  overall_health?: Health;
  uefi_updates?: {
    last_applied?: string;
    current_version?: string;
    pending?: boolean;
    events?: UefiUpdateEvent[];
  };
  secure_boot?: {
    state?: TriState;
    policy?: "ENFORCED" | "PERMISSIVE" | "UNKNOWN";
    notes?: string;
  };
  tpm?: {
    present?: boolean;
    enabled?: TriState;
    activated?: TriState;
    version?: string;
    notes?: string;
  };
  firmware_hash?: {
    baseline_id?: string;
    status?: "MATCH" | "CHANGED" | "UNKNOWN";
    last_change?: string;
    measurements?: FirmwareHashMeasurement[];
  };
  option_rom?: {
    policy?: "ALLOWLIST" | "BLOCK" | "MONITOR" | "UNKNOWN";
    status?: Health;
    events?: OptionRomEvent[];
  };
}

const mockPayload: FirmwareStatusPayload = {
  node_id: "TEST_NODE_01",
  last_check: "2026-02-25 05:58:14",
  overall_health: "NOMINAL",
  uefi_updates: {
    last_applied: "2026-02-10 09:12:00",
    current_version: "UEFI-2.9.1",
    pending: false,
    events: [
      {
        timestamp: "2026-02-10 09:12:00",
        version: "UEFI-2.9.1",
        status: "APPLIED",
        source: "OEM",
        details: "Signed capsule update applied successfully",
      },
    ],
  },
  secure_boot: {
    state: "ENABLED",
    policy: "ENFORCED",
    notes: "Secure Boot keys verified. No DBX anomalies detected.",
  },
  tpm: {
    present: true,
    enabled: "ENABLED",
    activated: "ENABLED",
    version: "2.0",
    notes: "TPM attestation available. PCR values stable for audit window.",
  },
  firmware_hash: {
    baseline_id: "BASELINE-0001",
    status: "MATCH",
    last_change: "2026-01-18 12:03:00",
    measurements: [
      {
        timestamp: "2026-02-25 05:58:14",
        component: "BIOS Region",
        hash: "b1f8…c9a2",
        baseline_hash: "b1f8…c9a2",
        status: "MATCH",
        notes: "No drift detected",
      },
      {
        timestamp: "2026-02-25 05:58:14",
        component: "UEFI Boot Manager",
        hash: "91aa…114d",
        baseline_hash: "91aa…114d",
        status: "MATCH",
      },
    ],
  },
  option_rom: {
    policy: "MONITOR",
    status: "NOMINAL",
    events: [
      {
        timestamp: "2026-02-24 18:21:09",
        device: "PCIe NIC",
        vendor: "Intel",
        action: "LOADED",
        notes: "Signed Option ROM loaded",
      },
    ],
  },
};

function badgeForHealth(health: Health) {
  switch (health) {
    case "NOMINAL":
      return {
        icon: CheckCircle,
        className: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
        label: "Nominal",
      };
    case "WARNING":
      return {
        icon: AlertTriangle,
        className: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        label: "Warning",
      };
    case "CRITICAL":
      return {
        icon: XCircle,
        className: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
        label: "Critical",
      };
    default:
      return {
        icon: AlertTriangle,
        className: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
        label: "Unknown",
      };
  }
}

function badgeForTriState(value: TriState) {
  switch (value) {
    case "ENABLED":
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    case "DISABLED":
      return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 border border-slate-500/20";
  }
}

export default function FirmwareMonitoring({ mode = "overview" }: { mode?: "overview" | "details" }) {
  const [payload, setPayload] = useState<FirmwareStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFirmware = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3005/api/firmware/status");
      if (!res.ok) throw new Error("non-200");
      const data = (await res.json()) as FirmwareStatusPayload;
      setPayload(data);
    } catch {
      setPayload(mockPayload);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirmware();
  }, []);

  const saveFirmwareOverview = async () => {
        try {
            if (!payload) {
                console.error('No firmware data available to save');
                return;
            }

            const overview = {
                timestamp: new Date().toISOString(),
                node_id: payload.node_id,
                last_check: payload.last_check,
                overall_health: payload.overall_health,
                secure_boot: payload.secure_boot,
                tpm: payload.tpm,
                firmware_hash: payload.firmware_hash,
                option_rom: payload.option_rom,
                uefi_updates: payload.uefi_updates,
                firmware_hash_measurements: payload.firmware_hash?.measurements || [],
                uefi_update_events: payload.uefi_updates?.events || [],
                option_rom_events: payload.option_rom?.events || []
            };

            // Save to JSON file via API
            const response = await fetch('http://localhost:3005/api/save-firmware-overview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(overview)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Firmware overview saved:', result.filename);
            } else {
                console.error('Failed to save firmware overview');
            }
        } catch (error) {
            console.error('Error saving firmware overview:', error);
        }
    };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchFirmware();
    } finally {
      setRefreshing(false);
    }
  };

  const health: Health = payload?.overall_health || "UNKNOWN";
  const healthBadge = useMemo(() => badgeForHealth(health), [health]);

  const uefiEvents = payload?.uefi_updates?.events || [];
  const hashMeasurements = payload?.firmware_hash?.measurements || [];
  const optionRomEvents = payload?.option_rom?.events || [];

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end mb-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-cyan-600 w-2 h-6 rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">Platform Integrity</h4>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-cyan-600" />
            BIOS / Firmware-Level
          </h2>
          <p className="text-slate-500 font-medium">
            Monitoring UEFI updates, Secure Boot, TPM state, firmware hash integrity, and Option ROM loading
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-widest">Last Check</span>
            <span className="text-slate-600 font-mono">{payload?.last_check || "N/A"}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 font-bold uppercase tracking-widest">Node</span>
            <span className="text-slate-600 font-mono">{payload?.node_id || "unknown"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase ${healthBadge.className}`}>
            <healthBadge.icon className="w-4 h-4" />
            {healthBadge.label}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveFirmwareOverview}
              disabled={!payload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
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
          Loading firmware status...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-cyan-50 text-cyan-700 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Secure Boot</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-800">
                  {payload?.secure_boot?.state || "UNKNOWN"}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${badgeForTriState(payload?.secure_boot?.state || "UNKNOWN")}`}>
                  {payload?.secure_boot?.policy || "UNKNOWN"}
                </span>
              </div>
              {payload?.secure_boot?.notes && (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">{payload.secure_boot.notes}</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">TPM</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-slate-800">
                    {payload?.tpm?.present ? `Present (v${payload?.tpm?.version || "?"})` : "Not Present"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Enabled: {payload?.tpm?.enabled || "UNKNOWN"} • Activated: {payload?.tpm?.activated || "UNKNOWN"}
                  </div>
                </div>
              </div>
              {payload?.tpm?.notes && (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">{payload.tpm.notes}</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Firmware Hash</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-800">
                  {payload?.firmware_hash?.status || "UNKNOWN"}
                </span>
                <span className="text-xs text-slate-500 font-mono">{payload?.firmware_hash?.baseline_id || "N/A"}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">Last change: {payload?.firmware_hash?.last_change || "N/A"}</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Option ROM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-800">
                  {payload?.option_rom?.policy || "UNKNOWN"}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${badgeForHealth(payload?.option_rom?.status || "UNKNOWN").className}`}>
                  {payload?.option_rom?.status || "UNKNOWN"}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">Events: {optionRomEvents.length}</div>
            </div>
          </div>

          {mode === "overview" ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 tracking-tight text-lg">BIOS / Firmware-Level Overview</h3>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Continuous Oversight</span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">UEFI Updates</div>
                  <div className="mt-2 text-sm font-bold text-slate-800 truncate" title={payload?.uefi_updates?.current_version || "N/A"}>Current: {payload?.uefi_updates?.current_version || "N/A"}</div>
                  <div className="mt-1 text-xs text-slate-500 truncate" title={payload?.uefi_updates?.last_applied || "N/A"}>Last applied: {payload?.uefi_updates?.last_applied || "N/A"}</div>
                  <div className="mt-3 text-xs">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${payload?.uefi_updates?.pending ? "bg-amber-500/10 text-amber-700 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"}`}>
                      {payload?.uefi_updates?.pending ? "PENDING" : "NO PENDING"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Integrity Enforcement</div>
                  <div className="mt-2 text-sm font-bold text-slate-800 truncate" title={payload?.secure_boot?.state || "UNKNOWN"}>Secure Boot: {payload?.secure_boot?.state || "UNKNOWN"}</div>
                  <div className="mt-1 text-sm font-bold text-slate-800 truncate" title={payload?.tpm?.present ? "PRESENT" : "NOT PRESENT"}>TPM: {payload?.tpm?.present ? "PRESENT" : "NOT PRESENT"}</div>
                  <div className="mt-1 text-xs text-slate-500 truncate" title={payload?.firmware_hash?.status || "UNKNOWN"}>Firmware hash: {payload?.firmware_hash?.status || "UNKNOWN"}</div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Firmware Hash Measurements</div>
                  <div className="mt-2 text-sm font-bold text-slate-800">Measurements captured: {hashMeasurements.length}</div>
                  <div className="mt-1 text-xs text-slate-500 truncate" title={payload?.firmware_hash?.baseline_id || "N/A"}>Baseline: {payload?.firmware_hash?.baseline_id || "N/A"}</div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Option ROM Loading</div>
                  <div className="mt-2 text-sm font-bold text-slate-800 truncate" title={payload?.option_rom?.policy || "UNKNOWN"}>Policy: {payload?.option_rom?.policy || "UNKNOWN"}</div>
                  <div className="mt-1 text-xs text-slate-500">Observed events: {optionRomEvents.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 tracking-tight">BIOS / Firmware-Level Details</h3>
                  <p className="text-xs text-slate-400 font-medium italic">Evidence-grade event and measurement detail</p>
                </div>
                <div className="p-8 space-y-10">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 mb-3">UEFI Update Timeline</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                            <th className="text-left py-3 pr-4">Timestamp</th>
                            <th className="text-left py-3 pr-4">Version</th>
                            <th className="text-left py-3 pr-4">Status</th>
                            <th className="text-left py-3 pr-4">Source</th>
                            <th className="text-left py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {uefiEvents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-sm italic">
                                No UEFI update events reported.
                              </td>
                            </tr>
                          ) : (
                            uefiEvents.slice(0, 25).map((e, idx) => (
                              <tr key={`${e.timestamp}-${idx}`} className="hover:bg-slate-50/60">
                                <td className="py-3 pr-4 text-sm font-mono text-slate-700">{e.timestamp}</td>
                                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{e.version}</td>
                                <td className="py-3 pr-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                                      e.status === "APPLIED"
                                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                        : e.status === "PENDING"
                                          ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                                          : "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                    }`}
                                  >
                                    {e.status}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-xs text-slate-500">{e.source || ""}</td>
                                <td className="py-3 text-xs text-slate-500">{e.details || ""}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-800 mb-3">Firmware Hash Measurements</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                            <th className="text-left py-3 pr-4">Timestamp</th>
                            <th className="text-left py-3 pr-4">Component</th>
                            <th className="text-left py-3 pr-4">Status</th>
                            <th className="text-left py-3 pr-4">Hash</th>
                            <th className="text-left py-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hashMeasurements.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-sm italic">
                                No measurements recorded.
                              </td>
                            </tr>
                          ) : (
                            hashMeasurements.slice(0, 50).map((m, idx) => (
                              <tr key={`${m.timestamp}-${idx}`} className="hover:bg-slate-50/60">
                                <td className="py-3 pr-4 text-xs font-mono text-slate-700">{m.timestamp}</td>
                                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{m.component}</td>
                                <td className="py-3 pr-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                                      m.status === "MATCH"
                                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                        : m.status === "CHANGED"
                                          ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                          : "bg-slate-500/10 text-slate-700 border border-slate-500/20"
                                    }`}
                                  >
                                    {m.status}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-xs font-mono text-slate-600">{m.hash}</td>
                                <td className="py-3 text-xs text-slate-500">{m.notes || ""}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-800 mb-3">Option ROM Loading Events</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
                            <th className="text-left py-3 pr-4">Timestamp</th>
                            <th className="text-left py-3 pr-4">Device</th>
                            <th className="text-left py-3 pr-4">Vendor</th>
                            <th className="text-left py-3 pr-4">Action</th>
                            <th className="text-left py-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {optionRomEvents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-sm italic">
                                No Option ROM events recorded.
                              </td>
                            </tr>
                          ) : (
                            optionRomEvents.slice(0, 50).map((e, idx) => (
                              <tr key={`${e.timestamp}-${idx}`} className="hover:bg-slate-50/60">
                                <td className="py-3 pr-4 text-xs font-mono text-slate-700">{e.timestamp}</td>
                                <td className="py-3 pr-4 text-sm font-bold text-slate-800">{e.device}</td>
                                <td className="py-3 pr-4 text-xs text-slate-500">{e.vendor || ""}</td>
                                <td className="py-3 pr-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                                      e.action === "LOADED"
                                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                        : e.action === "BLOCKED"
                                          ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                          : "bg-slate-500/10 text-slate-700 border border-slate-500/20"
                                    }`}
                                  >
                                    {e.action}
                                  </span>
                                </td>
                                <td className="py-3 text-xs text-slate-500">{e.notes || ""}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
