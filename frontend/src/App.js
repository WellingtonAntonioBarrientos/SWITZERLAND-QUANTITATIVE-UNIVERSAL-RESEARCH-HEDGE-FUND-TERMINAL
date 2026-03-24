import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, Globe, Terminal as TerminalIcon, FileSearch, 
  CheckSquare, Activity, Zap, Code2, Home, TrendingUp,
  ChevronLeft, ChevronRight, Settings, Bell, RefreshCw,
  ArrowUpRight, ArrowDownRight, Play, Pause, Trash2, Plus,
  AlertTriangle, CheckCircle, XCircle, Clock, Send,
  Briefcase, Target, Shield, Brain, Coins, Scale, Cpu, 
  FileBarChart, TrendingDown, Building2, ChevronDown, ChevronUp
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============== SIDEBAR ==============
const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Hub" },
    { path: "/strategies", icon: Briefcase, label: "Strategies" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Quant Dashboard" },
    { path: "/macro", icon: TrendingUp, label: "Macro Regime" },
    { path: "/intel", icon: Globe, label: "World Intel" },
    { path: "/terminal", icon: TerminalIcon, label: "Terminal" },
  ];
  
  const workflowItems = [
    { path: "/research", icon: FileSearch, label: "Research Queue" },
    { path: "/approvals", icon: CheckSquare, label: "Approvals" },
    { path: "/health", icon: Activity, label: "System Health" },
  ];
  
  const automationItems = [
    { path: "/automation-v1", icon: Zap, label: "Automation V1" },
    { path: "/automation-v2", icon: Code2, label: "Automation V2" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} data-testid="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">QF</div>
        {!collapsed && <span className="sidebar-title">QuantFlow</span>}
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <item.icon className="nav-item-icon" strokeWidth={1.5} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Workflow</div>}
          {workflowItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className="nav-item-icon" strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
        
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Automation</div>}
          {automationItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className="nav-item-icon" strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>
      
      <div className="p-2 border-t border-[#27272a]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full justify-center"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};

