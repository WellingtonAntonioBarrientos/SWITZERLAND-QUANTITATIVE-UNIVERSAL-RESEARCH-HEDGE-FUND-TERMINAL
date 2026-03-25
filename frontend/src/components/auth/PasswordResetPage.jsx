import { useState } from 'react';
import { Phone, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API } from '../../utils/api';

export const PasswordResetPage = () => {
  const [step, setStep] = useState(1); // 1: request, 2: verify code, 3: new password
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Call backend to send reset code via SMS/Email
      await axios.post(`${API}/auth/request-reset`, { 
        contact: phoneOrEmail 
      });
      
      setSuccess('Reset code sent! Check your messages.');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/reset-password`, {
        contact: phoneOrEmail,
        reset_code: resetCode,
        new_password: newPassword
      });
      
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-sm mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white font-['Space_Grotesk']">SQH</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] font-['Space_Grotesk'] tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-[#71717a] mt-2">
            {step === 1 ? 'Enter your contact information' : step === 2 ? 'Enter reset code and new password' : 'Setting new password...'}
          </p>
        </div>

        {/* Step 1: Request Reset */}
        {step === 1 && (
          <div className="quant-card">
            <div className="quant-card-header flex items-center gap-2">
              <Phone size={14} />
              <span>REQUEST RESET CODE</span>
            </div>
            <form onSubmit={handleRequestReset} className="p-6 space-y-4">
              {error && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
                  <CheckCircle size={14} />
                  {success}
                </div>
              )}
              
              <div>
                <label className="block text-xs uppercase text-[#71717a] mb-2">Email or Phone Number</label>
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                  placeholder="barrientoswellingtonantonio@gmail.com"
                  required
                  data-testid="reset-contact"
                />
                <p className="text-xs text-[#71717a] mt-2">We'll send a reset code to this contact</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm uppercase text-sm tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="request-reset-btn"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Verify Code & Set New Password */}
        {step === 2 && (
          <div className="quant-card">
            <div className="quant-card-header flex items-center gap-2">
              <Phone size={14} />
              <span>VERIFY & RESET</span>
            </div>
            <form onSubmit={handleVerifyAndReset} className="p-6 space-y-4">
              {error && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] px-4 py-3 rounded-sm text-sm flex items-center gap-2">
                  <CheckCircle size={14} />
                  {success}
                </div>
              )}
              
              <div>
                <label className="block text-xs uppercase text-[#71717a] mb-2">Reset Code</label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none text-center tracking-widest"
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  data-testid="reset-code"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase text-[#71717a] mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                  placeholder="Enter new password (min 8 characters)"
                  required
                  data-testid="new-password-reset"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase text-[#71717a] mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#0ea5e9] focus:outline-none"
                  placeholder="Confirm new password"
                  required
                  data-testid="confirm-password-reset"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white font-semibold rounded-sm uppercase text-sm tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="verify-reset-btn"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-[10px] text-[#71717a] mt-6">
          <a href="/login" className="hover:text-[#0ea5e9] flex items-center justify-center gap-1">
            <ArrowLeft size={12} />
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
};
