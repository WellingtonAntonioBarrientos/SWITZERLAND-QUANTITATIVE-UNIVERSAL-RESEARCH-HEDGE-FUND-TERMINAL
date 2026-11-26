import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Brain, Scale, Bell } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';
import { FundComparison } from '../components/FundComparison';
import { FundAlerts } from '../components/FundAlerts';

const SECFilingsPage = ({ viewMode }) => {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analysis, setAnalysis] = useState({});
  const [allFundsAnalysis, setAllFundsAnalysis] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    axios.get(`${API}/alerts?limit=1`).then(res => setUnreadAlerts(res.data.unread_count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchFilings = async () => {
      try {
        const res = await axios.get(`${API}/sec/13f`);
        setFilings(res.data);
      } catch (e) {
        logError("Error fetching 13F filings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFilings();
  }, []);

  const analyzeFiling = async (fundId) => {
    setAnalyzing(fundId);
    try {
      const res = await axios.post(`${API}/sec/13f/${fundId}/analyze`);
      setAnalysis(prev => ({ ...prev, [fundId]: res.data.analysis }));
    } catch (e) {
      logError("Error analyzing filing:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const analyzeAllFunds = async () => {
    setAnalyzingAll(true);
    try {
      const res = await axios.post(`${API}/sec/13f/analyze-all`);
      setAllFundsAnalysis(res.data.analysis);
    } catch (e) {
      logError("Error analyzing all funds:", e);
    } finally {
      setAnalyzingAll(false);
    }
  };

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const isNautical = viewMode === 'nautical';

  return (
    <div data-testid="sec-filings-page" className={isBloomberg ? 'font-mono' : ''}>
      <div className="page-header">
        <div>
          <h1 className="page-title">13F SEC FILINGS</h1>
          <p className="page-subtitle">Top 15 Hedge Fund Quarterly Holdings (Q3 2025)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-[#71717a]">
            Total AUM Tracked: ${(filings.reduce((a, b) => a + b.aum, 0) / 1e12).toFixed(2)}T
          </div>
          <button
            onClick={() => setShowAlerts(s => !s)}
            className={`btn-quant px-4 py-2 text-sm flex items-center gap-2 relative ${showAlerts ? 'bg-[#3b82f6] text-white' : ''} ${isBloomberg ? 'border-[#ff6600] hover:bg-[#ff6600] hover:text-black' : ''}`}
            data-testid="toggle-fund-alerts"
          >
            <Bell size={16} /> Alerts
            {unreadAlerts > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center" data-testid="alerts-unread-badge">
                {unreadAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowComparison(s => !s)}
            className={`btn-quant px-4 py-2 text-sm flex items-center gap-2 ${showComparison ? 'bg-[#3b82f6] text-white' : ''} ${isBloomberg ? 'border-[#ff6600] hover:bg-[#ff6600] hover:text-black' : ''}`}
            data-testid="toggle-fund-comparison"
          >
            <Scale size={16} /> Compare Funds
          </button>
          <button
            onClick={analyzeAllFunds}
            disabled={analyzingAll}
            className={`btn-quant px-4 py-2 text-sm flex items-center gap-2 ${isBloomberg ? 'border-[#ff6600] hover:bg-[#ff6600] hover:text-black' : ''}`}
            data-testid="analyze-all-funds"
          >
            {analyzingAll ? (
              <><RefreshCw size={16} className="animate-spin" /> Analyzing All Funds...</>
            ) : (
              <><Brain size={16} /> Analyze All 15 Funds with AI</>
            )}
          </button>
        </div>
      </div>

      {/* Fund Alerts */}
      {showAlerts && (
        <FundAlerts isBloomberg={isBloomberg} onUnreadChange={setUnreadAlerts} />
      )}

      {/* Fund Comparison */}
      {showComparison && filings.length >= 2 && (
        <FundComparison filings={filings} isBloomberg={isBloomberg} />
      )}

      {/* Global Analysis Section */}
      {allFundsAnalysis && (
        <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
          <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
            📊 Comparative Analysis: All 15 Hedge Funds
          </div>
          <div className="p-4">
            <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
              {allFundsAnalysis}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Fund List */}
        <div className={`col-span-4 quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`} data-testid="fund-list">
          <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
            TOP HEDGE FUNDS BY AUM
          </div>
          <div className="max-h-[700px] overflow-y-auto">
            {filings.sort((a, b) => b.aum - a.aum).map((filing, i) => (
              <div
                key={filing.id}
                onClick={() => setSelectedFiling(filing)}
                className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                  selectedFiling?.id === filing.id ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : ''
                }`}
                data-testid={`fund-${filing.id}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className={`text-xs ${isBloomberg ? 'text-[#ff6600]' : 'text-[#3b82f6]'}`}>#{i + 1}</span>
                    <span className="font-medium text-sm ml-2">{filing.fund_name}</span>
                  </div>
                  <span className={`font-mono text-xs ${filing.quarterly_change >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {filing.quarterly_change >= 0 ? '+' : ''}{filing.quarterly_change}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#71717a]">
                  <span>AUM: ${(filing.aum / 1e9).toFixed(1)}B</span>
                  <span>{filing.quarter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filing Details */}
        <div className="col-span-8 space-y-4">
          {selectedFiling ? (
            <>
              <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
                <div className={`quant-card-header flex justify-between items-center ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
                  <span>{selectedFiling.fund_name}</span>
                  <span className="text-xs">CIK: {selectedFiling.cik}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">AUM</div>
                      <div className={`font-mono text-xl font-semibold ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                        ${(selectedFiling.aum / 1e9).toFixed(1)}B
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">Quarter</div>
                      <div className="font-mono text-xl">{selectedFiling.quarter}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">QoQ Change</div>
                      <div className={`font-mono text-xl ${selectedFiling.quarterly_change >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {selectedFiling.quarterly_change >= 0 ? '+' : ''}{selectedFiling.quarterly_change}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[#71717a]">Filing Date</div>
                      <div className="font-mono text-xl">{selectedFiling.filing_date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* All 50 Holdings - Full Width */}
                    <div className="col-span-2">
                      <h4 className="text-xs uppercase text-[#71717a] mb-3">All Holdings (50 Assets)</h4>
                      <div className="max-h-[500px] overflow-y-auto border border-[#27272a] rounded">
                        <table className="quant-table">
                          <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                            <tr>
                              <th className="text-left">#</th>
                              <th className="text-left">Symbol</th>
                              <th className="text-left">Name</th>
                              <th className="text-right">Value</th>
                              <th className="text-right">Shares</th>
                              <th className="text-right">Weight</th>
                              <th className="text-right">Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedFiling.top_holdings.map((h, i) => (
                              <tr key={h.symbol} className="hover:bg-[#18181b]">
                                <td className="text-[#71717a]">{i + 1}</td>
                                <td className={`font-medium ${isBloomberg ? 'text-[#00ffff]' : 'text-[#3b82f6]'}`}>{h.symbol}</td>
                                <td className="text-xs text-[#a1a1aa]">{h.name}</td>
                                <td className="text-right">${(h.value / 1e9).toFixed(2)}B</td>
                                <td className="text-right font-mono text-xs">{(h.shares / 1e6).toFixed(2)}M</td>
                                <td className="text-right font-mono">{h.percent}%</td>
                                <td className={`text-right font-mono ${h.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                                  {h.change >= 0 ? '+' : ''}{h.change}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sector Allocation */}
                    <div>
                      <h4 className="text-xs uppercase text-[#71717a] mb-3">Sector Allocation</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedFiling.sector_allocation).map(([sector, pct], i) => (
                          <div key={sector}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{sector}</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="h-2 bg-[#27272a] rounded-sm overflow-hidden">
                              <div 
                                className={`h-full ${isBloomberg ? 'bg-[#ff6600]' : 'bg-[#3b82f6]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
                <div className={`quant-card-header flex justify-between items-center ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
                  <span>AI Portfolio Analysis</span>
                  <button
                    onClick={() => analyzeFiling(selectedFiling.id)}
                    disabled={analyzing === selectedFiling.id}
                    className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                    data-testid={`analyze-filing-${selectedFiling.id}`}
                  >
                    {analyzing === selectedFiling.id ? (
                      <><RefreshCw size={12} className="animate-spin" /> Analyzing...</>
                    ) : (
                      <><Brain size={12} /> Analyze with AI</>
                    )}
                  </button>
                </div>
                <div className="p-4">
                  {analysis[selectedFiling.id] ? (
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isBloomberg ? 'text-[#00ff00]' : ''}`}>
                      {analysis[selectedFiling.id]}
                    </div>
                  ) : (
                    <div className="text-center text-[#71717a] py-8">
                      Click "Analyze with AI" to get insights on this fund's portfolio positioning
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="quant-card p-12 text-center text-[#71717a]">
              Select a fund from the list to view detailed 13F filing data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SECFilingsPage;
