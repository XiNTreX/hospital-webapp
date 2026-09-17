'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTimeDhaka, formatDateDhaka } from '../../utils/dhakaDate';

interface Donation {
  donation_id: number;
  request_id: number;
  status: string;
  pledged_at: string;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  blood_group_needed: string;
  units_needed: number;
  need_date: string;
  patient_notes: string | null;
  first_name: string;
  last_name: string;
}

export default function MyDonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch('http://localhost:5001/api/donor/donations/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDonations(await res.json());
      else if (res.status === 401) router.push('/login');
      else setError('Failed to load donations');
    } catch {
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (id: number) => {
    if (!confirm('Confirm that you have donated this bag? This cannot be undone.')) return;
    setActionId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/donations/${id}/fulfill`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || 'Failed to update');
    } catch {
      alert('Server error');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this pledge? The patient will need another donor.')) return;
    setActionId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/donations/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || 'Failed to cancel');
    } catch {
      alert('Server error');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading your donations...</p>
      </div>
    );
  }

  const active = donations.filter((d) => d.status === 'Pledged');
  const past = donations.filter((d) => d.status !== 'Pledged');

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Pledged': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Fulfilled': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Donations</h1>
        <p className="text-slate-500 mt-1">Your personal blood donation pledges and history</p>
        <p className="text-xs text-slate-400 mt-1">Total: {donations.length}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">{error}</div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            🕐 Active Pledges ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((d) => (
              <div key={d.donation_id} className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">Request #{d.request_id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge(d.status)}`}>
                        {d.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        {d.blood_group_needed}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Patient: {d.first_name} {d.last_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Needed by {formatDateDhaka(d.need_date)} · Pledged {formatDateTimeDhaka(d.pledged_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancel(d.donation_id)}
                      disabled={actionId === d.donation_id}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleFulfill(d.donation_id)}
                      disabled={actionId === d.donation_id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
                    >
                      {actionId === d.donation_id ? 'Updating...' : 'Mark as Donated'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          📁 Past Donations ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="text-5xl block mb-4">📁</span>
            <h3 className="text-lg font-bold text-slate-900">No past donations yet</h3>
            <p className="text-slate-500 text-sm mt-1">Your completed pledges will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((d) => (
              <div key={d.donation_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">Request #{d.request_id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge(d.status)}`}>
                        {d.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        {d.blood_group_needed}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Patient: {d.first_name} {d.last_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {d.status === 'Fulfilled' && d.fulfilled_at && `Donated on ${formatDateTimeDhaka(d.fulfilled_at)}`}
                      {d.status === 'Cancelled' && d.cancelled_at && `Cancelled on ${formatDateTimeDhaka(d.cancelled_at)}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    Pledged {formatDateTimeDhaka(d.pledged_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}