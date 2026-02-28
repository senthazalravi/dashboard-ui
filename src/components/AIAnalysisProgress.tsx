import React, { useState, useEffect, useRef } from 'react';
import { useApiPort } from '../hooks/useApiPort';
import { 
  Brain, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Activity,
  Zap,
  Database,
  Search,
  Link,
  Bot
} from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

const AIAnalysisProgress: React.FC<{
  isActive: boolean;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}> = ({ isActive, onComplete, onError }) => {
  const { apiPort } = useApiPort();
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const steps: ProgressStep[] = [
    { id: 'init', label: 'Initializing AI Analyzer', icon: Brain, status: 'pending' },
    { id: 'scan', label: 'Scanning JSON Files', icon: Search, status: 'pending' },
    { id: 'load', label: 'Loading Device Data', icon: Database, status: 'pending' },
    { id: 'merge', label: 'Merging Data Sources', icon: Zap, status: 'pending' },
    { id: 'connect', label: 'Connecting to AI Service', icon: Link, status: 'pending' },
    { id: 'analyze', label: 'Running AI Analysis', icon: Bot, status: 'pending' },
    { id: 'complete', label: 'Analysis Complete', icon: CheckCircle, status: 'pending' }
  ];

  useEffect(() => {
    if (isActive && apiPort && !isRunning) {
      startAnalysis();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isActive, apiPort]);

  const startAnalysis = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setCurrentStep(0);
    
    // Reset all steps to pending
    steps.forEach((_, index) => {
      steps[index].status = 'pending';
    });

    try {
      // Start the analysis
      const response = await fetch(`http://localhost:${apiPort}/api/analyze/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      // Connect to SSE for progress updates
      connectToProgressStream();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsRunning(false);
      onError?.(errorMessage);
    }
  };

  const connectToProgressStream = () => {
    if (!apiPort) return;

    const eventSource = new EventSource(`http://localhost:${apiPort}/api/analyze/progress`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const message = event.data;
      setStatusMessage(message);
      
      // Update progress based on message content
      if (message.includes('Initializing')) {
        updateStepStatus('init', 'active');
        setProgress(10);
      } else if (message.includes('Scanning')) {
        updateStepStatus('init', 'completed');
        updateStepStatus('scan', 'active');
        setProgress(25);
      } else if (message.includes('Successfully loaded')) {
        updateStepStatus('scan', 'completed');
        updateStepStatus('load', 'active');
        setProgress(40);
      } else if (message.includes('Merging')) {
        updateStepStatus('load', 'completed');
        updateStepStatus('merge', 'active');
        setProgress(55);
      } else if (message.includes('Connecting to Ollama')) {
        updateStepStatus('merge', 'completed');
        updateStepStatus('connect', 'active');
        setProgress(70);
      } else if (message.includes('Running AI analysis')) {
        updateStepStatus('connect', 'completed');
        updateStepStatus('analyze', 'active');
        setProgress(85);
      } else if (message.includes('completed successfully')) {
        updateStepStatus('analyze', 'completed');
        updateStepStatus('complete', 'active');
        setProgress(100);
        
        // Get the final result
        setTimeout(() => {
          fetchAnalysisResult();
        }, 1000);
      } else if (message.includes('Failed') || message.includes('❌')) {
        // Handle error
        const currentStepId = steps[currentStep]?.id;
        if (currentStepId) {
          updateStepStatus(currentStepId, 'error');
        }
        setError(message);
        setIsRunning(false);
        onError?.(message);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setError('Connection to progress stream lost');
      setIsRunning(false);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log('Connected to progress stream');
    };
  };

  const updateStepStatus = (stepId: string, status: 'pending' | 'active' | 'completed' | 'error') => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      steps[stepIndex].status = status;
      setCurrentStep(stepIndex);
    }
  };

  const fetchAnalysisResult = async () => {
    try {
      const response = await fetch(`http://localhost:${apiPort}/api/analyze/latest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        updateStepStatus('complete', 'completed');
        onComplete?.(result);
      } else {
        setError(result.error || 'Analysis completed with errors');
        onError?.(result.error || 'Analysis completed with errors');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch results';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsRunning(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };

  const getStepIcon = (step: ProgressStep) => {
    const Icon = step.icon;
    const iconClass = step.status === 'active' ? 'animate-pulse' : '';
    
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (step.status === 'error') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (step.status === 'active') {
      return <Loader2 className={`w-5 h-5 text-blue-500 animate-spin ${iconClass}`} />;
    } else {
      return <Icon className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    if (step.status === 'completed') return 'border-green-500 bg-green-500/10';
    if (step.status === 'error') return 'border-red-500 bg-red-500/10';
    if (step.status === 'active') return 'border-blue-500 bg-blue-500/10';
    return 'border-slate-600 bg-slate-800/50';
  };

  if (!isActive) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-medium text-white">AI Analysis Progress</h3>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Overall Progress</span>
          <span className="text-sm text-slate-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="mb-6 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2">
            {isRunning && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            <span className="text-sm text-slate-300">{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getStepColor(step)}`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{step.label}</div>
              {step.status === 'active' && (
                <div className="text-xs text-slate-400 mt-1">In progress...</div>
              )}
              {step.status === 'completed' && (
                <div className="text-xs text-green-400 mt-1">Completed</div>
              )}
              {step.status === 'error' && (
                <div className="text-xs text-red-400 mt-1">Failed</div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${
                  index < currentStep ? 'bg-green-500' : 'bg-slate-600'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Analysis Error</span>
          </div>
          <p className="text-red-300 text-sm mt-2">{error}</p>
        </div>
      )}

      {/* Completion Message */}
      {progress === 100 && !error && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Analysis Complete!</span>
          </div>
          <p className="text-green-300 text-sm mt-2">
            AI analysis has been completed successfully. Check the results below.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisProgress;
