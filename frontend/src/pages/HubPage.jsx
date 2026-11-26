import { useState, useEffect } from "react";
import axios from "axios";
import { LayoutDashboard, FileSearch, CheckSquare, Zap, TrendingUp, Settings, Bell, Terminal as TerminalIcon } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState, MetricCard, ActionItem, QuickNavCard } from '../components/Shared';

const HubPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/summary`);
        setSummary(res.data);
      } catch (e) {
        logError("Error fetching summary:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div data-testid="hub-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hedge Fund Hub</h1>
          <p className="page-subtitle">Command Center Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-quant px-3 py-2 flex items-center gap-2">
            <Bell size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Alerts</span>
          </button>
          <button className="btn-quant px-3 py-2 flex items-center gap-2">
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="bento-grid bento-grid-4 mb-6">
        <MetricCard
          label="Portfolio Value"
          value={`$${(summary?.portfolio_value / 1000000).toFixed(1)}M`}
          change={summary?.daily_pnl_percent}
        />
        <MetricCard
          label="Daily P&L"
          value={`$${(summary?.daily_pnl / 1000).toFixed(0)}K`}
          change={summary?.daily_pnl_percent}
        />
        <MetricCard
          label="Open Positions"
          value={summary?.open_positions}
        />
        <MetricCard
          label="Current Regime"
          value={summary?.current_regime?.replace('_', ' ')}
          badge={true}
          badgeType={summary?.current_regime === 'RISK_ON' ? 'profit' : 'loss'}
        />
      </div>

      <div className="bento-grid bento-grid-3 mb-6">
        <div className="quant-card">
          <div className="quant-card-header">Pending Actions</div>
          <div className="p-4 space-y-3">
            <ActionItem icon={CheckSquare} label="Approvals Pending" value={summary?.pending_approvals} />
            <ActionItem icon={FileSearch} label="Research Tasks" value={summary?.pending_research} />
            <ActionItem icon={Zap} label="Active Automations" value={summary?.active_automations} />
          </div>
        </div>
        
        <div className="quant-card">
          <div className="quant-card-header">System Status</div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${summary?.system_health?.includes('8/8') ? 'status-healthy' : 'status-degraded'}`}></div>
              <span className="font-mono text-sm">{summary?.system_health}</span>
            </div>
          </div>
        </div>
        
        <div className="quant-card">
          <div className="quant-card-header">Top Movers</div>
          <div className="p-4 space-y-2">
            {summary?.top_movers?.slice(0, 3).map((mover, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-mono text-sm">{mover.symbol}</span>
                <span className={`font-mono text-sm ${mover.change_percent >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {mover.change_percent >= 0 ? '+' : ''}{mover.change_percent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bento-grid bento-grid-2">
        <QuickNavCard title="Quant Dashboard" desc="View market data & charts" path="/dashboard" icon={LayoutDashboard} />
        <QuickNavCard title="Macro Regime" desc="Economic indicators" path="/macro" icon={TrendingUp} />
        <QuickNavCard title="Terminal" desc="Command interface" path="/terminal" icon={TerminalIcon} />
        <QuickNavCard title="Research Queue" desc="AI-powered analysis" path="/research" icon={FileSearch} />
      </div>
    </div>
  );
};

export default HubPage;
