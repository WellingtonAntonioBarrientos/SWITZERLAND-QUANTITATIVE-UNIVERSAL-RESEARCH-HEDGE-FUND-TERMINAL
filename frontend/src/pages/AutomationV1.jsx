import { useState, useEffect } from "react";
import axios from "axios";
import { Play, Pause, Trash2, Plus, Send } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

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
      logError("Error fetching rules:", e);
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
      logError("Error creating rule:", e);
    }
  };

  const toggleRule = async (id) => {
    try {
      await axios.put(`${API}/automation/rules/${id}/toggle`);
      fetchRules();
    } catch (e) {
      logError("Error toggling rule:", e);
    }
  };

  const deleteRule = async (id) => {
    try {
      await axios.delete(`${API}/automation/rules/${id}`);
      fetchRules();
    } catch (e) {
      logError("Error deleting rule:", e);
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

export default AutomationV1;
