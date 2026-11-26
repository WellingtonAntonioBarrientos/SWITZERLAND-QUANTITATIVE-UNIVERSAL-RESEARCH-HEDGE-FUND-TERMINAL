import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bell, RefreshCw, ArrowUpRight, ArrowDownRight, FileText, CheckCircle } from "lucide-react";
import { API, logError } from '../lib/config';

const TYPE_STYLES = {
  ENTERED: { cls: "bg-[#00e676]/15 text-[#00e676] border-[#00e676]/30", Icon: ArrowUpRight },
  EXITED: { cls: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30", Icon: ArrowDownRight },
  NEW_FILING: { cls: "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30", Icon: FileText },
};

export const FundAlerts = ({ isBloomberg, onUnreadChange }) => {
  const [alerts, setAlerts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/alerts`);
      setAlerts(res.data.alerts || []);
      onUnreadChange?.(res.data.unread_count || 0);
      setLoaded(true);
    } catch (e) {
      logError("Error fetching alerts:", e);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const runCheck = async () => {
    setChecking(true);
    try {
      await axios.post(`${API}/alerts/run-check`);
      await fetchAlerts();
    } catch (e) {
      logError("Error running 13F check:", e);
    } finally {
      setChecking(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/alerts/mark-read`);
      await fetchAlerts();
    } catch (e) {
      logError("Error marking alerts read:", e);
    }
  };

  const unread = alerts.filter(a => !a.read).length;

  return (
    <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`} data-testid="fund-alerts-panel">
      <div className={`quant-card-header flex items-center justify-between ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
        <span className="flex items-center gap-2"><Bell size={14} /> FUND ALERTS — 13F POSITION CHANGES</span>
        <span className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[10px] underline opacity-80 hover:opacity-100" data-testid="alerts-mark-read">
              Mark all read ({unread})
            </button>
          )}
          <button
            onClick={runCheck}
            disabled={checking}
            className="text-[10px] px-2 py-1 border border-current rounded-sm flex items-center gap-1 hover:opacity-80"
            data-testid="alerts-check-now"
          >
            <RefreshCw size={10} className={checking ? 'animate-spin' : ''} /> {checking ? 'Checking...' : 'Check Now'}
          </button>
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto" data-testid="alerts-list">
        {loaded && alerts.length === 0 && (
          <div className="p-6 text-center text-xs text-[#71717a] flex flex-col items-center gap-2">
            <CheckCircle size={18} className="text-[#00e676]" />
            No position changes detected yet. The system checks filings daily and alerts you when a fund enters or exits a position.
          </div>
        )}
        {alerts.map(a => {
          const style = TYPE_STYLES[a.type] || TYPE_STYLES.NEW_FILING;
          const { Icon } = style;
          return (
            <div key={a.alert_id} className={`flex items-start gap-3 p-3 border-b border-[#27272a]/60 ${!a.read ? 'bg-[#3b82f6]/5' : ''}`} data-testid="alert-row">
              <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded border flex items-center gap-1 shrink-0 ${style.cls}`}>
                <Icon size={10} /> {a.type.replace('_', ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#ededed]">{a.message}</div>
                <div className="text-[10px] text-[#71717a] mt-0.5">
                  {a.fund_name} · {a.quarter} · {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
              {!a.read && <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0 mt-1" data-testid="alert-unread-dot"></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
