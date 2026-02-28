import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    FileText,
    Download,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity,
    RefreshCw,
    Shield,
    Zap,
    Database,
    Calendar,
} from 'lucide-react';
import { useApiPort } from '../hooks/useApiPort';
import AIAnalysisProgress from './AIAnalysisProgress';

interface AnalysisReport {
  id: string;
  timestamp: string;
  report_path: string;
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
  metadata: {
    json_files_scanned: number;
    total_devices: number;
    analysis_duration_ms: number;
    llm_model: string;
    ollama_url: string;
  };
  anomalies_count: number;
  failures_count: number;
  recommendations_count: number;
  system_overview: string;
}

interface AnalysisHistory {
  id: string;
  timestamp: string;
  health_scores: {
    overall: number;
  };
  anomalies_count: number;
}

export default function AILogAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const { apiPort, isChecking } = useApiPort();

  const runAnalysis = () => {
    if (isChecking) {
      setError('API server is being detected, please wait...');
      return;
    }

    setIsAnalyzing(true);
    setShowProgress(true);
    setError(null);
    setAnalysisStatus('');
  };

  const handleAnalysisComplete = (result: any) => {
    setIsAnalyzing(false);
    setShowProgress(false);
    setCurrentReport(result);
    setHistory(prev => [result, ...prev.slice(0, 4)]);
    setAnalysisStatus('Analysis completed successfully!');
  };

  const handleAnalysisError = (errorMessage: string) => {
    setIsAnalyzing(false);
    setShowProgress(false);
    setError(errorMessage);
    setAnalysisStatus('Analysis failed');
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getSeverityColor = (count: number) => {
    if (count === 0) return 'text-emerald-600';
    if (count <= 2) return 'text-yellow-600';
    if (count <= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              AI Log Analysis
            </h1>
            <p className="text-slate-400">
              AI-powered system health analysis and failure prediction using Gemma3
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm ${isChecking ? 'text-yellow-400' : 'text-green-400'}`}>
                API Server: Port {apiPort}
              </div>
              <div className="text-xs text-slate-500">
                {isChecking ? 'Detecting...' : 'Connected'}
              </div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || isChecking}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {analysisStatus}
                </>
              ) : isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Detecting Server...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run AI Log Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <AIAnalysisProgress
        isActive={showProgress}
        onComplete={handleAnalysisComplete}
        onError={handleAnalysisError}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Current Report */}
      {currentReport && (
        <div className="space-y-6">
          {/* Report Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Latest Analysis Report
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                {new Date(currentReport.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Health Scores Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-2 ${getHealthColor(currentReport.health_scores.overall)}`}>
                  {getHealthIcon(currentReport.health_scores.overall)}
                  <span className="font-bold">Overall</span>
                </div>
                <div className="text-2xl font-bold text-white">{currentReport.health_scores.overall}%</div>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-2 ${getHealthColor(currentReport.health_scores.storage)}`}>
                  <Database className="w-4 h-4" />
                  <span className="font-bold">Storage</span>
                </div>
                <div className="text-2xl font-bold text-white">{currentReport.health_scores.storage}%</div>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-2 ${getHealthColor(currentReport.health_scores.network)}`}>
                  <Activity className="w-4 h-4" />
                  <span className="font-bold">Network</span>
                </div>
                <div className="text-2xl font-bold text-white">{currentReport.health_scores.network}%</div>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-2 ${getHealthColor(currentReport.health_scores.power)}`}>
                  <Zap className="w-4 h-4" />
                  <span className="font-bold">Power</span>
                </div>
                <div className="text-2xl font-bold text-white">{currentReport.health_scores.power}%</div>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-2 ${getHealthColor(currentReport.health_scores.firmware)}`}>
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">Firmware</span>
                </div>
                <div className="text-2xl font-bold text-white">{currentReport.health_scores.firmware}%</div>
              </div>
            </div>

            {/* System Overview */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">System Overview</h3>
              <div className="bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap">{currentReport.system_overview}</pre>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSeverityColor(currentReport.anomalies_count)}`}>
                  {currentReport.anomalies_count}
                </div>
                <div className="text-sm text-slate-400">Anomalies Detected</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSeverityColor(currentReport.failures_count)}`}>
                  {currentReport.failures_count}
                </div>
                <div className="text-sm text-slate-400">Potential Failures</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {currentReport.recommendations_count}
                </div>
                <div className="text-sm text-slate-400">Recommendations</div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Analysis Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Files Scanned:</span>
                  <span className="text-white ml-2">{currentReport.metadata.json_files_scanned}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Devices:</span>
                  <span className="text-white ml-2">{currentReport.metadata.total_devices}</span>
                </div>
                <div>
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-white ml-2">{currentReport.metadata.analysis_duration_ms}ms</span>
                </div>
                <div>
                  <span className="text-slate-400">Model:</span>
                  <span className="text-white ml-2">{currentReport.metadata.llm_model}</span>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <a
                href={`file:///${currentReport.report_path}`}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Full Report
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* Analysis History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Analysis History
          </h2>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getHealthColor(item.health_scores.overall)}`}></div>
                    <div>
                      <div className="text-white font-medium">
                        Report #{index + 1}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Health:</span>
                    <span className={`font-bold ${getHealthColor(item.health_scores.overall)}`}>
                      {item.health_scores.overall}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Anomalies:</span>
                    <span className={`font-bold ${getSeverityColor(item.anomalies_count)}`}>
                      {item.anomalies_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!currentReport && !isAnalyzing && !error && (
        <div className="flex flex-col items-center justify-center py-20">
          <Brain className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-300 mb-2">No Analysis Available</h2>
          <p className="text-slate-400 text-center max-w-md">
            Run an AI log analysis to get insights into your system health, detect anomalies, and receive failure predictions.
          </p>
          <button
            onClick={runAnalysis}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Run First Analysis
          </button>
        </div>
      )}
    </div>
  );
}