// ============== HUB PAGE ==============
const HubPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/summary`);
        setSummary(res.data);
      } catch (e) {
        console.error("Error fetching summary:", e);
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

// ============== HEDGE FUND STRATEGIES ==============
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
        console.error("Error fetching strategies:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
  }, []);

  const analyzeStrategy = async (strategyId) => {
    setAnalyzing(strategyId);
    try {
      const res = await axios.post(`${API}/strategies/${strategyId}/analyze`);
      setAnalysis(prev => ({ ...prev, [strategyId]: res.data.analysis }));
    } catch (e) {
      console.error("Error analyzing strategy:", e);
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

  return (
    <div data-testid="strategies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hedge Fund Strategies</h1>
          <p className="page-subtitle">10 Core Investment Strategies for 2026</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <span>{strategies.length} Strategies</span>
          <span>•</span>
          <span>{new Set(strategies.map(s => s.category)).size} Categories</span>
        </div>
      </div>

      {/* Strategy Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {strategies.map((strategy) => {
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
                    <span key={i} className="text-[10px] px-2 py-1 bg-[#27272a] text-[#a1a1aa] rounded">
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
              <div key={i} className="text-center">
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

// ============== QUANT DASHBOARD ==============
const QuantDashboard = () => {
  const [marketData, setMarketData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("SPY");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [marketRes, chartRes] = await Promise.all([
        axios.get(`${API}/market/data`),
        axios.get(`${API}/market/chart/${selectedSymbol}`)
      ]);
      setMarketData(marketRes.data);
      setChartData(chartRes.data.data);
    } catch (e) {
      console.error("Error fetching market data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <LoadingState />;

  return (
    <div data-testid="quant-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quant Dashboard</h1>
          <p className="page-subtitle">Real-time market data & analytics</p>
        </div>
        <button onClick={fetchData} className="btn-quant px-3 py-2 flex items-center gap-2">
          <RefreshCw size={14} strokeWidth={1.5} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Asset List */}
        <div className="col-span-3 quant-card" data-testid="asset-list">
          <div className="quant-card-header">Assets</div>
          <div className="max-h-[600px] overflow-y-auto">
            {marketData.map((asset, i) => (
              <div
                key={i}
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
            <span>{selectedSymbol} - Price Chart</span>
            <div className="flex gap-2">
              {['1D', '1W', '1M'].map(period => (
                <button key={period} className="px-2 py-1 text-[10px] btn-quant">
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 h-[400px] chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice(-50)}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                  contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '2px' }}
                  labelStyle={{ color: '#71717a' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Area type="monotone" dataKey="close" stroke="#3b82f6" fill="url(#colorPrice)" strokeWidth={1.5} />
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
              <StatRow label="24h Volume" value="$1.2B" />
              <StatRow label="Avg Volume" value="$890M" />
              <StatRow label="52w High" value="$185.50" />
              <StatRow label="52w Low" value="$120.30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== MACRO REGIME ==============
const MacroRegime = () => {
  const [regimeData, setRegimeData] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Error fetching macro data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div data-testid="macro-regime">
      <div className="page-header">
        <div>
          <h1 className="page-title">Macro Regime</h1>
          <p className="page-subtitle">Economic indicators & market regime</p>
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
                <tr key={i}>
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
          <div className="quant-card-header">Correlation Matrix</div>
          <div className="p-4 overflow-x-auto">
            <table className="quant-table text-xs">
              <thead>
                <tr>
                  <th></th>
                  {correlation?.assets?.map((asset, i) => (
                    <th key={i} className="text-center">{asset}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation?.assets?.map((asset, i) => (
                  <tr key={i}>
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
        </div>
      </div>
    </div>
  );
};

// ============== WORLD INTEL MAP ==============
const WorldIntel = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API}/intel/events`);
        setEvents(res.data);
      } catch (e) {
        console.error("Error fetching intel events:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Convert lat/lng to percentage position on a world map image
  const getPosition = (lat, lng) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="world-intel">
      <div className="page-header">
        <div>
          <h1 className="page-title">World Intel Map</h1>
          <p className="page-subtitle">Global market intelligence & events</p>
        </div>
      </div>

      <div className="bento-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="intel-map-container" data-testid="intel-map">
          <img
            src="https://images.pexels.com/photos/7412026/pexels-photo-7412026.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="World Map"
            className="intel-map-bg"
          />
          {events.map((event) => (
            <div
              key={event.id}
              className={`intel-marker ${event.severity.toLowerCase()} radar-dot`}
              style={getPosition(event.lat, event.lng)}
              onClick={() => setSelectedEvent(event)}
              title={event.title}
              data-testid={`intel-marker-${event.id}`}
            />
          ))}
        </div>

        <div className="space-y-4">
          {selectedEvent && (
            <div className="quant-card" data-testid="selected-event">
              <div className="quant-card-header flex justify-between items-center">
                <span>Event Details</span>
                <button onClick={() => setSelectedEvent(null)} className="text-[#71717a] hover:text-white">
                  <XCircle size={14} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs rounded badge-${selectedEvent.severity.toLowerCase() === 'high' ? 'rejected' : selectedEvent.severity.toLowerCase() === 'medium' ? 'pending' : 'processing'}`}>
                    {selectedEvent.severity}
                  </span>
                  <span className="ml-2 text-xs text-[#71717a]">{selectedEvent.event_type}</span>
                </div>
                <h3 className="font-semibold text-[#ededed]">{selectedEvent.title}</h3>
                <p className="text-sm text-[#a1a1aa]">{selectedEvent.description}</p>
                <div className="text-xs text-[#71717a]">
                  <span>{selectedEvent.region}</span>
                </div>
              </div>
            </div>
          )}

          <div className="quant-card">
            <div className="quant-card-header">Recent Events</div>
            <div className="max-h-[400px] overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                    selectedEvent?.id === event.id ? 'bg-[#3b82f6]/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${event.severity === 'HIGH' ? 'bg-[#ef4444]' : event.severity === 'MEDIUM' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'}`} />
                    <span className="font-mono text-xs text-[#71717a]">{event.event_type}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-[#71717a] mt-1">{event.region}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== TERMINAL ==============
const Terminal = () => {
  const [history, setHistory] = useState([
    { type: 'system', content: 'QuantFlow Terminal v1.0.0' },
    { type: 'system', content: 'Type "help" for available commands.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const executeCommand = async () => {
    if (!input.trim()) return;
    
    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'input', content: cmd }]);
    setInput('');
    
    if (cmd === 'clear') {
      setHistory([{ type: 'system', content: 'Terminal cleared.' }]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/terminal/execute`, { command: cmd });
      const data = res.data;
      
      if (data.type === 'help') {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: data.commands.map(c => `  ${c.cmd.padEnd(20)} - ${c.desc}`).join('\n')
        }]);
      } else if (data.type === 'error') {
        setHistory(prev => [...prev, { type: 'error', content: data.message }]);
      } else if (data.type === 'price') {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `${data.data.symbol}: $${data.data.price} (${data.data.change >= 0 ? '+' : ''}${data.data.change_percent}%)`
        }]);
      } else if (data.type === 'regime') {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `Current Regime: ${data.data.current_regime}\nConfidence: ${(data.data.confidence * 100).toFixed(0)}%`
        }]);
      } else if (data.type === 'health') {
        const healthStr = data.data.map(h => `  ${h.service.padEnd(20)} [${h.status}] ${h.latency_ms}ms`).join('\n');
        setHistory(prev => [...prev, { type: 'output', content: healthStr }]);
      } else if (data.type === 'alerts') {
        const alertStr = data.data.map(a => `  [${a.level}] ${a.message}`).join('\n');
        setHistory(prev => [...prev, { type: 'output', content: alertStr || 'No active alerts.' }]);
      }
    } catch (e) {
      setHistory(prev => [...prev, { type: 'error', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="terminal-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Terminal</h1>
          <p className="page-subtitle">Command-line interface</p>
        </div>
      </div>

      <div className="terminal-container rounded-sm border border-[#27272a] h-[600px] flex flex-col" data-testid="terminal-container">
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {history.map((item, i) => (
            <div key={i} className={`font-mono text-sm whitespace-pre-wrap ${
              item.type === 'input' ? 'terminal-prompt' : 
              item.type === 'error' ? 'terminal-error' : 'terminal-output'
            }`}>
              {item.type === 'input' && <span className="text-[#00e676]">$ </span>}
              {item.content}
            </div>
          ))}
          {loading && <div className="terminal-output animate-pulse">Processing...</div>}
        </div>
        <div className="border-t border-[#27272a] p-4 flex items-center gap-2">
          <span className="terminal-prompt">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[#ededed]"
            placeholder="Enter command..."
            disabled={loading}
            data-testid="terminal-input"
          />
        </div>
      </div>
    </div>
  );
};

// ============== RESEARCH QUEUE ==============
const ResearchQueue = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', tags: [] });
  const [analyzing, setAnalyzing] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/research/tasks`);
      setTasks(res.data);
    } catch (e) {
      console.error("Error fetching tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async () => {
    try {
      await axios.post(`${API}/research/tasks`, newTask);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', tags: [] });
      setShowCreate(false);
      fetchTasks();
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const analyzeTask = async (taskId) => {
    setAnalyzing(taskId);
    try {
      await axios.post(`${API}/research/tasks/${taskId}/analyze`);
      fetchTasks();
    } catch (e) {
      console.error("Error analyzing task:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/research/tasks/${taskId}`);
      fetchTasks();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="research-queue">
      <div className="page-header">
        <div>
          <h1 className="page-title">Research Queue</h1>
          <p className="page-subtitle">AI-powered research analysis</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-task-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Task</span>
        </button>
      </div>

      {showCreate && (
        <div className="quant-card mb-6" data-testid="create-task-form">
          <div className="quant-card-header">Create Research Task</div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm"
              data-testid="task-title-input"
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm min-h-[100px]"
              data-testid="task-description-input"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-3 py-2 rounded-sm text-sm"
              data-testid="task-priority-select"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button onClick={createTask} className="btn-quant btn-quant-approve px-4 py-2" data-testid="submit-task-btn">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-quant px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="quant-card p-8 text-center text-[#71717a]">
            No research tasks. Create one to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="quant-card" data-testid={`task-${task.id}`}>
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded badge-${task.status.toLowerCase()}`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-[#71717a]">{task.priority}</span>
                </div>
                <div className="flex gap-2">
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => analyzeTask(task.id)}
                      disabled={analyzing === task.id}
                      className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                      data-testid={`analyze-btn-${task.id}`}
                    >
                      {analyzing === task.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      Analyze
                    </button>
                  )}
                  <button onClick={() => deleteTask(task.id)} className="btn-quant btn-quant-reject px-2 py-1" data-testid={`delete-btn-${task.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[#ededed] mb-2">{task.title}</h3>
                <p className="text-sm text-[#a1a1aa] mb-3">{task.description}</p>
                {task.ai_analysis && (
                  <div className="bg-[#000] border border-[#27272a] rounded-sm p-3 mt-3">
                    <div className="text-xs text-[#71717a] mb-2 uppercase">AI Analysis</div>
                    <p className="text-sm text-[#ededed] whitespace-pre-wrap">{task.ai_analysis}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============== APPROVALS ==============
const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get(`${API}/approvals`);
      setApprovals(res.data);
    } catch (e) {
      console.error("Error fetching approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await axios.post(`${API}/approvals/${id}/action`, { action });
      fetchApprovals();
    } catch (e) {
      console.error("Error processing approval:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="approvals-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Review & approve pending requests</p>
        </div>
      </div>

      <div className="quant-card">
        <table className="quant-table" data-testid="approvals-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Request</th>
              <th>Requester</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr key={approval.id} data-testid={`approval-${approval.id}`}>
                <td>
                  <span className="px-2 py-1 text-xs bg-[#27272a] rounded">{approval.type}</span>
                </td>
                <td>
                  <div>
                    <p className="font-medium">{approval.title}</p>
                    <p className="text-xs text-[#71717a]">{approval.description}</p>
                  </div>
                </td>
                <td>{approval.requester}</td>
                <td>{approval.amount ? `$${(approval.amount / 1000).toFixed(0)}K` : '-'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${approval.risk_score > 0.6 ? 'bg-[#ef4444]' : approval.risk_score > 0.3 ? 'bg-[#f59e0b]' : 'bg-[#00e676]'}`} />
                    <span>{(approval.risk_score * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded badge-${approval.status.toLowerCase()}`}>
                    {approval.status}
                  </span>
                </td>
                <td>
                  {approval.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(approval.id, 'approve')}
                        className="btn-quant btn-quant-approve px-3 py-1 text-xs"
                        data-testid={`approve-btn-${approval.id}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(approval.id, 'reject')}
                        className="btn-quant btn-quant-reject px-3 py-1 text-xs"
                        data-testid={`reject-btn-${approval.id}`}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== SYSTEM HEALTH ==============
const SystemHealth = () => {
  const [health, setHealth] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const [healthRes, alertsRes] = await Promise.all([
        axios.get(`${API}/system/health`),
        axios.get(`${API}/system/alerts`)
      ]);
      setHealth(healthRes.data);
      setAlerts(alertsRes.data);
    } catch (e) {
      console.error("Error fetching health:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingState />;

  const healthyCount = health.filter(h => h.status === 'HEALTHY').length;

  return (
    <div data-testid="system-health">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="page-subtitle">Infrastructure monitoring & alerts</p>
        </div>
        <button onClick={fetchHealth} className="btn-quant px-3 py-2 flex items-center gap-2">
          <RefreshCw size={14} strokeWidth={1.5} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bento-grid bento-grid-4 mb-6">
        <MetricCard label="Services Healthy" value={`${healthyCount}/${health.length}`} />
        <MetricCard label="Avg Latency" value={`${(health.reduce((a, b) => a + b.latency_ms, 0) / health.length).toFixed(0)}ms`} />
        <MetricCard label="Active Alerts" value={alerts.length} />
        <MetricCard label="System Uptime" value="99.9%" />
      </div>

      {alerts.length > 0 && (
        <div className="quant-card mb-6" data-testid="alerts-card">
          <div className="quant-card-header flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#f59e0b]" />
            <span>Active Alerts</span>
          </div>
          <div className="p-4 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-3 p-2 rounded ${alert.level === 'WARNING' ? 'bg-[#f59e0b]/10' : 'bg-[#3b82f6]/10'}`}>
                {alert.level === 'WARNING' ? <AlertTriangle size={14} className="text-[#f59e0b]" /> : <Bell size={14} className="text-[#3b82f6]" />}
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quant-card">
        <div className="quant-card-header">Service Status</div>
        <table className="quant-table" data-testid="health-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
              <th>Latency</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {health.map((svc, i) => (
              <tr key={i}>
                <td className="font-medium">{svc.service}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${svc.status === 'HEALTHY' ? 'status-healthy' : svc.status === 'DEGRADED' ? 'status-degraded' : 'status-down'}`} />
                    <span>{svc.status}</span>
                  </div>
                </td>
                <td>{svc.latency_ms}ms</td>
                <td>{svc.cpu_usage}%</td>
                <td>{svc.memory_usage}%</td>
                <td>{svc.uptime_hours.toFixed(0)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== AUTOMATION V1 (Rule-based) ==============
const AutomationV1 = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    condition_type: 'PRICE_ABOVE',
    condition_value: 0,
    action_type: 'ALERT',
    action_value: ''
  });

  const fetchRules = async () => {
    try {
      const res = await axios.get(`${API}/automation/rules`);
      setRules(res.data);
    } catch (e) {
      console.error("Error fetching rules:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const createRule = async () => {
    try {
      await axios.post(`${API}/automation/rules`, newRule);
      setNewRule({ name: '', condition_type: 'PRICE_ABOVE', condition_value: 0, action_type: 'ALERT', action_value: '' });
      setShowCreate(false);
      fetchRules();
    } catch (e) {
      console.error("Error creating rule:", e);
    }
  };

  const toggleRule = async (id) => {
    try {
      await axios.put(`${API}/automation/rules/${id}/toggle`);
      fetchRules();
    } catch (e) {
      console.error("Error toggling rule:", e);
    }
  };

  const deleteRule = async (id) => {
    try {
      await axios.delete(`${API}/automation/rules/${id}`);
      fetchRules();
    } catch (e) {
      console.error("Error deleting rule:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="automation-v1">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automation V1</h1>
          <p className="page-subtitle">Simple rule-based automation</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-rule-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Rule</span>
        </button>
      </div>

      {showCreate && (
        <div className="quant-card mb-6" data-testid="create-rule-form">
          <div className="quant-card-header">Create Automation Rule</div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Rule Name"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm"
              data-testid="rule-name-input"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#71717a] block mb-1">IF Condition</label>
                <select
                  value={newRule.condition_type}
                  onChange={(e) => setNewRule({ ...newRule, condition_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                >
                  <option value="PRICE_ABOVE">Price Above</option>
                  <option value="PRICE_BELOW">Price Below</option>
                  <option value="VOLUME_SPIKE">Volume Spike</option>
                  <option value="VOLATILITY_HIGH">Volatility High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#71717a] block mb-1">Value</label>
                <input
                  type="number"
                  value={newRule.condition_value}
                  onChange={(e) => setNewRule({ ...newRule, condition_value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#71717a] block mb-1">THEN Action</label>
                <select
                  value={newRule.action_type}
                  onChange={(e) => setNewRule({ ...newRule, action_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                >
                  <option value="ALERT">Send Alert</option>
                  <option value="BUY">Buy Order</option>
                  <option value="SELL">Sell Order</option>
                  <option value="HEDGE">Hedge Position</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#71717a] block mb-1">Action Details</label>
                <input
                  type="text"
                  placeholder="e.g., BTC/USD"
                  value={newRule.action_value}
                  onChange={(e) => setNewRule({ ...newRule, action_value: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createRule} className="btn-quant btn-quant-approve px-4 py-2" data-testid="submit-rule-btn">Create Rule</button>
              <button onClick={() => setShowCreate(false)} className="btn-quant px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="quant-card p-8 text-center text-[#71717a]">
            No automation rules. Create one to get started.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="quant-card" data-testid={`rule-${rule.id}`}>
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-[#00e676]' : 'bg-[#71717a]'}`} />
                  <span className="font-medium">{rule.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                    data-testid={`toggle-rule-${rule.id}`}
                  >
                    {rule.enabled ? <Pause size={12} /> : <Play size={12} />}
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="btn-quant btn-quant-reject px-2 py-1" data-testid={`delete-rule-${rule.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="font-mono text-sm">
                  <span className="text-[#3b82f6]">IF</span>{' '}
                  <span className="text-[#f59e0b]">{rule.condition_type}</span>{' '}
                  <span className="text-[#ededed]">{rule.condition_value}</span>{' '}
                  <span className="text-[#3b82f6]">THEN</span>{' '}
                  <span className="text-[#00e676]">{rule.action_type}</span>{' '}
                  <span className="text-[#ededed]">{rule.action_value}</span>
                </div>
                <div className="text-xs text-[#71717a] mt-2">
                  Triggered: {rule.triggered_count} times
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============== AUTOMATION V2 (Strategy/Code-based) ==============
const AutomationV2 = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [code, setCode] = useState('');

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${API}/automation/strategies`);
      setStrategies(res.data);
    } catch (e) {
      console.error("Error fetching strategies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const createStrategy = async () => {
    try {
      const newStrategy = {
        name: `Strategy ${strategies.length + 1}`,
        code: `# New Trading Strategy\n\ndef on_data(data):\n    # Your strategy logic here\n    pass\n\ndef on_trade(trade):\n    pass`,
        language: 'python'
      };
      const res = await axios.post(`${API}/automation/strategies`, newStrategy);
      fetchStrategies();
      setSelectedStrategy(res.data);
      setCode(res.data.code);
    } catch (e) {
      console.error("Error creating strategy:", e);
    }
  };

  const saveStrategy = async () => {
    if (!selectedStrategy) return;
    try {
      await axios.put(`${API}/automation/strategies/${selectedStrategy.id}`, {
        ...selectedStrategy,
        code
      });
      fetchStrategies();
    } catch (e) {
      console.error("Error saving strategy:", e);
    }
  };

  const toggleStrategy = async (id) => {
    try {
      await axios.put(`${API}/automation/strategies/${id}/toggle`);
      fetchStrategies();
    } catch (e) {
      console.error("Error toggling strategy:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="automation-v2">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automation V2</h1>
          <p className="page-subtitle">Advanced strategy development</p>
        </div>
        <button onClick={createStrategy} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-strategy-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Strategy</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Strategy List */}
        <div className="col-span-3 quant-card" data-testid="strategy-list">
          <div className="quant-card-header">Strategies</div>
          <div className="max-h-[600px] overflow-y-auto">
            {strategies.length === 0 ? (
              <div className="p-4 text-center text-[#71717a] text-sm">No strategies yet</div>
            ) : (
              strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => { setSelectedStrategy(strategy); setCode(strategy.code); }}
                  className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 ${
                    selectedStrategy?.id === strategy.id ? 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]' : ''
                  }`}
                  data-testid={`strategy-${strategy.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{strategy.name}</span>
                    <div className={`w-2 h-2 rounded-full ${strategy.enabled ? 'bg-[#00e676]' : 'bg-[#71717a]'}`} />
                  </div>
                  <div className="text-xs text-[#71717a] mt-1">{strategy.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="col-span-9 space-y-4">
          {selectedStrategy ? (
            <>
              <div className="quant-card">
                <div className="quant-card-header flex justify-between items-center">
                  <span>{selectedStrategy.name} - {selectedStrategy.language.toUpperCase()}</span>
                  <div className="flex gap-2">
                    <button onClick={saveStrategy} className="btn-quant btn-quant-approve px-3 py-1 text-xs" data-testid="save-strategy-btn">
                      Save
                    </button>
                    <button
                      onClick={() => toggleStrategy(selectedStrategy.id)}
                      className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                      data-testid="toggle-strategy-btn"
                    >
                      {selectedStrategy.enabled ? <Pause size={12} /> : <Play size={12} />}
                      {selectedStrategy.enabled ? 'Stop' : 'Deploy'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="code-editor w-full"
                  style={{ minHeight: '400px' }}
                  spellCheck={false}
                  data-testid="code-editor"
                />
              </div>
              <div className="quant-card">
                <div className="quant-card-header">Debug Console</div>
                <div className="p-4 terminal-container min-h-[150px] font-mono text-sm">
                  <div className="text-[#71717a]">[{new Date().toISOString()}] Strategy loaded: {selectedStrategy.name}</div>
                  <div className="text-[#00e676]">[{new Date().toISOString()}] Ready for deployment</div>
                </div>
              </div>
            </>
          ) : (
            <div className="quant-card p-12 text-center text-[#71717a]">
              Select a strategy or create a new one to start coding
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== HELPER COMPONENTS ==============
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <RefreshCw className="animate-spin text-[#3b82f6]" size={24} />
  </div>
);

const MetricCard = ({ label, value, change, badge, badgeType }) => (
  <div className="metric-card" data-testid={`metric-${label?.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="metric-label">{label}</div>
    {badge ? (
      <div className={`regime-indicator text-sm ${badgeType === 'profit' ? 'risk-on' : 'risk-off'}`}>
        {value}
      </div>
    ) : (
      <div className="metric-value">{value}</div>
    )}
    {change !== undefined && (
      <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
        {change >= 0 ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
        {change >= 0 ? '+' : ''}{change}%
      </div>
    )}
  </div>
);

const ActionItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={14} strokeWidth={1.5} className="text-[#71717a]" />
      <span className="text-sm text-[#a1a1aa]">{label}</span>
    </div>
    <span className="font-mono text-sm font-medium">{value}</span>
  </div>
);

const QuickNavCard = ({ title, desc, path, icon: Icon }) => (
  <NavLink to={path} className="quant-card p-4 hover:border-[#3b82f6] transition-colors" data-testid={`quicknav-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
        <Icon size={18} className="text-[#3b82f6]" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-medium text-[#ededed]">{title}</h3>
        <p className="text-xs text-[#71717a]">{desc}</p>
      </div>
    </div>
  </NavLink>
);

const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-[#71717a]">{label}</span>
    <span className="font-mono text-sm">{value}</span>
  </div>
);

// ============== MAIN APP ==============
function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-container">
      <BrowserRouter>
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<HubPage />} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/dashboard" element={<QuantDashboard />} />
            <Route path="/macro" element={<MacroRegime />} />
            <Route path="/intel" element={<WorldIntel />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/research" element={<ResearchQueue />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/health" element={<SystemHealth />} />
            <Route path="/automation-v1" element={<AutomationV1 />} />
            <Route path="/automation-v2" element={<AutomationV2 />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
