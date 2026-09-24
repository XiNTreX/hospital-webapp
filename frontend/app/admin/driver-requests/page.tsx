'use client';

import { useState, useEffect } from 'react';

export default function AdminDriverRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/admin/driver-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRequests(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this driver? An account will be created immediately.')) return;
    setActionId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/admin/driver-requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchRequests();
      else alert(data.error || 'Failed to approve.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection (optional):') ?? '';
    if (reason === null) return;
    setActionId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/admin/driver-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) fetchRequests();
      else alert(data.error || 'Failed to reject.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">New Driver Sign Up Requests</h1>
          <p className="text-slate-500 text-sm mt-1">
            Approve or reject applicants before they can log in as ambulance drivers.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition"
        >
          🔄 Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center py-10">Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
          <span className="text-5xl block mb-4">📭</span>
          <h3 className="text-lg font-bold text-slate-900">No pending driver requests</h3>
          <p className="text-slate-500 text-sm mt-1">New sign-ups will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Applicant</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">License</th>
                <th className="px-6 py-4 font-bold">Requested</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.request_id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{r.email}</td>
                  <td className="px-6 py-4 text-slate-600">{r.phone}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{r.license_no}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(r.requested_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleReject(r.request_id)}
                      disabled={actionId === r.request_id}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(r.request_id)}
                      disabled={actionId === r.request_id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {actionId === r.request_id ? 'Working...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}