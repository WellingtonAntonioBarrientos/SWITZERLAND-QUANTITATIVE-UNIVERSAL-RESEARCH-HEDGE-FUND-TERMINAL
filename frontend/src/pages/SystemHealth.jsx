import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, RefreshCw, AlertTriangle } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState, MetricCard } from '../components/Shared';

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
      logError("Error fetching health:", e);
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
              <tr key={svc.service}>
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

export default SystemHealth;
