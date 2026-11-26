import { NavLink } from "react-router-dom";
import { RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <RefreshCw className="animate-spin text-[#3b82f6]" size={24} />
  </div>
);

export const MetricCard = ({ label, value, change, badge, badgeType }) => (
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

export const ActionItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={14} strokeWidth={1.5} className="text-[#71717a]" />
      <span className="text-sm text-[#a1a1aa]">{label}</span>
    </div>
    <span className="font-mono text-sm font-medium">{value}</span>
  </div>
);

export const QuickNavCard = ({ title, desc, path, icon: Icon }) => (
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

export const StatRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-[#71717a]">{label}</span>
    <span className="font-mono text-sm">{value}</span>
  </div>
);

