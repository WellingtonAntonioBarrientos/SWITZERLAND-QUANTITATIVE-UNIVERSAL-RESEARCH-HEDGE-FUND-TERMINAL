import { useState, useEffect } from "react";
import axios from "axios";
import { Globe, RefreshCw, Briefcase, Target, Brain, Coins, Scale, Cpu, FileBarChart, TrendingDown, Building2, ChevronDown, ChevronUp, Key } from "lucide-react";
import { Bar } from "recharts";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';
import { CompositeStrategyCard } from '../components/CompositeStrategyCard';

const StrategiesPage = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState({});
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await axios.get(`${API}/strategies`);
        setStrategies(res.data);
      } catch (e) {
        logError("Error fetching strategies:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
    const interval = setInterval(fetchStrategies, 120000); // Auto-refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const analyzeStrategy = async (strategyId) => {
    setAnalyzing(strategyId);
    try {
      const res = await axios.post(`${API}/strategies/${strategyId}/analyze`);
      setAnalysis(prev => ({ ...prev, [strategyId]: res.data.analysis }));
    } catch (e) {
      logError("Error analyzing strategy:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStrategyIcon = (category) => {
    const icons = {
      'Equity': Target,
      'Macro': Globe,
      'Credit': Coins,
      'Quantitative': Cpu,
      'Arbitrage': Scale,
      'Structured': FileBarChart,
      'Managed Futures': TrendingDown,
      'Real Assets': Building2
    };
    return icons[category] || Briefcase;
  };

  const getRiskColor = (risk) => {
    if (risk.includes('LOW')) return 'text-[#00e676]';
    if (risk.includes('HIGH')) return 'text-[#ef4444]';
    return 'text-[#f59e0b]';
  };

  if (loading) return <LoadingState />;

  // Separate composite strategy from individual strategies
  const compositeStrategy = strategies.find(s => s.id === 'composite-portfolio');
  const individualStrategies = strategies.filter(s => s.id !== 'composite-portfolio');

  return (
    <div data-testid="strategies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hedge Fund Strategies</h1>
          <p className="page-subtitle">Composite Portfolio + 10 Core Investment Strategies for 2026</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <span>{strategies.length} Strategies</span>
          <span>•</span>
          <span>{new Set(strategies.map(s => s.category)).size} Categories</span>
        </div>
      </div>

      {/* COMPOSITE PORTFOLIO STRATEGY - Featured Section */}
      {compositeStrategy && <CompositeStrategyCard strategy={compositeStrategy} />}

      {/* Individual Strategy Overview Cards */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4 flex items-center gap-2">
          <Briefcase size={18} />
          Individual Strategies
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {individualStrategies.map((strategy) => {
          const IconComponent = getStrategyIcon(strategy.category);
          const isExpanded = expandedCards[strategy.id];
          const hasAnalysis = analysis[strategy.id];
          
          return (
            <div 
              key={strategy.id} 
              className="quant-card overflow-hidden"
              data-testid={`strategy-card-${strategy.id}`}
            >
              {/* Header */}
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                    <IconComponent size={16} className="text-[#3b82f6]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-medium text-[#ededed] normal-case">{strategy.name}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#27272a] rounded">{strategy.category}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleExpand(strategy.id)}
                  className="text-[#71717a] hover:text-white"
                  data-testid={`expand-${strategy.id}`}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Main Content */}
              <div className="p-4">
                <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed">{strategy.description}</p>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a] mb-1">Risk Level</div>
                    <div className={`font-mono text-sm font-medium ${getRiskColor(strategy.risk_level)}`}>
                      {strategy.risk_level}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a] mb-1">Expected Return</div>
                    <div className="font-mono text-sm font-medium text-[#00e676]">{strategy.expected_return}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a] mb-1">Correlation</div>
                    <div className="font-mono text-sm font-medium text-[#3b82f6]">{strategy.correlation}</div>
                  </div>
                </div>

                {/* Key Factors */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {strategy.key_factors.map((factor, i) => (
                    <span key={factor} className="text-[10px] px-2 py-1 bg-[#27272a] text-[#a1a1aa] rounded">
                      {factor}
                    </span>
                  ))}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[#27272a] pt-4 mt-4">
                    <button
                      onClick={() => analyzeStrategy(strategy.id)}
                      disabled={analyzing === strategy.id}
                      className="btn-quant px-4 py-2 text-xs flex items-center gap-2 mb-4"
                      data-testid={`analyze-strategy-${strategy.id}`}
                    >
                      {analyzing === strategy.id ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Brain size={12} />
                          Get AI Analysis
                        </>
                      )}
                    </button>

                    {hasAnalysis && (
                      <div className="bg-[#000] border border-[#27272a] rounded-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain size={14} className="text-[#3b82f6]" />
                          <span className="text-xs text-[#71717a] uppercase">AI Strategy Analysis</span>
                        </div>
                        <div className="text-sm text-[#ededed] whitespace-pre-wrap leading-relaxed">
                          {hasAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="px-4 py-2 bg-[#000] border-t border-[#27272a] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${strategy.status === 'ACTIVE' ? 'bg-[#00e676]' : 'bg-[#71717a]'}`} />
                  <span className="text-[10px] text-[#71717a]">{strategy.status}</span>
                </div>
                <span className="text-[10px] text-[#71717a]">ID: {strategy.id}</span>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Strategy Summary Section */}
      <div className="mt-8 quant-card">
        <div className="quant-card-header">Strategy Allocation Guide</div>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Low Risk', strategies: strategies.filter(s => s.risk_level.includes('LOW')).length, color: '#00e676' },
              { label: 'Medium Risk', strategies: strategies.filter(s => s.risk_level === 'MEDIUM').length, color: '#f59e0b' },
              { label: 'High Risk', strategies: strategies.filter(s => s.risk_level.includes('HIGH')).length, color: '#ef4444' },
              { label: 'Low Correlation', strategies: strategies.filter(s => s.correlation.includes('0.0') || s.correlation.includes('-')).length, color: '#3b82f6' },
              { label: 'Total Strategies', strategies: strategies.length, color: '#a1a1aa' },
            ].map((item, i) => (
              <div key={item.label} className="text-center">
                <div className="font-mono text-2xl font-semibold" style={{ color: item.color }}>{item.strategies}</div>
                <div className="text-[10px] text-[#71717a] uppercase mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategiesPage;
