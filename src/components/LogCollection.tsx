import { useState } from 'react';
import { Shield, Database, Activity, AlertTriangle, CheckCircle, Play, Download, Settings, Server, Clock, Calendar } from 'lucide-react';

interface LogCollectionResponse {
  status: string;
  message: string;
  output?: string;
  timestamp: string;
}

interface CollectionStats {
  total_events: number;
  critical_events: number;
  error_events: number;
  warning_events: number;
  total_devices?: number;
  security_events?: number;
  admin_privileges?: boolean;
  security_collection_success?: boolean;
}

export default function LogCollection() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState('');
  const [lastCollection, setLastCollection] = useState<Date | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHours, setSelectedHours] = useState<number>(24);

  const collectLogs = async (hours: number = 24) => {
    setIsCollecting(true);
    setCollectionStatus('Initializing log collection...');
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/trigger-log-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger log collection');
      }
      
      const data = await response.json();
      setStats(data.statistics);
      
      // Show admin privilege status
      if (data.statistics?.admin_privileges) {
        setCollectionStatus('✅ Full admin access - Security events collected');
      } else {
        setCollectionStatus('⚠️ Limited access - Run API server as admin for security events');
      }
      
      setTimeout(() => setCollectionStatus(''), 5000);
    } catch (err) {
      console.error('Failed to collect logs:', err);
      setError('Failed to collect logs. Please ensure the API server and log collector are running.');
      setCollectionStatus('');
      setIsCollecting(false);
    }
  };

  const downloadLatestLogs = async () => {
    // First collect logs if we don't have recent data
    if (!stats) {
      await collectLogs();
      // Wait for collection to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Create a simple download with the current data
    const logData = {
      timestamp: new Date().toISOString(),
      collection_hours: selectedHours,
      statistics: stats,
      events: [], // Would be populated from actual log collection
      metadata: {
        hostname: "Citadel Dashboard",
        version: "1.0.0",
        collector_type: "dashboard"
      }
    };
    
    const dataStr = JSON.stringify(logData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `citadel_logs_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const timeOptions = [
    { value: 1, label: '1 Hour', icon: Clock },
    { value: 6, label: '6 Hours', icon: Clock },
    { value: 12, label: '12 Hours', icon: Calendar },
    { value: 24, label: '24 Hours', icon: Calendar },
    { value: 48, label: '48 Hours', icon: Calendar },
    { value: 168, label: '7 Days', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Log Collection</h2>
          <p className="text-slate-400">Automated system event collection and analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => collectLogs(selectedHours)}
            disabled={isCollecting}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isCollecting ? 'animate-pulse' : ''}`} />
            {isCollecting ? 'Collecting...' : 'Collect Logs'}
          </button>
          <button
            onClick={downloadLatestLogs}
            disabled={isCollecting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Collection Status */}
      {collectionStatus && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal-400">
            <Activity className={`w-4 h-4 ${isCollecting ? 'animate-spin' : ''}`} />
            <span>{collectionStatus}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Server className="w-4 h-4" />
              <span className="text-sm font-medium">Total Events</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_events}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.critical_events}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.error_events}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Warning</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.warning_events}</div>
          </div>
        </div>
      )}

      {/* Time Range Selection */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Collection Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Range
            </label>
            <div className="grid grid-cols-3 gap-3">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedHours(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    selectedHours === option.value
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:bg-slate-700'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Settings className="w-4 h-4" />
            <span>Current selection: {selectedHours} hours</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Last Collection Info */}
      {lastCollection && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-sm font-medium text-white">Last Collection</div>
              <div className="text-xs text-slate-500">{new Date(lastCollection).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">1.</span>
            <span>Select a time range for log collection (1 hour to 7 days)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">2.</span>
            <span>Click "Collect Logs" to gather system events from Windows Event Log</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">3.</span>
            <span>View statistics and download the collected logs as JSON</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">4.</span>
            <span>Logs are automatically categorized by severity level</span>
          </div>
        </div>
      </div>
    </div>
  );
}
