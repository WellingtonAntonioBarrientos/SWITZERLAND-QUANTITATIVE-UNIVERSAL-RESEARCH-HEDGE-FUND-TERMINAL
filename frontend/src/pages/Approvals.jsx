import { useState, useEffect } from "react";
import axios from "axios";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get(`${API}/approvals`);
      setApprovals(res.data);
    } catch (e) {
      logError("Error fetching approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await axios.post(`${API}/approvals/${id}/action`, { action });
      fetchApprovals();
    } catch (e) {
      logError("Error processing approval:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="approvals-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Review & approve pending requests</p>
        </div>
      </div>

      <div className="quant-card">
        <table className="quant-table" data-testid="approvals-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Request</th>
              <th>Requester</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr key={approval.id} data-testid={`approval-${approval.id}`}>
                <td>
                  <span className="px-2 py-1 text-xs bg-[#27272a] rounded">{approval.type}</span>
                </td>
                <td>
                  <div>
                    <p className="font-medium">{approval.title}</p>
                    <p className="text-xs text-[#71717a]">{approval.description}</p>
                  </div>
                </td>
                <td>{approval.requester}</td>
                <td>{approval.amount ? `$${(approval.amount / 1000).toFixed(0)}K` : '-'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${approval.risk_score > 0.6 ? 'bg-[#ef4444]' : approval.risk_score > 0.3 ? 'bg-[#f59e0b]' : 'bg-[#00e676]'}`} />
                    <span>{(approval.risk_score * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded badge-${approval.status.toLowerCase()}`}>
                    {approval.status}
                  </span>
                </td>
                <td>
                  {approval.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(approval.id, 'approve')}
                        className="btn-quant btn-quant-approve px-3 py-1 text-xs"
                        data-testid={`approve-btn-${approval.id}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(approval.id, 'reject')}
                        className="btn-quant btn-quant-reject px-3 py-1 text-xs"
                        data-testid={`reject-btn-${approval.id}`}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Approvals;
