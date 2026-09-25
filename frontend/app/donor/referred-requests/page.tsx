'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTimeDhaka, formatDateDhaka } from '../../utils/dhakaDate';

interface IncomingReferral {
  donation_id: number;
  request_id: number;
  status: 'Pending' | 'Pledged' | 'Fulfilled' | 'Cancelled' | 'Declined';
  pledged_at: string;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  blood_group_needed: string;
  units_needed: number;
  need_date: string;
  patient_notes: string | null;
  request_status: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  referrer_id: number;
  referrer_first_name: string;
  referrer_last_name: string;
  referrer_phone: string;
  referrer_blood_group: string;
}

export default function ReferredRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<IncomingReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch('http://localhost:5001/api/donor/referrals/incoming', {
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (id: number) => {
    if (!confirm('Accept this referral? You are committing to donate one bag.')) return;
    setActionId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/referrals/${id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || 'Failed to accept');
    } catch {
      alert('Server error');
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (id: number) => {
    if (
      !confirm(
        'Decline this referral? The referring donor will need to find someone else.'
      )
    )
      return;
    setActionId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/referrals/${id}/decline`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || 'Failed to decline');
    } catch {
      alert('Server error');
    } finally {
      setActionId(null);
    }
  };

  const handleFulfill = async (id: number) => {
    if (
      !confirm(
        'Confirm you have donated this bag? This will be recorded on your account.'
      )
    )
      return;
    setActionId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/referrals/${id}/fulfill`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || 'Failed to fulfil');
    } catch {
      alert('Server error');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (
      !confirm(
        'Cancel this accepted referral? You can no longer donate this bag and the slot will be freed.'
      )
    )
      return;
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
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading referrals...</p>
      </div>
    );
  }

  const pending = rows.filter((r) => r.status === 'Pending');
  const accepted = rows.filter((r) => r.status === 'Pledged');
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

  const Card = ({ r }: { r: IncomingReferral }) => (
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
        <div className="flex items-start gap-3 flex-1">
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
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
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

            <p className="text-xs text-slate-500">
              Referred by{' '}
              <b className="text-slate-800">
                {r.referrer_first_name} {r.referrer_last_name}
              </b>{' '}
              ({r.referrer_blood_group}) · 📞 {r.referrer_phone}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400">Patient</p>
                <p className="font-semibold text-slate-800">
                  {r.patient_first_name} {r.patient_last_name}
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400">Needed by</p>
                <p className="font-semibold text-slate-800">
                  {formatDateDhaka(r.need_date)}
                </p>
              </div>
            </div>

            {r.patient_notes && (
              <p className="mt-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                <b>Notes:</b> {r.patient_notes}
              </p>
            )}

            <p className="text-[11px] text-slate-400 mt-2">
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

        {r.status === 'Pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleDecline(r.donation_id)}
              disabled={actionId === r.donation_id}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => handleAccept(r.donation_id)}
              disabled={actionId === r.donation_id}
              className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              {actionId === r.donation_id ? '...' : 'Accept Referral'}
            </button>
          </div>
        )}

        {r.status === 'Pledged' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleCancel(r.donation_id)}
              disabled={actionId === r.donation_id}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleFulfill(r.donation_id)}
              disabled={actionId === r.donation_id}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              {actionId === r.donation_id ? '...' : 'Mark Donated'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referred Requests</h1>
        <p className="text-slate-500 mt-1">Donations other donors have referred you to</p>
        <p className="text-xs text-slate-400 mt-1">Total: {rows.length}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-3">
            🔔 Awaiting Your Response ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.donation_id} r={r} />
            ))}
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3">
            ✋ You Accepted — Donate Soon ({accepted.length})
          </h2>
          <div className="space-y-3">
            {accepted.map((r) => (
              <Card key={r.donation_id} r={r} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          📁 History ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-lg font-bold text-slate-900">No history yet</h3>
            <p className="text-slate-500 text-sm mt-1">
              Once you fulfil or decline a referral, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((r) => (
              <Card key={r.donation_id} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}