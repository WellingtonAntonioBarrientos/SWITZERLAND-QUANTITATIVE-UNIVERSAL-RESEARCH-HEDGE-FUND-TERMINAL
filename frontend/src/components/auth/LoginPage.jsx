import { useState } from 'react';
import { Lock, AlertTriangle, RefreshCw } from 'lucide-react';

export const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-sm mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white font-['Space_Grotesk']">SQH</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] font-['Space_Grotesk'] tracking-tight">
            SQH-WELLINGTON'S TERMINAL
          </h1>
          <p className="text-sm text-[#71717a] mt-2">
            Authorized Access Only
          </p>
        </div>

        {/* Login Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Lock size={14} />
            <span>TERMINAL ACCESS</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs uppercase text-[#71717a] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                placeholder="Enter your email"
                required
                data-testid="login-email"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase text-[#71717a] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                placeholder="Enter your password"
                required
                data-testid="login-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm uppercase text-sm tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="login-submit"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  Access Terminal
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#71717a] mt-6">
          <a href="/" className="hover:text-[#0ea5e9]">← Back to Home</a>
        </p>
      </div>
    </div>
  );
};
