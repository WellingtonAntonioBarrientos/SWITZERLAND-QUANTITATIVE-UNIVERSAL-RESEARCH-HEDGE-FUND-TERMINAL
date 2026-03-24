import { useState } from 'react';
import axios from 'axios';
import { Key, XCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { API } from '../../utils/api';

export const PasswordChangeModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#27272a] rounded-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#3b82f6]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#ededed]">Change Password</h2>
          </div>
          <button onClick={onClose} className="text-[#71717a] hover:text-[#ededed] transition-colors">
            <XCircle size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <label className="block text-xs uppercase text-[#71717a] mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
              placeholder="Enter current password"
              required
              data-testid="current-password"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase text-[#71717a] mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
              placeholder="Enter new password (min 8 characters)"
              required
              data-testid="new-password"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase text-[#71717a] mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#000] border border-[#27272a] rounded-sm text-[#ededed] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
              placeholder="Confirm new password"
              required
              data-testid="confirm-password"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#27272a] text-[#ededed] rounded-sm text-sm hover:bg-[#3f3f46] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-sm text-sm hover:bg-[#2563eb] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="change-password-submit"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
