import { Clock, Shield, Users, Key } from "lucide-react";

const ProfilePage = () => {
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
            <Users size={14} />
            <span>ACCOUNT INFORMATION</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] rounded-lg flex items-center justify-center">
                <Users size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#71717a] uppercase tracking-wider mb-1">Fund</div>
                <div className="font-mono text-[#ededed] text-lg">Switzerland Quantitative Universal Hedge Fund Terminal</div>
                <div className="text-xs text-[#71717a] mt-2">by Wellington Antonio Barrientos · Account Owner</div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Card */}
        <div className="quant-card">
          <div className="quant-card-header flex items-center gap-2">
            <Shield size={14} />
            <span>ACCESS</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded flex items-center justify-center">
                  <Key size={18} className="text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Open Access</div>
                  <div className="text-xs text-[#71717a]">No login required — terminal opens directly</div>
                </div>
              </div>
              <div className="text-xs text-[#00e676] flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00e676] rounded-full"></div>
                Enabled
              </div>
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
                <div className="text-xs text-[#71717a] mb-1">Account Type</div>
                <div className="text-sm text-[#ededed]">Owner</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Access Level</div>
                <div className="text-sm text-[#00e676]">Full Access</div>
              </div>
              <div>
                <div className="text-xs text-[#71717a] mb-1">Authentication</div>
                <div className="text-sm text-[#ededed]">None (Open Access)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
