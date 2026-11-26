import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Globe, FileSearch, CheckSquare, Activity, Zap, Code2, Home, TrendingUp, ChevronLeft, ChevronRight, Settings, Briefcase, FileText, Map, Bot, Workflow, DollarSign, Terminal as TerminalIcon } from "lucide-react";

export const Sidebar = ({ collapsed, setCollapsed, viewMode, setViewMode }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/dashboard", icon: Home, label: "Hub" },
    { path: "/paper-trading", icon: DollarSign, label: "Paper Trading" },
    { path: "/strategies", icon: Briefcase, label: "Strategies" },
    { path: "/sec-filings", icon: FileText, label: "13F SEC Filings" },
    { path: "/heatmap", icon: Map, label: "Global Heatmap" },
    { path: "/quant", icon: LayoutDashboard, label: "Quant Dashboard" },
    { path: "/macro", icon: TrendingUp, label: "Macro Regime" },
    { path: "/intel", icon: Globe, label: "World Intel" },
    { path: "/terminal", icon: TerminalIcon, label: "Terminal" },
  ];
  
  const workflowItems = [
    { path: "/research", icon: FileSearch, label: "Research Queue" },
    { path: "/approvals", icon: CheckSquare, label: "Approvals" },
    { path: "/health", icon: Activity, label: "System Health" },
    { path: "/profile", icon: Settings, label: "Profile" },
  ];
  
  const automationItems = [
    { path: "/automation-hub", icon: Bot, label: "Automation Hub" },
    { path: "/funds-paper-trading", icon: DollarSign, label: "Funds Paper Trading 1.0" },
    { path: "/automation-v1", icon: Zap, label: "Automation V1" },
    { path: "/automation-v2", icon: Code2, label: "Automation V2" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} data-testid="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" data-testid="brand-logo">SQ</div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="sidebar-title block" data-testid="brand-title">SQURHFT</span>
            <span className="block text-[8px] leading-tight text-[#71717a] uppercase tracking-wider" data-testid="brand-fullname">Switzerland Quantitative Universal Research Hedge Terminal</span>
          </div>
        )}
      </div>
      {!collapsed && (
        <div className="px-3 py-1.5 border-b border-[#27272a] text-[9px] text-[#71717a] italic" data-testid="brand-owner">
          by Wellington Antonio Barrientos
        </div>
      )}
      
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
      
      <div className="p-2 border-t border-[#27272a] space-y-2">
        {!collapsed && (
          <>
            <div className="px-1 mb-2">
              <div className="text-[9px] uppercase text-[#71717a] mb-1.5">View Mode</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('modern')}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-all ${viewMode === 'modern' ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'border-[#27272a] text-[#71717a] hover:border-[#3b82f6]'}`}
                  data-testid="view-mode-modern"
                >
                  Modern
                </button>
                <button
                  onClick={() => setViewMode('wellington')}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-all ${viewMode === 'wellington' ? 'bg-[#ff6600] border-[#ff6600] text-black' : 'border-[#27272a] text-[#71717a] hover:border-[#ff6600]'}`}
                  data-testid="view-mode-wellington"
                >
                  Wellington
                </button>
                <button
                  onClick={() => setViewMode('nautical')}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-all ${viewMode === 'nautical' ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white' : 'border-[#27272a] text-[#71717a] hover:border-[#0ea5e9]'}`}
                  data-testid="view-mode-nautical"
                >
                  Nautical
                </button>
              </div>
            </div>
          </>
        )}
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
