import { useState, useEffect } from "react";
import axios from "axios";
import { Code2, Send, Target, Brain } from "lucide-react";
import { Bar } from "recharts";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

const PaperTradingPage = ({ viewMode }) => {
  const [account, setAccount] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderForm, setOrderForm] = useState({
    orderType: 'MARKET',
    side: 'BUY',
    quantity: 100,
    limitPrice: ''
  });
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Wellington AI states
  const [wellingtonChat, setWellingtonChat] = useState([]);
  const [wellingtonInput, setWellingtonInput] = useState('');
  const [wellingtonThinking, setWellingtonThinking] = useState(false);
  const [showWellington, setShowWellington] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);
  const [wellingtonAnalysis, setWellingtonAnalysis] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [roiTarget, setRoiTarget] = useState(50);
  const [wellingtonModel, setWellingtonModel] = useState('claude-sonnet-4-6');
  const [wellingtonModels, setWellingtonModels] = useState([]);

  useEffect(() => {
    fetchAccountData();
    fetchWatchlist();
    axios.get(`${API}/wellington/models`).then(res => {
      setWellingtonModels(res.data.models || []);
      if (res.data.default) setWellingtonModel(res.data.default);
    }).catch(() => {});
    const interval = setInterval(() => {
      fetchAccountData();
      fetchWatchlist();
    }, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: fetchers are stable, interval handles refresh
  }, []);

  const fetchAccountData = async () => {
    try {
      const res = await axios.get(`${API}/paper-trading/account`);
      setAccount(res.data);
    } catch (e) {
      logError("Error fetching account:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API}/paper-trading/watchlist`);
      setWatchlist(res.data);
    } catch (e) {
      logError("Error fetching watchlist:", e);
    }
  };

  const placeOrder = async () => {
    if (!selectedStock) return;
    
    setPlacing(true);
    setMessage(null);
    
    try {
      const orderData = {
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        order_type: orderForm.orderType,
        side: orderForm.side,
        quantity: parseInt(orderForm.quantity),
        price: orderForm.orderType === 'LIMIT' ? parseFloat(orderForm.limitPrice) : null,
        hedge_fund: selectedStock.hedge_fund
      };
      
      const res = await axios.post(`${API}/paper-trading/order`, orderData);
      setMessage({ type: 'success', text: res.data.message });
      
      // Refresh data
      await fetchAccountData();
      
      // Reset form
      setOrderForm({ orderType: 'MARKET', side: 'BUY', quantity: 100, limitPrice: '' });
    } catch (e) {
      // Handle error - ensure it's always a string
      let errorMsg = 'Order failed';
      if (e.response?.data?.detail) {
        const detail = e.response.data.detail;
        // If detail is an array (validation errors), extract message
        if (Array.isArray(detail)) {
          errorMsg = detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object') {
          errorMsg = detail.msg || JSON.stringify(detail);
        }
      } else if (e.message) {
        errorMsg = e.message;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setPlacing(false);
    }
  };

  const resetAccount = async () => {
    if (!window.confirm('Reset your paper trading account to $100,000,000? All positions and order history will be cleared.')) {
      return;
    }
    
    try {
      await axios.post(`${API}/paper-trading/reset`, { confirm: 'RESET-ACCOUNT' });
      setMessage({ type: 'success', text: 'Account reset successfully!' });
      await fetchAccountData();
    } catch (e) {
      setMessage({ type: 'error', text: 'Reset failed' });
    }
  };

  // Wellington AI Functions
  const sendWellingtonMessage = async () => {
    if (!wellingtonInput.trim() && !uploadedFile && !uploadedImage && !urlInput) return;
    
    const userMsg = wellingtonInput || 'Analyze the uploaded content';
    setWellingtonInput('');
    setWellingtonChat(prev => [...prev, { 
      role: 'user', 
      content: userMsg,
      hasFile: !!uploadedFile,
      hasImage: !!uploadedImage,
      hasUrl: !!urlInput
    }]);
    setWellingtonThinking(true);
    
    try {
      let response;
      
      // Handle image upload
      if (uploadedImage) {
        const formData = new FormData();
        formData.append('file', uploadedImage);
        formData.append('prompt', userMsg);
        
        const res = await axios.post(`${API}/wellington/upload-image`, formData);
        response = res.data.analysis;
        setUploadedImage(null);
      }
      // Handle file upload
      else if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('filename', uploadedFile.name);
        
        const res = await axios.post(`${API}/wellington/upload-file`, formData);
        response = res.data.analysis;
        setUploadedFile(null);
      }
      // Handle URL analysis
      else if (urlInput) {
        const formData = new FormData();
        formData.append('url', urlInput);
        
        const res = await axios.post(`${API}/wellington/analyze-url`, formData);
        response = res.data.analysis;
        setUrlInput('');
      }
      // Regular chat — streaming via SSE
      else {
        setWellingtonChat(prev => [...prev, { role: 'assistant', content: '', streaming: true, model: wellingtonModel }]);
        const updateLast = (patch) => setWellingtonChat(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], ...patch };
          return next;
        });
        const appendLast = (text) => setWellingtonChat(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: (last.content || '') + text };
          return next;
        });

        const resp = await fetch(`${API}/wellington/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, include_context: true, model: wellingtonModel })
        });
        if (!resp.ok || !resp.body) throw new Error(`Stream failed (${resp.status})`);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finished = false;
        while (!finished) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop();
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;
            let evt;
            try { evt = JSON.parse(line.slice(5)); } catch { continue; }
            if (evt.type === 'start') {
              updateLast({ mode: evt.mode_used, model: evt.model_used });
            } else if (evt.type === 'delta') {
              appendLast(evt.content);
            } else if (evt.type === 'done') {
              updateLast({
                streaming: false,
                mode: evt.mode_used,
                model: evt.model_used || wellingtonModel,
                ...(evt.response ? { content: evt.response } : {}),
                thinking: evt.thinking || '',
                code: evt.code || ''
              });
              finished = true;
            } else if (evt.type === 'error') {
              updateLast({ streaming: false, role: 'error', content: evt.message || 'Wellington AI request failed' });
              finished = true;
            }
          }
        }
        updateLast({ streaming: false });
        setWellingtonThinking(false);
        return;
      }
      
      setWellingtonChat(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }]);
    } catch (e) {
      setWellingtonChat(prev => [...prev, { 
        role: 'error', 
        content: 'Error communicating with Wellington AI: ' + (e.response?.data?.error || e.message)
      }]);
    } finally {
      setWellingtonThinking(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setWellingtonInput(prev => prev || 'Analyze this chart/image');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setWellingtonInput(prev => prev || 'Analyze this document');
    }
  };

  const getWellingtonAnalysis = async () => {
    setWellingtonThinking(true);
    try {
      const res = await axios.post(`${API}/wellington/analyze?roi_target=${roiTarget}`);
      setWellingtonAnalysis(res.data);
      setMessage({ 
        type: 'success', 
        text: `Wellington AI analyzed for ${roiTarget}% ROI target! Check recommendations below.` 
      });
    } catch (e) {
      setMessage({ type: 'error', text: 'Analysis failed' });
    } finally {
      setWellingtonThinking(false);
    }
  };

  const startAutoTrading = async () => {
    const roiText = roiTarget >= 1000 ? 'UNLIMITED (>1000%)' : `${roiTarget}%`;
    if (!window.confirm(`Start Wellington AI autonomous trading with ${roiText} ROI target using $500 allocation?`)) return;
    
    setAutoTrading(true);
    try {
      const res = await axios.post(`${API}/wellington/auto-trade?roi_target=${roiTarget}`);
      
      if (res.data.error) {
        setMessage({ type: 'error', text: res.data.error });
      } else {
        setMessage({ 
          type: 'success', 
          text: `Wellington AI executed ${res.data.trades_executed} trades targeting ${roiText} ROI!` 
        });
        setWellingtonAnalysis(res.data.analysis);
        await fetchAccountData();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Auto-trading failed' });
    } finally {
      setAutoTrading(false);
    }
  };

  if (loading) return <LoadingState />;

  const isBloomberg = viewMode === 'wellington';
  const totalValue = account?.total_value || 0;
  const cashBalance = account?.cash_balance || 0;
  const totalPL = account?.total_pl || 0;
  const totalPLPercent = account?.total_pl_percent || 0;

  return (
    <div data-testid="paper-trading-page" className={isBloomberg ? 'font-mono' : ''}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">PAPER TRADING</h1>
          <p className="page-subtitle">Virtual Trading Simulator - Practice Without Risk</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWellington(!showWellington)}
            className={`btn-quant px-4 py-2 text-xs ${showWellington ? 'bg-[#00e676]' : ''}`}
          >
            <Brain size={16} className="inline mr-2" />
            Wellington AI
          </button>
          <button
            onClick={resetAccount}
            className="btn-quant px-4 py-2 text-xs"
          >
            Reset Account
          </button>
        </div>
      </div>

      {/* Account Summary Bar */}
      <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
        <div className="p-4 grid grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-[#71717a] uppercase mb-1">Account Value</div>
            <div className="text-2xl font-mono">${(totalValue / 1e6).toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-xs text-[#71717a] uppercase mb-1">Cash Balance</div>
            <div className="text-2xl font-mono">${(cashBalance / 1e6).toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-xs text-[#71717a] uppercase mb-1">Buying Power</div>
            <div className="text-2xl font-mono text-[#0ea5e9]">${(cashBalance / 1e6).toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-xs text-[#71717a] uppercase mb-1">Total P&L</div>
            <div className={`text-2xl font-mono ${totalPL >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalPL >= 0 ? '+' : ''}${(totalPL / 1e6).toFixed(2)}M
            </div>
          </div>
          <div>
            <div className="text-xs text-[#71717a] uppercase mb-1">Return %</div>
            <div className={`text-2xl font-mono ${totalPLPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%
            </div>
          </div>
        </div>


      {/* Wellington AI Panel */}
      {showWellington && (
        <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#00e676]/50' : 'border-[#00e676]/50'}`}>
          <div className="quant-card-header bg-gradient-to-r from-[#00e676] to-[#00bcd4] text-black">
            <Brain size={20} className="inline mr-2" />
            Wellington AI - Financial Supercomputer
          </div>
          <div className="p-4">
            {/* ROI Target Selection */}
            <div className="mb-4 p-3 bg-[#18181b] rounded border border-[#00e676]/30">
              <div className="text-xs text-[#00e676] font-semibold mb-2 uppercase">🎯 Select ROI Target:</div>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => setRoiTarget(50)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                    roiTarget === 50 
                      ? 'bg-[#3b82f6] text-white scale-105' 
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3b82f6]/50'
                  }`}
                >
                  50%<br/>
                  <span className="text-[10px] opacity-70">Moderate</span>
                </button>
                <button
                  onClick={() => setRoiTarget(60)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                    roiTarget === 60 
                      ? 'bg-[#10b981] text-white scale-105' 
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#10b981]/50'
                  }`}
                >
                  60%<br/>
                  <span className="text-[10px] opacity-70">Balanced</span>
                </button>
                <button
                  onClick={() => setRoiTarget(80)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                    roiTarget === 80 
                      ? 'bg-[#f59e0b] text-white scale-105' 
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#f59e0b]/50'
                  }`}
                >
                  80%<br/>
                  <span className="text-[10px] opacity-70">Aggressive</span>
                </button>
                <button
                  onClick={() => setRoiTarget(100)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                    roiTarget === 100 
                      ? 'bg-[#ef4444] text-white scale-105' 
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#ef4444]/50'
                  }`}
                >
                  100%<br/>
                  <span className="text-[10px] opacity-70">Very Agg.</span>
                </button>
                <button
                  onClick={() => setRoiTarget(1000)}
                  className={`py-2 px-3 rounded text-xs font-semibold transition-all ${
                    roiTarget === 1000 
                      ? 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white scale-105 animate-pulse' 
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-gradient-to-r hover:from-[#ec4899]/50 hover:to-[#8b5cf6]/50'
                  }`}
                >
                  🚀 UNLIMITED<br/>
                  <span className="text-[10px] opacity-70">&gt;1000%</span>
                </button>
              </div>
              <div className="mt-2 text-center text-xs text-[#71717a]">
                Selected: <span className={`font-mono font-bold ${
                  roiTarget >= 1000 ? 'text-[#ec4899]' : 
                  roiTarget >= 100 ? 'text-[#ef4444]' : 
                  roiTarget >= 80 ? 'text-[#f59e0b]' : 
                  roiTarget >= 60 ? 'text-[#10b981]' : 'text-[#3b82f6]'
                }`}>
                  {roiTarget >= 1000 ? 'UNLIMITED (>1000%)' : `${roiTarget}% ROI Target`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={getWellingtonAnalysis}
                disabled={wellingtonThinking}
                className="btn-quant py-2 text-sm bg-[#00e676] hover:bg-[#00e676]/80 text-black"
              >
                {wellingtonThinking ? 'Analyzing...' : 'Analyze Watchlist'}
              </button>
              <button
                onClick={startAutoTrading}
                disabled={autoTrading || wellingtonThinking}
                className="btn-quant py-2 text-sm bg-[#ff6b6b] hover:bg-[#ff6b6b]/80"
              >
                {autoTrading ? 'Trading...' : 'Start Auto-Trading ($500)'}
              </button>
              <div className="text-xs text-[#71717a] flex items-center justify-center">
                AI Status: {wellingtonThinking ? '🟡 Thinking' : '🟢 Ready'}
              </div>
            </div>

            {/* Wellington Analysis Display */}
            {wellingtonAnalysis && (
              <div className="mb-4 p-3 bg-[#18181b] rounded border border-[#00e676]/30">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-semibold text-[#00e676]">AI Recommendations:</div>
                  {wellingtonAnalysis.risk_profile && (
                    <div className={`px-2 py-1 text-xs rounded ${
                      wellingtonAnalysis.risk_profile.includes('ULTRA') ? 'bg-[#ec4899]/20 text-[#ec4899]' :
                      wellingtonAnalysis.risk_profile.includes('VERY') ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                      wellingtonAnalysis.risk_profile.includes('AGGRESSIVE') ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                      'bg-[#3b82f6]/20 text-[#3b82f6]'
                    }`}>
                      {wellingtonAnalysis.risk_profile}
                    </div>
                  )}
                </div>
                {wellingtonAnalysis.recommendations && wellingtonAnalysis.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {wellingtonAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                      <div key={rec.symbol || idx} className="p-2 bg-[#0a0a0a] rounded border border-[#27272a]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono font-bold text-[#3b82f6]">{rec.symbol}</span>
                          <div className="flex gap-2 items-center">
                            {rec.expected_roi && (
                              <span className="px-2 py-0.5 bg-[#00e676]/20 text-[#00e676] text-xs rounded font-mono">
                                +{rec.expected_roi}% ROI
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded ${rec.action === 'BUY' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'}`}>
                              {rec.action}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-[#a1a1aa] mb-1">
                          <span className="text-[#00e676]">Confidence:</span> {rec.confidence}/10 | {rec.reasoning}
                        </div>
                        {rec.target_price && (
                          <div className="text-[10px] text-[#71717a] flex gap-3">
                            <span>Entry: ${rec.entry_price}</span>
                            <span>Target: ${rec.target_price}</span>
                            {rec.stop_loss && <span>Stop: ${rec.stop_loss}</span>}
                            {rec.time_horizon && <span>Time: {rec.time_horizon}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#71717a]">
                    {wellingtonAnalysis.raw_response || wellingtonAnalysis.error || 'No recommendations available'}
                  </div>
                )}
                {wellingtonAnalysis.strategy && (
                  <div className="mt-3 text-xs text-[#a1a1aa] p-2 bg-[#0a0a0a] rounded">
                    <span className="text-[#00e676]">Strategy:</span> {wellingtonAnalysis.strategy}
                  </div>
                )}
                {wellingtonAnalysis.disclaimer && (
                  <div className="mt-2 text-[10px] text-[#71717a] italic">
                    ⚠️ {wellingtonAnalysis.disclaimer}
                  </div>
                )}
              </div>
            )}

            {/* Wellington Chat Interface */}
            <div className="border border-[#27272a] rounded">
              <div className="bg-[#18181b] p-2 border-b border-[#27272a] flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#00e676]">Chat with Wellington AI</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase text-[#71717a]">Model</span>
                  <select
                    value={wellingtonModel}
                    onChange={(e) => setWellingtonModel(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#27272a] rounded-sm text-[10px] text-[#ededed] px-2 py-1 font-mono focus:border-[#00e676] focus:outline-none cursor-pointer"
                    data-testid="wellington-model-select"
                  >
                    {(wellingtonModels.length > 0 ? wellingtonModels : [{ id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', tag: 'Latest · Recommended' }]).map(m => (
                      <option key={m.id} value={m.id}>{m.label} — {m.tag}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-64 overflow-y-auto p-3 space-y-2 bg-[#0a0a0a]">
                {wellingtonChat.length === 0 ? (
                  <div className="text-center text-[#71717a] text-xs py-8">
                    Ask Wellington AI anything about trading, markets, or strategies...
                  </div>
                ) : (
                  wellingtonChat.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded text-xs ${
                      msg.role === 'user' 
                        ? 'bg-[#3b82f6]/20 text-right ml-12' 
                        : msg.role === 'error'
                        ? 'bg-loss/20 text-loss'
                        : 'bg-[#00e676]/10 mr-12'
                    }`}>
                      <div className="font-semibold mb-1 flex items-center gap-2 justify-between">
                        <span>{msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'Wellington AI'}</span>
                        <span className="flex items-center gap-1.5">
                          {msg.model && (
                            <span className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-[#27272a] text-[#a1a1aa]" data-testid="wellington-msg-model">
                              {msg.model}
                            </span>
                          )}
                          {msg.mode && msg.mode !== 'standard' && (
                          <span className={`px-2 py-0.5 text-[9px] font-mono rounded ${
                            msg.mode === 'code_generation' ? 'bg-[#3b82f6]/30 text-[#3b82f6]' :
                            msg.mode === 'deep_analysis' ? 'bg-[#8b5cf6]/30 text-[#8b5cf6]' :
                            msg.mode === 'research' ? 'bg-[#10b981]/30 text-[#10b981]' :
                            msg.mode === 'strategy_builder' ? 'bg-[#f59e0b]/30 text-[#f59e0b]' :
                            msg.mode === 'multi_agent_debate' ? 'bg-[#ec4899]/30 text-[#ec4899]' :
                            'bg-[#71717a]/30 text-[#71717a]'
                          }`}>
                            {msg.mode.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        )}
                        </span>
                      </div>
                      
                      {/* Thinking Process */}
                      {msg.thinking && (
                        <div className="mb-2 p-2 bg-[#000]/50 border border-[#27272a]/50 rounded text-[10px]">
                          <div className="text-[#71717a] uppercase mb-1 flex items-center gap-1">
                            <Brain size={10} />
                            Reasoning Process
                          </div>
                          <div className="text-[#a1a1aa] whitespace-pre-wrap font-mono">
                            {msg.thinking}
                          </div>
                        </div>
                      )}
                      
                      {/* Main Content */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      
                      {/* Generated Code */}
                      {msg.code && (
                        <div className="mt-2 p-2 bg-[#000]/70 border border-[#3b82f6]/30 rounded">
                          <div className="text-[#3b82f6] uppercase mb-1 text-[9px] flex items-center gap-1">
                            <Code2 size={10} />
                            Generated Code
                          </div>
                          <pre className="text-[10px] overflow-x-auto font-mono text-[#ededed]">
                            <code>{msg.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {wellingtonThinking && (
                  <div className="text-center text-[#00e676] text-xs">
                    Wellington AI is thinking...
                  </div>
                )}
              </div>
              <div className="p-2 bg-[#18181b] flex gap-2">
                <input
                  type="text"
                  value={wellingtonInput}
                  onChange={(e) => setWellingtonInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendWellingtonMessage()}
                  placeholder="Ask Wellington AI..."
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#27272a] rounded text-sm"
                  disabled={wellingtonThinking}
                />
                
                {/* File Upload Button */}
                <label className="btn-quant px-3 py-2 text-sm cursor-pointer relative" title="Upload Document">
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={wellingtonThinking}
                  />
                  📄
                </label>
                
                {/* Image Upload Button */}
                <label className="btn-quant px-3 py-2 text-sm cursor-pointer relative" title="Upload Image/Chart">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={wellingtonThinking}
                  />
                  📊
                </label>
                
                <button
                  onClick={sendWellingtonMessage}
                  disabled={wellingtonThinking || (!wellingtonInput.trim() && !uploadedFile && !uploadedImage && !urlInput)}
                  className="btn-quant px-4 py-2 text-sm"
                >
                  Send
                </button>
              </div>
              
              {/* Upload Previews & URL Input */}
              <div className="p-2 bg-[#0a0a0a] border-t border-[#27272a]">
                {/* URL Input Row */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="🔗 Paste website URL to analyze..."
                    className="flex-1 px-3 py-1 bg-[#18181b] border border-[#27272a] rounded text-xs"
                  />
                  {urlInput && (
                    <button
                      onClick={() => setUrlInput('')}
                      className="text-xs text-[#71717a] hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {/* File/Image Previews */}
                <div className="flex gap-2 flex-wrap">
                  {uploadedFile && (
                    <div className="px-3 py-1 bg-[#3b82f6]/20 rounded text-xs flex items-center gap-2">
                      📄 {uploadedFile.name}
                      <button onClick={() => setUploadedFile(null)} className="text-loss">×</button>
                    </div>
                  )}
                  {uploadedImage && (
                    <div className="px-3 py-1 bg-[#00e676]/20 rounded text-xs flex items-center gap-2">
                      📊 {uploadedImage.name}
                      <button onClick={() => setUploadedImage(null)} className="text-loss">×</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-profit/20 border border-profit/50' : 'bg-loss/20 border border-loss/50'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Watchlist (50 items) */}
        <div className="col-span-4">
          <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
            <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
              WATCHLIST (Top 5 from 15 Hedge Funds)
            </div>
            <div className="max-h-[700px] overflow-y-auto">
              {watchlist.map((item, idx) => (
                <div
                  key={item.position}
                  onClick={() => setSelectedStock(item)}
                  className={`p-2 border-b border-[#27272a] cursor-pointer transition-colors ${
                    selectedStock?.symbol === item.symbol ? 'bg-[#3b82f6]/20' : 'hover:bg-[#18181b]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-[#71717a]">#{item.position}</span>
                        <span className={`font-mono text-sm font-bold ${isBloomberg ? 'text-[#00ffff]' : 'text-[#3b82f6]'}`}>
                          {item.symbol}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a1a1aa] leading-tight mb-1">{item.name}</div>
                      <div className="text-[9px] text-[#71717a]">{item.hedge_fund}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">${item.current_price.toFixed(2)}</div>
                      <div className={`font-mono text-[10px] ${item.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Order Entry & Selected Stock Info */}
        <div className="col-span-4">
          <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
            <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
              ORDER ENTRY
            </div>
            <div className="p-4">
              {selectedStock ? (
                <>
                  <div className="mb-4 p-3 bg-[#18181b] rounded">
                    <div className="font-mono text-lg font-bold text-[#3b82f6]">{selectedStock.symbol}</div>
                    <div className="text-xs text-[#a1a1aa] mb-2">{selectedStock.name}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#71717a]">Current Price</span>
                      <span className="font-mono text-xl">${selectedStock.current_price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="mb-3">
                    <label className="text-xs text-[#71717a] uppercase mb-2 block">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderForm({ ...orderForm, orderType: 'MARKET' })}
                        className={`px-3 py-2 text-sm rounded ${
                          orderForm.orderType === 'MARKET' ? 'bg-[#3b82f6] text-white' : 'bg-[#27272a] text-[#a1a1aa]'
                        }`}
                      >
                        Market
                      </button>
                      <button
                        onClick={() => setOrderForm({ ...orderForm, orderType: 'LIMIT' })}
                        className={`px-3 py-2 text-sm rounded ${
                          orderForm.orderType === 'LIMIT' ? 'bg-[#3b82f6] text-white' : 'bg-[#27272a] text-[#a1a1aa]'
                        }`}
                      >
                        Limit
                      </button>
                    </div>
                  </div>

                  {/* Side */}
                  <div className="mb-3">
                    <label className="text-xs text-[#71717a] uppercase mb-2 block">Side</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrderForm({ ...orderForm, side: 'BUY' })}
                        className={`px-3 py-2 text-sm rounded ${
                          orderForm.side === 'BUY' ? 'bg-profit text-white' : 'bg-[#27272a] text-[#a1a1aa]'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => setOrderForm({ ...orderForm, side: 'SELL' })}
                        className={`px-3 py-2 text-sm rounded ${
                          orderForm.side === 'SELL' ? 'bg-loss text-white' : 'bg-[#27272a] text-[#a1a1aa]'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-3">
                    <label className="text-xs text-[#71717a] uppercase mb-2 block">Quantity</label>
                    <input
                      type="number"
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded font-mono"
                      min="1"
                    />
                  </div>

                  {/* Limit Price (if limit order) */}
                  {orderForm.orderType === 'LIMIT' && (
                    <div className="mb-3">
                      <label className="text-xs text-[#71717a] uppercase mb-2 block">Limit Price</label>
                      <input
                        type="number"
                        value={orderForm.limitPrice}
                        onChange={(e) => setOrderForm({ ...orderForm, limitPrice: e.target.value })}
                        className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded font-mono"
                        step="0.01"
                        placeholder="Enter limit price"
                      />
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="mb-4 p-3 bg-[#18181b] rounded text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-[#71717a]">Estimated Cost</span>
                      <span className="font-mono">
                        ${(orderForm.quantity * (orderForm.orderType === 'LIMIT' && orderForm.limitPrice ? parseFloat(orderForm.limitPrice) : selectedStock.current_price)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#71717a]">Available Buying Power</span>
                      <span className="font-mono">${(cashBalance / 1e6).toFixed(2)}M</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={placeOrder}
                    disabled={placing || (orderForm.orderType === 'LIMIT' && !orderForm.limitPrice)}
                    className="w-full btn-quant py-3 text-sm font-semibold"
                  >
                    {placing ? 'Placing Order...' : `Place ${orderForm.orderType} ${orderForm.side} Order`}
                  </button>
                </>
              ) : (
                <div className="text-center py-12 text-[#71717a]">
                  Select a stock from the watchlist to trade
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Positions & Order History */}
        <div className="col-span-4">
          {/* Current Positions */}
          <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
            <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
              POSITIONS ({account?.positions?.length || 0})
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {account?.positions && account.positions.length > 0 ? (
                <table className="quant-table">
                  <thead>
                    <tr>
                      <th className="text-left">Symbol</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Avg Cost</th>
                      <th className="text-right">Current</th>
                      <th className="text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.positions.map((pos, idx) => (
                      <tr key={pos.symbol}>
                        <td className="font-mono font-bold text-[#3b82f6]">{pos.symbol}</td>
                        <td className="text-right font-mono">{pos.quantity}</td>
                        <td className="text-right font-mono text-xs">${pos.avg_cost.toFixed(2)}</td>
                        <td className="text-right font-mono text-xs">${pos.current_price.toFixed(2)}</td>
                        <td className={`text-right font-mono text-xs ${pos.unrealized_pl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {pos.unrealized_pl >= 0 ? '+' : ''}${(pos.unrealized_pl / 1000).toFixed(1)}K
                          <div className="text-[9px]">({pos.unrealized_pl_percent >= 0 ? '+' : ''}{pos.unrealized_pl_percent.toFixed(1)}%)</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-[#71717a] text-sm">No open positions</div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className={`quant-card ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`}>
            <div className={`quant-card-header ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
              ORDER HISTORY (Last 10)
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {account?.order_history && account.order_history.length > 0 ? (
                <div className="p-2">
                  {account.order_history.slice(-10).reverse().map((order, idx) => (
                    <div key={order.order_id || idx} className="p-2 border-b border-[#27272a] text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono font-bold text-[#3b82f6]">{order.symbol}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] ${
                          order.status === 'FILLED' ? 'bg-profit/20 text-profit' : 'bg-[#71717a]/20 text-[#71717a]'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#a1a1aa]">
                        <span>{order.side} {order.quantity} @ ${order.filled_price?.toFixed(2) || order.price?.toFixed(2)}</span>
                        <span>{order.order_type}</span>
                      </div>
                      <div className="text-[9px] text-[#71717a] mt-1">
                        {new Date(order.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#71717a] text-sm">No order history</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingPage;
