import {
  LayoutDashboard,
  Server,
  Usb,
  Settings,
  Keyboard,
  Mic,
  Camera,
  Network,
  Wifi,
  Zap,
  Printer,
  ShieldCheck,
  Box,
  HardDrive,
  Monitor,
  LogOut
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const NavItem = ({ id, icon: Icon, label, color = "blue", badge }: { id: string, icon: any, label: string, color?: string, badge?: string }) => {
    const isActive = activeTab === id;

    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all group ${isActive
            ? `bg-${color}-600/10 text-${color}-400 shadow-[inset_0_0_10px_rgba(37,99,235,0.05)]`
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? `text-${color}-400` : 'text-slate-500'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${badge === 'H' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'
            }`}>
            {badge === 'H' ? 'Critical' : badge}
          </span>
        )}
      </button>
    );
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-3 pt-6 pb-2">
      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</h5>
    </div>
  );

  return (
    <aside className="auto-sidebar bg-slate-900 text-slate-300 h-screen border-r border-slate-800 flex flex-col relative z-50">
      <div className="p-6 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Server className="w-5 h-5 text-white" />
          </div>
          Citadel SOC
        </h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-black">Hardware Safety Co-Pilot</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-8 custom-scrollbar-dark">
        <SectionHeader label="Core Operations" />
        <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" color="blue" />
        <NavItem id="system-oversight" icon={Monitor} label="System Oversight" color="blue" />
        <NavItem id="usb" icon={Usb} label="USB Lifecycle" color="indigo" />

        <SectionHeader label="High Risk Peripherals" />
        <NavItem id="storage" icon={HardDrive} label="Storage Overview" color="rose" />
        <NavItem id="storage-detailed" icon={HardDrive} label="Storage Details" color="rose" badge="H" />
        <NavItem id="hid" icon={Keyboard} label="HID Overview" color="amber" />
        <NavItem id="hid-detailed" icon={Keyboard} label="HID Details" color="amber" badge="H" />
        <NavItem id="network" icon={Network} label="Network Overview" color="emerald" />
        <NavItem id="network-detailed" icon={Network} label="Network Details" color="emerald" badge="H" />
        <NavItem id="audio" icon={Mic} label="Audio Overview" color="indigo" />
        <NavItem id="audio-detailed" icon={Mic} label="Audio Details" color="indigo" badge="H" />

        <SectionHeader label="Media & Communication" />
        <NavItem id="video" icon={Camera} label="Video Overview" color="blue" />
        <NavItem id="video-detailed" icon={Camera} label="Video Details" color="blue" badge="H" />
        <NavItem id="wireless" icon={Wifi} label="Wireless Overview" color="violet" />
        <NavItem id="wireless-detailed" icon={Wifi} label="Wireless Details" color="violet" badge="H" />

        <SectionHeader label="Infrastructure & Virtual" />
        <NavItem id="power" icon={Zap} label="Power & Topology Overview" color="yellow" />
        <NavItem id="power-detailed" icon={Zap} label="Power & Topology Details" color="yellow" badge="H" />
        <NavItem id="printing" icon={Printer} label="Printing & Scanning Overview" color="orange" />
        <NavItem id="printing-detailed" icon={Printer} label="Printing & Scanning Details" color="orange" badge="H" />
        <NavItem id="firmware" icon={ShieldCheck} label="BIOS & Firmware" color="cyan" />
        <NavItem id="virtual" icon={Box} label="Virtual Interfaces" color="fuchsia" />

        <SectionHeader label="System Configuration" />
        <NavItem id="fleet" icon={Server} label="Fleet Management" color="slate" badge="Soon" />
        <NavItem id="settings" icon={Settings} label="Governance Settings" color="slate" />
      </div>

      <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3 group cursor-pointer mb-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 group-hover:ring-blue-500/50 transition-all">
              AD
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="text-sm">
            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">admin</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">System Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-red-600/10 border border-slate-700 hover:border-red-600/30 rounded-xl transition-all group"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
