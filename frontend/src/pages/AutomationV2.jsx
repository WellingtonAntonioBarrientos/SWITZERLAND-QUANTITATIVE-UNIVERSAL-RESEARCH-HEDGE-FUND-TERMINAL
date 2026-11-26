import { useState, useEffect } from "react";
import axios from "axios";
import { Play, Pause, Plus } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

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
      logError("Error fetching strategies:", e);
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
      logError("Error creating strategy:", e);
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
      logError("Error saving strategy:", e);
    }
  };

  const toggleStrategy = async (id) => {
    try {
      await axios.put(`${API}/automation/strategies/${id}/toggle`);
      fetchStrategies();
    } catch (e) {
      logError("Error toggling strategy:", e);
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

export default AutomationV2;
