import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CorrelationMatrix3D } from '../components/Surface3D';
import { API, logError } from '../lib/config';
import { LoadingState, MetricCard } from '../components/Shared';

const MacroRegime = ({ viewMode }) => {
  const [regimeData, setRegimeData] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correlationView, setCorrelationView] = useState('2d'); // '2d' or '3d'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regimeRes, corrRes] = await Promise.all([
          axios.get(`${API}/macro/regime`),
          axios.get(`${API}/macro/correlation`)
        ]);
        setRegimeData(regimeRes.data);
        setCorrelation(corrRes.data);
      } catch (e) {
        logError("Error fetching macro data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div data-testid="macro-regime">
      <div className="page-header">
        <div>
          <h1 className="page-title">Macro Regime</h1>
          <p className="page-subtitle">Economic indicators & market regime</p>
        </div>
        <div className="flex border border-[#27272a] rounded-sm overflow-hidden">
          <button 
            onClick={() => setCorrelationView('2d')}
            className={`px-3 py-1.5 text-[10px] uppercase ${correlationView === '2d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
            data-testid="correlation-view-2d"
          >
            2D Matrix
          </button>
          <button 
            onClick={() => setCorrelationView('3d')}
            className={`px-3 py-1.5 text-[10px] uppercase ${correlationView === '3d' ? 'bg-[#3b82f6] text-white' : 'text-[#71717a] hover:bg-[#27272a]'}`}
            data-testid="correlation-view-3d"
          >
            3D Surface
          </button>
        </div>
      </div>

      <div className="bento-grid bento-grid-4 mb-6">
        <div className="quant-card col-span-2">
          <div className="quant-card-header">Current Regime</div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <div className={`regime-indicator ${regimeData?.current_regime === 'RISK_ON' ? 'risk-on' : regimeData?.current_regime === 'RISK_OFF' ? 'risk-off' : ''}`}>
                {regimeData?.current_regime?.replace('_', ' ')}
              </div>
              <p className="text-xs text-[#71717a] mt-2">
                Confidence: {(regimeData?.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold text-[#ededed]">
                {(regimeData?.confidence * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-[#71717a]">Model Confidence</p>
            </div>
          </div>
        </div>
        
        {regimeData?.indicators?.slice(0, 2).map((indicator, i) => (
          <MetricCard
            key={i}
            label={indicator.name}
            value={indicator.value.toFixed(2)}
            change={((indicator.value - indicator.previous) / indicator.previous * 100).toFixed(2)}
          />
        ))}
      </div>

      <div className="bento-grid bento-grid-2 mb-6">
        <div className="quant-card">
          <div className="quant-card-header">Economic Indicators</div>
          <table className="quant-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {regimeData?.indicators?.map((ind, i) => (
                <tr key={ind.name}>
                  <td>{ind.name}</td>
                  <td>{ind.value.toFixed(2)}</td>
                  <td className="text-[#71717a]">{ind.previous.toFixed(2)}</td>
                  <td>
                    {ind.trend === 'up' ? (
                      <ArrowUpRight className="text-profit" size={14} />
                    ) : (
                      <ArrowDownRight className="text-loss" size={14} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="quant-card">
          <div className="quant-card-header">
            Correlation Matrix {correlationView === '3d' && '• 3D Surface'}
          </div>
          
          {correlationView === '3d' ? (
            <CorrelationMatrix3D 
              matrix={correlation?.matrix} 
              assets={correlation?.assets} 
              height={350}
            />
          ) : (
            <div className="p-4 overflow-x-auto">
              <table className="quant-table text-xs">
                <thead>
                  <tr>
                    <th></th>
                    {correlation?.assets?.map((asset, i) => (
                      <th key={asset} className="text-center">{asset}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlation?.assets?.map((asset, i) => (
                    <tr key={asset}>
                      <td className="font-medium">{asset}</td>
                      {correlation?.assets?.map((other, j) => {
                        const val = correlation?.matrix?.[asset]?.[other];
                        const color = val === 1 ? '#3b82f6' : val > 0 ? `rgba(0, 230, 118, ${Math.abs(val)})` : `rgba(239, 68, 68, ${Math.abs(val)})`;
                        return (
                          <td key={j} className="text-center" style={{ background: color, color: Math.abs(val) > 0.5 ? '#000' : '#ededed' }}>
                            {val?.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroRegime;
