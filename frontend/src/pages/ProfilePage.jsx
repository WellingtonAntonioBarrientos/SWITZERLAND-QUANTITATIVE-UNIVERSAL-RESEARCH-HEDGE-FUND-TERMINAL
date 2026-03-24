import { useState } from 'react';
import { User, Mail, Key, Shield, Clock } from 'lucide-react';

export const ProfilePage = ({ userEmail }) => {
  return (
    <div className="p-6" data-testid="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl mt-6">
        {/* Account Information Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <User size={14} />
            <span>ACCOUNT INFORMATION</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-lg flex items-center justify-center">
                <User size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#71717a] uppercase tracking-wider mb-1">Email Address</div>
                <div className="font-mono text-[#ededed] text-lg">{userEmail}</div>
                <div className="text-xs text-[#71717a] mt-2">Account Owner</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Shield size={14} />
            <span>SECURITY</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                  <Key size={18} className="text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Password</div>
                  <div className="text-xs text-[#71717a]">Last changed recently</div>
                </div>
              </div>
              <div className="text-xs text-[#00e676] flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00e676] rounded-full"></div>
                Configured
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                  <Shield size={18} className="text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Two-Factor Authentication</div>
                  <div className="text-xs text-[#71717a]">Enhanced security for your account</div>
                </div>
              </div>
              <div className="text-xs text-[#71717a]">Not configured</div>
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Clock size={14} />
            <span>SESSION INFORMATION</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#71717a] mb-1">Token Expiry</div>
                <div className="text-sm text-[#ededed]">7 days</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Account Type</div>
                <div className="text-sm text-[#ededed]">Owner</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Access Level</div>
                <div className="text-sm text-[#00e676]">Full Access</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Authentication</div>
                <div className="text-sm text-[#ededed]">JWT-based</div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Reference (for your records) */}
        <div className="quant-card border-[#3b82f6]/30">
          <div className="quant-card-header flex items-center gap-2 bg-[#3b82f6]/10">
            <Mail size={14} />
            <span>ACCOUNT CREDENTIALS (FOR YOUR RECORDS)</span>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <div className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Username / Email</div>
              <div className="p-3 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
                <code className="text-sm text-[#22d3ee] font-mono">barrientoswellingtonantonio@gmail.com</code>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Password</div>
              <div className="p-3 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
                <code className="text-sm text-[#a1a1aa] font-mono">01230143Wab@</code>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-sm mt-4">
              <Shield size={14} className="text-[#3b82f6] mt-0.5" />
              <div className="text-xs text-[#a1a1aa]">
                Keep these credentials secure. You can change your password anytime using the "Change Password" option in the sidebar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
