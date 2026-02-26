import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

interface EventRecord {
  computer_name: string;
  data: any;
  event_id: number;
  level: number;
  message: string;
  provider: string;
  timestamp: string;
  user_sid: string | null;
}

interface LogCollectionResponse {
  status: string;
  message: string;
  output?: string;
  timestamp: string;
}

export default function EventLogs() {
  const [logs, setLogs] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectionStatus, setCollectionStatus] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'12h' | '24h'>('24h');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to collect logs to ensure we have recent data
      const collectResponse = await fetch('http://localhost:3005/api/trigger-log-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours: timeRange === '12h' ? 12 : 24 }),
      });
      
      if (collectResponse.ok) {
        // Wait for collection to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to read the generated log file
        const logFileName = timeRange === '12h' ? 'citadel_events.json' : 'citadel_events.json';
        try {
          const response = await fetch(`http://localhost:3005/api/log-events`);
          if (response.ok) {
            const data = await response.json();
            setLogs(data.events || []);
          } else {
            // Fallback to sample data
            setLogs([
              {
                computer_name: "Test-Computer",
                data: null,
                event_id: 1,
                level: 1,
                message: "Sample critical system event",
                provider: "System",
                timestamp: new Date().toISOString(),
                user_sid: null
              },
              {
                computer_name: "Test-Computer", 
                data: null,
                event_id: 4624,
                level: 1,
                message: "Sample security event - successful logon",
                provider: "Security",
                timestamp: new Date().toISOString(),
                user_sid: null
              }
            ]);
          }
        } catch (err) {
          console.error('Failed to fetch logs:', err);
          // Set sample data as fallback
          setLogs([
            {
              computer_name: "Test-Computer",
              data: null,
              event_id: 1,
              level: 1,
              message: "Sample critical system event",
              provider: "System",
              timestamp: new Date().toISOString(),
              user_sid: null
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to collect/fetch logs:', err);
      setError('Failed to collect logs. Please ensure the API server is running.');
      // Set sample data as fallback
      setLogs([
        {
          computer_name: "Test-Computer",
          data: null,
          event_id: 1,
          level: 1,
          message: "Sample critical system event",
          provider: "System",
          timestamp: new Date().toISOString(),
          user_sid: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const collectLogs = async (hours?: number) => {
    setLoading(true);
    setCollectionStatus('Collecting logs...');
    setError(null);
    
    try {
      const hoursToCollect = hours || (timeRange === '12h' ? 12 : 24);
      const response = await fetch('http://localhost:3005/api/trigger-log-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours: hoursToCollect }),
      });
      
      if (response.ok) {
        const data: LogCollectionResponse = await response.json();
        setCollectionStatus(data.message);
        
        // Wait a moment for the log collector to finish
        setTimeout(() => {
          fetchLogs();
          setCollectionStatus('');
        }, 2000);
      } else {
        throw new Error('Failed to trigger log collection');
      }
    } catch (err) {
      console.error('Failed to collect logs:', err);
      setError('Failed to collect logs. Please ensure the log collector is available.');
      setCollectionStatus('');
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 2:
        return <Info className="w-4 h-4 text-orange-400" />;
      case 3:
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'text-red-400';
      case 2:
        return 'text-orange-400';
      case 3:
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 1:
        return 'Critical';
      case 2:
        return 'Error';
      case 3:
        return 'Warning';
      default:
        return 'Info';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const downloadLogs = () => {
    const dataStr = JSON.stringify({ logs }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `citadel_logs_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const criticalCount = logs.filter(log => log.level === 1).length;
  const errorCount = logs.filter(log => log.level === 2).length;
  const warningCount = logs.filter(log => log.level === 3).length;
  const infoCount = logs.filter(log => log.level === 4 || log.level === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Logs</h2>
          <p className="text-slate-400">System event monitoring and analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => collectLogs()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Collect Logs
          </button>
          <button
            onClick={downloadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Collection Status */}
      {collectionStatus && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal-400">
            <Activity className="w-4 h-4" />
            {collectionStatus}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Critical</span>
          </div>
          <div className="text-2xl font-bold text-white">{criticalCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <div className="text-2xl font-bold text-white">{errorCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Warning</span>
          </div>
          <div className="text-2xl font-bold text-white">{warningCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Info</span>
          </div>
          <div className="text-2xl font-bold text-white">{infoCount}</div>
        </div>
      </div>

      {/* Time Range Selection */}
      <div className="flex items-center gap-4">
        <span className="text-slate-400">Time Range:</span>
        <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-1">
          <button
            onClick={() => { setTimeRange('12h'); collectLogs(12); }}
            className={`px-3 py-1 rounded-md transition-colors ${
              timeRange === '12h' 
                ? 'bg-teal-600 text-white' 
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            12 Hours
          </button>
          <button
            onClick={() => { setTimeRange('24h'); collectLogs(24); }}
            className={`px-3 py-1 rounded-md transition-colors ${
              timeRange === '24h' 
                ? 'bg-teal-600 text-white' 
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            24 Hours
          </button>
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

      {/* Logs Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-300 font-medium">Level</th>
                <th className="text-left p-3 text-slate-300 font-medium">Provider</th>
                <th className="text-left p-3 text-slate-300 font-medium">Event ID</th>
                <th className="text-left p-3 text-slate-300 font-medium">Computer</th>
                <th className="text-left p-3 text-slate-300 font-medium">Timestamp</th>
                <th className="text-left p-3 text-slate-300 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    No logs available. Click "Collect Logs" to gather system events.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>
                          {getLevelName(log.level)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{log.provider}</td>
                    <td className="p-3 text-slate-300">{log.event_id}</td>
                    <td className="p-3 text-slate-300">{log.computer_name}</td>
                    <td className="p-3 text-slate-300">{formatTimestamp(log.timestamp)}</td>
                    <td className="p-3 text-slate-300 max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
