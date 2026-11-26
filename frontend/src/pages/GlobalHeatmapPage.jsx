import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import { MarketIndices3D } from '../components/Surface3D';
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

const GlobalHeatmapPage = ({ viewMode }) => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heatmapView, setHeatmapView] = useState('2d'); // '2d' or '3d'

  const fetchIndices = async () => {
    try {
      const res = await axios.get(`${API}/market/indices`);
      setIndices(res.data);
    } catch (e) {
      logError("Error fetching indices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const isNautical = viewMode === 'nautical';
  const regions = {
    'US': indices.filter(i => i.region === 'US'),
    'Europe': indices.filter(i => ['UK', 'Germany', 'France'].includes(i.region)),
    'Asia': indices.filter(i => ['Japan', 'Hong Kong', 'China', 'South Korea', 'India'].includes(i.region)),
    'Other': indices.filter(i => ['Australia', 'Canada', 'Brazil', 'Russia'].includes(i.region)),
  };

  const getHeatColor = (change) => {
    if (change >= 2) return isBloomberg ? 'bg-[#00ff00]' : 'bg-[#00e676]';
    if (change >= 0.5) return isBloomberg ? 'bg-[#00cc00]' : 'bg-[#00e676]/70';
    if (change >= 0) return isBloomberg ? 'bg-[#009900]' : 'bg-[#00e676]/40';
    if (change >= -0.5) return isBloomberg ? 'bg-[#990000]' : 'bg-[#ef4444]/40';
    if (change >= -2) return isBloomberg ? 'bg-[#cc0000]' : 'bg-[#ef4444]/70';
    return isBloomberg ? 'bg-[#ff0000]' : 'bg-[#ef4444]';
  };

  const getTextColor = (change) => {
    return change >= 0 ? (isBloomberg ? 'text-[#00ff00]' : 'text-profit') : (isBloomberg ? 'text-[#ff0000]' : 'text-loss');
  };

  return (
    <div data-testid="global-heatmap-page" className={isBloomberg ? 'font-mono' : ''}>
      <div className="page-header">
        <div>
          <h1 className="page-title">GLOBAL MARKET HEATMAP</h1>
          <p className="page-subtitle">Real-time worldwide index performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#27272a] rounded-sm overflow-hidden">
            <button 
              onClick={() => setHeatmapView('2d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${heatmapView === '2d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="heatmap-view-2d"
            >
              2D Grid
            </button>
            <button 
              onClick={() => setHeatmapView('3d')}
              className={`px-3 py-1.5 text-[10px] uppercase ${heatmapView === '3d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
              data-testid="heatmap-view-3d"
            >
              3D Bars
            </button>
          </div>
          <button onClick={fetchIndices} className="btn-quant px-3 py-2 flex items-center gap-2">
            <RefreshCw size={14} strokeWidth={1.5} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(regions).map(([region, data]) => {
          const avgChange = data.reduce((a, b) => a + b.change_percent, 0) / data.length;
          return (
            <div key={region} className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#333]' : ''}`}>
              <div className="p-4">
                <div className="text-xs text-[#71717a] uppercase mb-1">{region}</div>
                <div className={`font-mono text-2xl font-semibold ${getTextColor(avgChange)}`}>
                  {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </div>
                <div className="text-xs text-[#71717a]">{data.length} indices</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap Grid */}
      <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#333]' : ''}`}>
        <div className={`quant-card-header ${isBloomberg ? 'bg-[#333] text-[#ff6600]' : ''}`}>
          FINANCIAL WORLD HEATMAP {heatmapView === '3d' && '• 3D View'}
        </div>
        
        {heatmapView === '3d' ? (
          <MarketIndices3D indices={indices} height={450} />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {indices.map((idx) => (
                <div
                  key={idx.symbol}
                  className={`p-4 rounded-sm ${getHeatColor(idx.change_percent)} transition-all hover:scale-105 cursor-pointer`}
                  data-testid={`heatmap-${idx.symbol}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold text-sm ${Math.abs(idx.change_percent) > 1 ? 'text-black' : 'text-white'}`}>
                      {idx.symbol}
                    </span>
                    <span className={`text-xs ${Math.abs(idx.change_percent) > 1 ? 'text-black/70' : 'text-white/70'}`}>
                      {idx.region}
                    </span>
                  </div>
                  <div className={`font-mono text-lg font-bold ${Math.abs(idx.change_percent) > 1 ? 'text-black' : 'text-white'}`}>
                    {idx.change_percent >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%
                  </div>
                  <div className={`text-xs ${Math.abs(idx.change_percent) > 1 ? 'text-black/70' : 'text-white/70'}`}>
                    {idx.name}
                  </div>
                  <div className={`font-mono text-xs mt-1 ${Math.abs(idx.change_percent) > 1 ? 'text-black/60' : 'text-white/60'}`}>
                    {idx.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Index Table */}
      <div className={`quant-card mt-4 ${isBloomberg ? 'bg-[#000] border-[#333]' : ''}`}>
        <div className={`quant-card-header ${isBloomberg ? 'bg-[#333] text-[#ff6600]' : ''}`}>
          DETAILED INDEX DATA
        </div>
        <table className="quant-table">
          <thead>
            <tr className={isBloomberg ? 'bg-[#111]' : ''}>
              <th>Symbol</th>
              <th>Name</th>
              <th>Region</th>
              <th>Value</th>
              <th>Change</th>
              <th>% Change</th>
              <th>YTD</th>
            </tr>
          </thead>
          <tbody>
            {indices.sort((a, b) => b.change_percent - a.change_percent).map((idx) => (
              <tr key={idx.symbol} className={isBloomberg ? 'hover:bg-[#111]' : ''}>
                <td className={`font-medium ${isBloomberg ? 'text-[#00ffff]' : 'text-[#3b82f6]'}`}>{idx.symbol}</td>
                <td>{idx.name}</td>
                <td>{idx.region}</td>
                <td className="font-mono">{idx.value.toLocaleString()}</td>
                <td className={`font-mono ${getTextColor(idx.change)}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}
                </td>
                <td className={`font-mono ${getTextColor(idx.change_percent)}`}>
                  {idx.change_percent >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%
                </td>
                <td className={`font-mono ${getTextColor(idx.ytd_percent)}`}>
                  {idx.ytd_percent >= 0 ? '+' : ''}{idx.ytd_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlobalHeatmapPage;
