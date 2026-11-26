import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PriceHistory3D } from '../components/Surface3D';
import { API, logError } from '../lib/config';
import { LoadingState, StatRow } from '../components/Shared';
import { HedgeFundWatchlist } from '../components/HedgeFundWatchlist';

const QuantDashboard = ({ viewMode }) => {
  const [marketData, setMarketData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("SPY");
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('2d'); // '2d' or '3d'

  const fetchData = useCallback(async () => {
    try {
      const [marketRes, chartRes] = await Promise.all([
        axios.get(`${API}/market/data`),
        axios.get(`${API}/market/chart/${selectedSymbol}`)
      ]);
      setMarketData(marketRes.data);
      setChartData(chartRes.data.data);
    } catch (e) {
      logError("Error fetching market data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isNautical = viewMode === 'nautical';

  if (loading) return <LoadingState />;

  return (
    <div data-testid="quant-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quant Dashboard</h1>
          <p className="page-subtitle">Real-time market data & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#27272a] rounded-sm overflow-hidden">
            <button 
              onClick={() => setChartView('2d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${chartView === '2d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="chart-view-2d"
            >
              2D
            </button>
            <button 
              onClick={() => setChartView('3d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${chartView === '3d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="chart-view-3d"
            >
              3D Surface
            </button>
          </div>
          <button onClick={fetchData} className="btn-quant px-3 py-2 flex items-center gap-2">
            <RefreshCw size={14} strokeWidth={1.5} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Asset List */}
        <div className="col-span-3 quant-card" data-testid="asset-list">
          <div className="quant-card-header">Assets</div>
          <div className="max-h-[600px] overflow-y-auto">
            {marketData.map((asset, i) => (
              <div
                key={asset.symbol}
                onClick={() => setSelectedSymbol(asset.symbol)}
                className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                  selectedSymbol === asset.symbol ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : ''
                }`}
                data-testid={`asset-${asset.symbol}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-medium">{asset.symbol}</span>
                  <span className={`font-mono text-sm ${asset.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change_percent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-mono text-xs text-[#71717a]">${asset.price.toLocaleString()}</span>
                  <span className="font-mono text-xs text-[#71717a]">Vol: {(asset.volume / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chart */}
        <div className="col-span-6 quant-card" data-testid="main-chart">
          <div className="quant-card-header flex justify-between items-center">
            <span>{selectedSymbol} - {chartView === '3d' ? '3D Price Terrain' : 'Price Chart'}</span>
            <div className="flex gap-2">
              {['1D', '1W', '1M'].map(period => (
                <button key={period} className="px-2 py-1 text-[10px] btn-quant">
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          {chartView === '3d' ? (
            <PriceHistory3D chartData={chartData} height={550} />
          ) : (
            <>
              <div className="p-4 h-[400px] chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(-50)}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isNautical ? "#0ea5e9" : "#3b82f6"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isNautical ? "#0ea5e9" : "#3b82f6"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '2px' }}
                      labelStyle={{ color: '#71717a' }}
                      itemStyle={{ color: isNautical ? '#0ea5e9' : '#3b82f6' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area type="monotone" dataKey="close" stroke={isNautical ? "#0ea5e9" : "#3b82f6"} fill="url(#colorPrice)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 h-[150px] chart-container border-t border-[#27272a]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-50)}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '2px' }}
                      formatter={(value) => [value.toLocaleString(), 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#27272a">
                      {chartData.slice(-50).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#00e676' : '#ef4444'} fillOpacity={0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Order Book / Stats */}
        <div className="col-span-3 space-y-4">
          <div className="quant-card" data-testid="price-stats">
            <div className="quant-card-header">Price Stats</div>
            <div className="p-4 space-y-3">
              <StatRow label="Open" value={`$${chartData[0]?.open?.toFixed(2) || '-'}`} />
              <StatRow label="High" value={`$${Math.max(...chartData.map(d => d.high)).toFixed(2)}`} />
              <StatRow label="Low" value={`$${Math.min(...chartData.map(d => d.low)).toFixed(2)}`} />
              <StatRow label="Close" value={`$${chartData[chartData.length - 1]?.close?.toFixed(2) || '-'}`} />
            </div>
          </div>
          <div className="quant-card" data-testid="quick-stats">
            <div className="quant-card-header">Quick Stats</div>
            <div className="p-4 space-y-3">
              <StatRow label="Range High" value={`$${Math.max(...chartData.map(d => d.high)).toFixed(2)}`} />
              <StatRow label="Range Low" value={`$${Math.min(...chartData.map(d => d.low)).toFixed(2)}`} />
              <StatRow label="Range Change" value={`${(((chartData[chartData.length - 1]?.close || 0) / (chartData[0]?.open || 1) - 1) * 100).toFixed(2)}%`} />
              <StatRow label="Data Points" value={`${chartData.length}`} />
            </div>
          </div>
        </div>
      </div>

      {/* New Section: Assets / Equities 2 - Top Hedge Fund Holdings Watchlist */}
      <HedgeFundWatchlist viewMode={viewMode} />
    </div>
  );
};

export default QuantDashboard;
