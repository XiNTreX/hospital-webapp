'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTimeDhaka, formatDateDhaka } from '../../utils/dhakaDate';

interface Referred {
  donation_id: number;
  request_id: number;
  status: 'Pending' | 'Pledged' | 'Fulfilled' | 'Cancelled' | 'Declined';
  referred_donor_id: number | null;
  referred_first_name: string | null;
  referred_last_name: string | null;
  referred_blood_group: string | null;
  referred_phone: string | null;
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

export default function ReferredDonationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Referred[]>([]);
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
      const res = await fetch('http://localhost:5001/api/donor/donations/referred', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRows(await res.json());
      else if (res.status === 401) router.push('/login');
      else setError('Failed to load referrals');
    } catch {
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this referral? The slot will be freed.')) return;
    setActionId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/donations/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || 'Failed');
    } catch {
      alert('Server error');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading referrals...</p>
      </div>
    );
  }

  const active = rows.filter((r) => r.status === 'Pending' || r.status === 'Pledged');
  const past = rows.filter(
    (r) => r.status === 'Fulfilled' || r.status === 'Cancelled' || r.status === 'Declined'
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'Pledged':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Fulfilled':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Declined':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const ReferralCard = ({ r }: { r: Referred }) => (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-sm ${
        r.status === 'Pending'
          ? 'border-2 border-violet-300'
          : r.status === 'Pledged'
          ? 'border-2 border-amber-200'
          : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
              r.status === 'Pending'
                ? 'bg-violet-100 text-violet-700'
                : r.status === 'Pledged'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {r.status === 'Pending' ? '📨' : r.status === 'Pledged' ? '✋' : '📁'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">Request #{r.request_id}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge(
                  r.status
                )}`}
              >
                {r.status}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                {r.blood_group_needed}
              </span>
            </div>
            <p className="text-sm text-slate-700 mt-2">
              <b>Referred:</b>{' '}
              {r.referred_first_name && r.referred_last_name
                ? `${r.referred_first_name} ${r.referred_last_name}`
                : 'Unknown donor'}{' '}
              {r.referred_blood_group && `· ${r.referred_blood_group}`}
            </p>
            {r.referred_phone && (
              <p className="text-xs text-slate-500 mt-0.5">📞 {r.referred_phone}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Patient: {r.first_name} {r.last_name} · Needed by {formatDateDhaka(r.need_date)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Referred {formatDateTimeDhaka(r.pledged_at)}
              {r.status === 'Fulfilled' &&
                r.fulfilled_at &&
                ` · Fulfilled ${formatDateTimeDhaka(r.fulfilled_at)}`}
              {r.status === 'Declined' &&
                r.cancelled_at &&
                ` · Declined ${formatDateTimeDhaka(r.cancelled_at)}`}
              {r.status === 'Cancelled' &&
                r.cancelled_at &&
                ` · Cancelled ${formatDateTimeDhaka(r.cancelled_at)}`}
            </p>
          </div>
        </div>

        {(r.status === 'Pending' || r.status === 'Pledged') && (
          <div className="flex gap-2">
            <button
              onClick={() => handleCancel(r.donation_id)}
              disabled={actionId === r.donation_id}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition disabled:opacity-50"
            >
              {actionId === r.donation_id ? '...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referred Donations</h1>
        <p className="text-slate-500 mt-1">Blood donors you&apos;ve referred to patients</p>
        <p className="text-xs text-slate-400 mt-1">Total: {rows.length}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* ACTIVE */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          🕐 Active Referrals ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center shadow-sm">
            <p className="text-slate-500 text-sm">
              No active referrals right now. Refer a donor from the{' '}
              <a href="/donor/requests" className="text-red-700 font-bold underline">
                Available Requests
              </a>{' '}
              page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((r) => (
              <ReferralCard key={r.donation_id} r={r} />
            ))}
          </div>
        )}
      </div>

      {/* HISTORY */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          📁 History ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="text-5xl block mb-4">👥</span>
            <h3 className="text-lg font-bold text-slate-900">No history yet</h3>
            <p className="text-slate-500 text-sm mt-1">
              Once a referral is fulfilled, declined, or cancelled, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((r) => (
              <ReferralCard key={r.donation_id} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}