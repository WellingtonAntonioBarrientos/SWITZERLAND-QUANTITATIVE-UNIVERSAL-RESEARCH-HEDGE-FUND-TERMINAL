import { useState } from "react";
import axios from "axios";
import { API } from '../lib/config';

const Terminal = () => {
  const [history, setHistory] = useState([
    { type: 'system', content: 'SQURHFT Terminal v1.0.0 — Switzerland Quantitative Universal Research Hedge Terminal' },
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

export default Terminal;
