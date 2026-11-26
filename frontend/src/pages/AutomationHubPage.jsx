import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, AlertTriangle, Shield, Brain, Cpu, Bot, Database, Users, Workflow, Key } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

const AutomationHubPage = ({ viewMode }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState({});

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await axios.get(`${API}/automation/modules`);
        setModules(res.data);
      } catch (e) {
        logError("Error fetching automation modules:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
    const interval = setInterval(fetchModules, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const analyzeModule = async (moduleId) => {
    setAnalyzing(moduleId);
    try {
      const res = await axios.post(`${API}/automation/modules/${moduleId}/analyze`);
      setAnalysis(prev => ({ ...prev, [moduleId]: res.data.analysis }));
    } catch (e) {
      logError("Error analyzing module:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'CORE': Cpu,
      'DATA': Database,
      'RISK': Shield,
      'OPS': Workflow,
      'IR': Users
    };
    return icons[category] || Bot;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'CORE': '#3b82f6',
      'DATA': '#8b5cf6',
      'RISK': '#ef4444',
      'OPS': '#f59e0b',
      'IR': '#00e676'
    };
    return colors[category] || '#71717a';
  };

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const isNautical = viewMode === 'nautical';

  return (
    <div data-testid="automation-hub-page" className={isBloomberg ? 'font-mono' : ''}>
      <div className="page-header">
        <div>
          <h1 className="page-title">HEDGE FUND AUTOMATION HUB</h1>
          <p className="page-subtitle">Enterprise automation modules for fund operations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <span className="text-xs text-[#71717a]">{modules.filter(m => m.status === 'ACTIVE').length}/{modules.length} Active</span>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {modules.map((module) => {
          const IconComponent = getCategoryIcon(module.category);
          const color = getCategoryColor(module.category);
          const hasAnalysis = analysis[module.id];
          
          return (
            <div 
              key={module.id} 
              className={`quant-card cursor-pointer hover:border-[${color}]/50 transition-all ${
                selectedModule?.id === module.id ? `border-[${color}]` : ''
              } ${isBloomberg ? 'bg-[#000]' : ''}`}
              onClick={() => setSelectedModule(module)}
              data-testid={`automation-module-${module.id}`}
            >
              <div className="quant-card-header flex items-center justify-between" style={{ borderColor: `${color}30` }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <IconComponent size={16} style={{ color }} strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-[#ededed] normal-case text-sm">{module.name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${module.status === 'ACTIVE' ? 'bg-[#00e676] animate-pulse' : 'bg-[#71717a]'}`} />
              </div>
              
              <div className="p-4">
                <p className="text-xs text-[#a1a1aa] mb-4 line-clamp-2">{module.description}</p>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {Object.entries(module.metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-[9px] uppercase text-[#71717a]">{key.replace(/_/g, ' ')}</div>
                      <div className={`font-mono text-sm ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                        {typeof value === 'number' ? (value < 1 ? (value * 100).toFixed(1) + '%' : value.toLocaleString()) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                {module.alerts.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-1 rounded">
                    <AlertTriangle size={12} />
                    <span>{module.alerts[0]}</span>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-[#000] border-t border-[#27272a] flex justify-between items-center">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
                  {module.category}
                </span>
                <span className="text-[10px] text-[#71717a]">
                  Last: {new Date(module.last_run).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Module Analysis */}
      {selectedModule && (
        <div className={`quant-card ${isBloomberg ? 'bg-[#000]' : ''}`}>
          <div className="quant-card-header flex justify-between items-center">
            <span>{selectedModule.name} - Detailed Analysis</span>
            <button
              onClick={() => analyzeModule(selectedModule.id)}
              disabled={analyzing === selectedModule.id}
              className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
              data-testid={`analyze-module-${selectedModule.id}`}
            >
              {analyzing === selectedModule.id ? (
                <><RefreshCw size={12} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Brain size={12} /> Get AI Optimization</>
              )}
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs uppercase text-[#71717a] mb-3">Full Description</h4>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{selectedModule.description}</p>
                
                <h4 className="text-xs uppercase text-[#71717a] mt-4 mb-3">All Metrics</h4>
                <div className="space-y-2">
                  {Object.entries(selectedModule.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-xs text-[#71717a] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className={`font-mono text-sm ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                        {typeof value === 'number' ? (value < 1 && value > 0 ? (value * 100).toFixed(1) + '%' : value.toLocaleString()) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                {analysis[selectedModule.id] ? (
                  <div>
                    <h4 className="text-xs uppercase text-[#71717a] mb-3 flex items-center gap-2">
                      <Brain size={12} className="text-[#3b82f6]" />
                      AI Optimization Analysis
                    </h4>
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed bg-[#000] border border-[#27272a] rounded p-4 max-h-[400px] overflow-y-auto ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                      {analysis[selectedModule.id]}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#71717a] text-sm">
                    Click "Get AI Optimization" for performance recommendations
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationHubPage;
