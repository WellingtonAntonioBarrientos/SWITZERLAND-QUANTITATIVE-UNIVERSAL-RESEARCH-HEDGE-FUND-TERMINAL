import { useState } from "react";
import axios from "axios";
import { RefreshCw, Brain, BarChart3, PieChart, Layers, Key } from "lucide-react";
import { Bar } from "recharts";
import { Surface3DChart } from '../components/Surface3D';
import { API } from '../lib/config';

export const CompositeStrategyCard = ({ strategy }) => {
  const [view3D, setView3D] = useState(false);
  const [chartType, setChartType] = useState('strategies'); // 'strategies' or 'categories'
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimization, setOptimization] = useState('');
  const [loadingOptimization, setLoadingOptimization] = useState(false);

  if (!strategy.roi_data) return null;

  const { strategies: strategyROIs, categories: categoryROIs, overall_roi } = strategy.roi_data;

  const handleGetOptimization = async () => {
    setLoadingOptimization(true);
    setShowOptimization(true);
    
    try {
      const response = await axios.post(`${API}/strategies/composite/optimize`);
      setOptimization(response.data.optimization);
    } catch (error) {
      setOptimization('Optimization service temporarily unavailable. Please try again.');
    } finally {
      setLoadingOptimization(false);
    }
  };

  // Prepare data for 3D visualization
  const strategy3DData = strategyROIs.map((s, idx) => ({
    x: idx,
    y: s.roi,
    z: s.allocation,
    label: s.name
  }));

  const category3DData = categoryROIs.map((c, idx) => ({
    x: idx,
    y: c.roi,
    z: c.allocation,
    label: c.name
  }));

  return (
    <div className="quant-card border-2 border-[#3b82f6]/30 mb-8">
      {/* Header */}
      <div className="quant-card-header bg-gradient-to-r from-[#3b82f6]/20 to-[#0ea5e9]/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#0ea5e9] rounded-lg flex items-center justify-center">
            <Layers size={20} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <span className="font-semibold text-[#ededed] text-base normal-case">{strategy.name}</span>
            <span className="ml-3 text-[10px] px-2 py-1 bg-[#3b82f6]/20 rounded font-bold">{strategy.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGetOptimization}
            disabled={loadingOptimization}
            className="px-4 py-2 bg-gradient-to-r from-[#3b82f6] to-[#0ea5e9] text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            data-testid="get-optimization-btn"
          >
            {loadingOptimization ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Brain size={12} />
            )}
            Get AI Optimization
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-[#71717a] mr-1">Overall ROI:</span>
            <span className="font-mono text-xl font-bold text-[#00e676]">{overall_roi}%</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-6 border-b border-[#27272a]">
        <p className="text-sm text-[#a1a1aa] leading-relaxed mb-4">{strategy.description}</p>
        
        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Risk Level</div>
            <div className="font-mono text-sm font-medium text-[#f59e0b]">{strategy.risk_level}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Expected Return</div>
            <div className="font-mono text-sm font-medium text-[#00e676]">{strategy.expected_return}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Correlation</div>
            <div className="font-mono text-sm font-medium text-[#3b82f6]">{strategy.correlation}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#71717a] mb-1">Strategies Combined</div>
            <div className="font-mono text-sm font-medium text-[#ededed]">10</div>
          </div>
        </div>

        {/* Key Factors */}
        <div className="flex flex-wrap gap-2 mt-4">
          {strategy.key_factors.map((factor, i) => (
            <span key={factor} className="text-[10px] px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded border border-[#3b82f6]/20">
              {factor}
            </span>
          ))}
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="px-6 py-3 bg-[#0a0a0a] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('strategies')}
            className={`px-3 py-1 text-xs rounded transition-colors ${chartType === 'strategies' ? 'bg-[#3b82f6] text-white' : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'}`}
          >
            By Strategy (10)
          </button>
          <button
            onClick={() => setChartType('categories')}
            className={`px-3 py-1 text-xs rounded transition-colors ${chartType === 'categories' ? 'bg-[#3b82f6] text-white' : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'}`}
          >
            By Category (8)
          </button>
        </div>
        <button
          onClick={() => setView3D(!view3D)}
          className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${view3D ? 'bg-[#0ea5e9] text-white' : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'}`}
        >
          <Layers size={12} />
          {view3D ? '3D Surface' : '2D Charts'}
        </button>
      </div>

      {/* ROI Visualization */}
      <div className="p-6">
        {chartType === 'strategies' && (
          <>
            <h3 className="text-sm font-semibold text-[#ededed] mb-4 flex items-center gap-2">
              <BarChart3 size={14} />
              ROI by Individual Strategy
            </h3>
            
            {view3D ? (
              <div className="h-[500px] bg-[#000] rounded border border-[#27272a]">
                <Surface3DChart
                  data={strategy3DData}
                  title="Strategy ROI vs Allocation (3D Surface)"
                  xLabel="Strategy Index"
                  yLabel="ROI (%)"
                  zLabel="Allocation (%)"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {strategyROIs.map((s, idx) => (
                  <div key={s.id} className="bg-[#0a0a0a] border border-[#27272a] rounded p-3 hover:border-[#3b82f6]/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#ededed]">{s.name}</div>
                        <div className="text-[10px] text-[#71717a]">{s.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-[#00e676]">{s.roi}%</div>
                        <div className="text-[10px] text-[#71717a]">ROI</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                      <div>
                        <span className="text-[#71717a]">Allocation:</span>
                        <span className="ml-2 font-mono text-[#3b82f6]">{s.allocation}%</span>
                      </div>
                      <div>
                        <span className="text-[#71717a]">YTD:</span>
                        <span className="ml-2 font-mono text-[#00e676]">{s.ytd}%</span>
                      </div>
                    </div>
                    {/* ROI Progress Bar */}
                    <div className="bg-[#27272a] h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00e676] to-[#3b82f6]" 
                        style={{ width: `${Math.min(s.roi * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {chartType === 'categories' && (
          <>
            <h3 className="text-sm font-semibold text-[#ededed] mb-4 flex items-center gap-2">
              <PieChart size={14} />
              ROI by Category
            </h3>
            
            {view3D ? (
              <div className="h-[500px] bg-[#000] rounded border border-[#27272a]">
                <Surface3DChart
                  data={category3DData}
                  title="Category ROI vs Allocation (3D Surface)"
                  xLabel="Category Index"
                  yLabel="ROI (%)"
                  zLabel="Allocation (%)"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryROIs.map((c, idx) => (
                  <div key={idx} className="bg-[#0a0a0a] border border-[#27272a] rounded p-4 hover:border-[#3b82f6]/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-base font-semibold text-[#ededed]">{c.name}</div>
                        <div className="text-[10px] text-[#71717a]">{c.strategies} {c.strategies === 1 ? 'Strategy' : 'Strategies'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-[#00e676]">{c.roi}%</div>
                        <div className="text-[10px] text-[#71717a]">Avg ROI</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-[#000] p-2 rounded">
                        <div className="text-[10px] text-[#71717a]">Portfolio Weight</div>
                        <div className="font-mono text-sm text-[#3b82f6] font-bold">{c.allocation}%</div>
                      </div>
                      <div className="bg-[#000] p-2 rounded">
                        <div className="text-[10px] text-[#71717a]">Risk Profile</div>
                        <div className={`text-sm font-medium ${c.risk.includes('HIGH') ? 'text-[#ef4444]' : c.risk.includes('LOW') ? 'text-[#00e676]' : 'text-[#f59e0b]'}`}>
                          {c.risk}
                        </div>
                      </div>
                    </div>
                    
                    {/* Allocation bar */}
                    <div className="bg-[#27272a] h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#0ea5e9]" 
                        style={{ width: `${Math.min(c.allocation * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* AI Optimization Results */}
      {showOptimization && (
        <div className="border-t border-[#27272a]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-[#0ea5e9]" />
              <h3 className="text-sm font-semibold text-[#ededed] uppercase tracking-wider">
                AI Portfolio Optimization Analysis
              </h3>
            </div>
            
            {loadingOptimization ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-[#3b82f6] mr-3" size={24} />
                <span className="text-[#a1a1aa]">Analyzing portfolio with advanced AI system...</span>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#3b82f6]/20 rounded p-4">
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-[#ededed] whitespace-pre-wrap leading-relaxed">
                    {optimization}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
