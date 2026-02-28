import React, { useState, useEffect } from 'react';
import { useApiPort } from '../hooks/useApiPort';
import { 
  Clock, 
  Download, 
  Trash2, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Calendar,
  Database
} from 'lucide-react';

interface AIReport {
  id: string;
  timestamp: string;
  system_overview: string;
  health_scores: {
    overall: number;
    storage: number;
    network: number;
    power: number;
    firmware: number;
    hid: number;
    audio: number;
    video: number;
    wireless: number;
    printing: number;
    virtual: number;
  };
  anomalies_count: number;
  failures_count: number;
  recommendations_count: number;
  devices_processed: number;
  analysis_duration_ms: number;
  created_at: string;
}

interface ReportHistoryResponse {
  success: boolean;
  reports: AIReport[];
  total_reports: number;
  storage_stats?: {
    total_reports: number;
    latest_report: string;
  };
  error?: string;
}

const AIReportHistory: React.FC = () => {
  const { apiPort, isChecking } = useApiPort();
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReportHistory();
  }, [apiPort]);

  const fetchReportHistory = async () => {
    if (!apiPort) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:${apiPort}/api/analyze/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ReportHistoryResponse = await response.json();

      if (data.success) {
        setReports(data.reports);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch report history');
      }
    } catch (err) {
      setError('Failed to connect to API server');
      console.error('Error fetching report history:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: string, timestamp: string) => {
    try {
      const response = await fetch(`http://localhost:${apiPort}/api/analyze/report/${reportId}`);
      const data = await response.json();

      if (data.success) {
        const reportData = {
          ...data.report,
          files: data.files,
          downloaded_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-analysis-report-${timestamp.replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report');
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`http://localhost:${apiPort}/api/analyze/delete/${reportId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setReports(reports.filter(r => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
          setShowDetails(false);
        }
      } else {
        setError(data.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return XCircle;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-slate-400">Loading report history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-slate-900/80 rounded-lg p-8 text-center border border-slate-700">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Analysis Reports</h3>
        <p className="text-slate-300 mb-4">
          Run an AI analysis to generate your first report.
        </p>
        <button
          onClick={() => window.location.href = '#ai-analysis'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Analysis History</h2>
          <p className="text-slate-400">
            {reports.length} reports generated • Latest: {reports[0] ? formatDate(reports[0].timestamp) : 'Never'}
          </p>
        </div>
        <button
          onClick={fetchReportHistory}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {reports.map((report) => {
          const HealthIcon = getHealthScoreIcon(report.health_scores.overall);
          return (
            <div
              key={report.id}
              className="bg-slate-900/80 rounded-lg p-6 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
              onClick={() => {
                setSelectedReport(report);
                setShowDetails(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <HealthIcon className={`w-5 h-5 ${getHealthScoreColor(report.health_scores.overall)}`} />
                    <h3 className="text-lg font-medium text-white">
                      Analysis Report
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      report.health_scores.overall >= 80 ? 'bg-green-500/20 text-green-400' :
                      report.health_scores.overall >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {report.health_scores.overall}% Health
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(report.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(report.analysis_duration_ms)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-4 h-4" />
                      {report.devices_processed} devices
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadReport(report.id, report.timestamp);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReport(report.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{report.anomalies_count}</div>
                  <div className="text-xs text-slate-300">Anomalies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{report.failures_count}</div>
                  <div className="text-xs text-slate-300">Failures</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{report.recommendations_count}</div>
                  <div className="text-xs text-slate-300">Recommendations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{report.devices_processed}</div>
                  <div className="text-xs text-slate-300">Devices</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Details Modal */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Analysis Report Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Health Scores */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4">Health Scores</h4>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(selectedReport.health_scores).map(([category, score]) => (
                    <div key={category} className="text-center">
                      <div className={`text-2xl font-bold ${getHealthScoreColor(score)}`}>
                        {score}%
                      </div>
                      <div className="text-xs text-slate-300 capitalize">{category}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Overview */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4">System Overview</h4>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
                    {selectedReport.system_overview}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => downloadReport(selectedReport.id, selectedReport.timestamp)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Full Report
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReportHistory;
