import { useState } from "react";
import Machine from "./Machine";
import Sidebar from "./components/Sidebar";
import UsbMonitoring from "./components/UsbMonitoring";
import MonitoringModule from "./components/MonitoringModule";
import StorageMonitoring from "./components/StorageMonitoring";
import HIDMonitoring from "./components/HIDMonitoring";
import NetworkMonitoring from "./components/NetworkMonitoring";
import AudioMonitoring from "./components/AudioMonitoring";
import VideoMonitoring from "./components/VideoMonitoring";
import WirelessMonitoring from "./components/WirelessMonitoring";
import PowerMonitoring from "./components/PowerMonitoring";
import PrintingMonitoring from "./components/PrintingMonitoring";
import SystemOversight from "./components/SystemOversight";
import FirmwareMonitoring from "./components/FirmwareMonitoring";
import VirtualLogicalMonitoring from "./components/VirtualLogicalMonitoring";
import AILogAnalysis from "./components/AILogAnalysis";
import AIReportHistory from "./components/AIReportHistory";
import Fleet from "./Fleet";
import GovernanceSettings from "./components/GovernanceSettings";
import Login from "./components/Login";
import AICoPilot from "./components/AICoPilot";
import EventLogs from "./components/EventLogs";
import LogCollection from "./components/LogCollection";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="full-viewport responsive-layout bg-[#f8fafc]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="auto-main custom-scrollbar">
        {activeTab === 'dashboard' && <Machine />}
        {activeTab === 'usb' && <UsbMonitoring />}
        {activeTab === 'storage' && <StorageMonitoring />}
        {activeTab === 'hid' && <HIDMonitoring />}
        {activeTab === 'network' && <NetworkMonitoring />}
        {activeTab === 'audio' && <AudioMonitoring />}
        {activeTab === 'video' && <VideoMonitoring />}
        {activeTab === 'wireless' && <WirelessMonitoring />}
        {activeTab === 'power' && <PowerMonitoring />}
        {activeTab === 'printing' && <PrintingMonitoring />}
        {activeTab === 'system-oversight' && <SystemOversight />}
        {activeTab === 'storage-detailed' && <MonitoringModule category="storage" />}
        {activeTab === 'hid-detailed' && <MonitoringModule category="hid" />}
        {activeTab === 'network-detailed' && <MonitoringModule category="network" />}
        {activeTab === 'audio-detailed' && <MonitoringModule category="audio" />}
        {activeTab === 'video-detailed' && <MonitoringModule category="video" />}
        {activeTab === 'wireless-detailed' && <MonitoringModule category="wireless" />}
        {activeTab === 'power-detailed' && <MonitoringModule category="power" />}
        {activeTab === 'printing-detailed' && <MonitoringModule category="printing" />}
        {activeTab === 'firmware-overview' && <FirmwareMonitoring mode="overview" />}
        {activeTab === 'firmware-details' && <FirmwareMonitoring mode="details" />}
        {activeTab === 'virtual-overview' && <VirtualLogicalMonitoring mode="overview" />}
        {activeTab === 'virtual-details' && <VirtualLogicalMonitoring mode="details" />}
        {activeTab === 'ai-analysis' && <AILogAnalysis />}
        {activeTab === 'ai-history' && <AIReportHistory />}
        {activeTab === 'logs' && <EventLogs />}
        {activeTab === 'log-collection' && <LogCollection />}
        {activeTab === 'fleet' && <Fleet />}
        {activeTab === 'settings' && <GovernanceSettings />}
      </main>

      <AICoPilot />
    </div>
  );
}

export default App;
