import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

export const HedgeFundWatchlist = ({ viewMode }) => {
  const [funds, setFunds] = useState([]);
  const [watchlistData, setWatchlistData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundsAndPrices = async () => {
      try {
        // Fetch all hedge funds
        const fundsRes = await axios.get(`${API}/sec/13f`);
        setFunds(fundsRes.data);
        
        // Extract unique symbols from top 5 holdings of all 10 funds
        const allSymbols = new Set();
        fundsRes.data.forEach(fund => {
          fund.top_holdings.slice(0, 5).forEach(h => allSymbols.add(h.symbol));
        });
        
        // Fetch real-time price data for all unique symbols
        const pricePromises = Array.from(allSymbols).map(symbol =>
          axios.get(`${API}/market/chart/${symbol}`).then(res => ({
            symbol,
            data: res.data.data.slice(-30) // Last 30 data points
          })).catch(err => {
            logError(`Error fetching ${symbol}:`, err);
            return { symbol, data: [] };
          })
        );
        
        const priceResults = await Promise.all(pricePromises);
        const priceMap = {};
        priceResults.forEach(({ symbol, data }) => {
          priceMap[symbol] = data;
        });
        
        setWatchlistData(priceMap);
      } catch (e) {
        logError("Error fetching hedge fund watchlist:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFundsAndPrices();
    const interval = setInterval(fetchFundsAndPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: fetcher defined in effect, interval handles refresh
  }, []);

  const isBloomberg = viewMode === 'wellington';

  if (loading) return <LoadingState />;

  return (
    <div className="mt-8">
      <div className="page-header">
        <div>
          <h2 className="page-title text-2xl">Assets / Equities 2</h2>
          <p className="page-subtitle">Top 5 Holdings from Top 15 Hedge Funds - Real-Time Tracking</p>
        </div>
        <div className="text-xs text-[#71717a]">
          Tracking {Object.keys(watchlistData).length} unique assets | Auto-refresh: 60s
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {funds.map((fund, idx) => (
          <div key={fund.id} className="col-span-6 quant-card">
            <div className={`quant-card-header text-xs ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
              #{idx + 1} {fund.fund_name} - Top 5 Holdings
            </div>
            <div className="p-3 space-y-2">
              {fund.top_holdings.slice(0, 5).map((holding, i) => {
                const chartData = watchlistData[holding.symbol] || [];
                const latestPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
                const priceChange = chartData.length > 1 
                  ? ((latestPrice - chartData[0].close) / chartData[0].close) * 100 
                  : 0;

                return (
                  <div key={holding.symbol} className="border border-[#27272a] rounded p-2 hover:border-[#3b82f6] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`font-mono text-sm font-bold ${isBloomberg ? 'text-[#00ffff]' : 'text-[#3b82f6]'}`}>
                          {holding.symbol}
                        </span>
                        <span className="text-[10px] text-[#71717a] ml-2">{holding.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs">${latestPrice.toFixed(2)}</div>
                        <div className={`font-mono text-[10px] ${priceChange >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id={`gradient-${holding.symbol}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={priceChange >= 0 ? '#00e676' : '#ef4444'} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={priceChange >= 0 ? '#00e676' : '#ef4444'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="close" 
                            stroke={priceChange >= 0 ? '#00e676' : '#ef4444'} 
                            fill={`url(#gradient-${holding.symbol})`}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between text-[9px] text-[#71717a] mt-1">
                      <span>Weight: {holding.percent}%</span>
                      <span>Value: ${(holding.value / 1e9).toFixed(2)}B</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
