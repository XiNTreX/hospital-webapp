'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AvailableRequest {
  request_id: number;
  pickup_location: string;
  drop_location: string;
  request_time: string;
  status: string;
  patient_notes: string | null;
  first_name: string;
  last_name: string;
  patient_phone: string;
}

export default function DriverAvailableRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AvailableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [driverStatus, setDriverStatus] = useState<string>('');
  const fetchRequests = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [reqRes, profRes] = await Promise.all([
        fetch('http://localhost:5001/api/driver/requests/available', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5001/api/driver/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profRes.ok) {
        const profile = await profRes.json();
        setDriverStatus(profile.status || '');
      }

      if (reqRes.ok) {
        setRequests(await reqRes.json());
      } else if (reqRes.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load ambulance requests.');
      }
    } catch {
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (id: number) => {
    if (!confirm('Accept this ambulance request? You will be assigned as the driver.')) return;
    setAcceptingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/driver/requests/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/driver/current');
      } else {
        alert(data.error || 'Failed to accept request.');
        fetchRequests();
      }
    } catch {
      alert('Server error');
    } finally {
      setAcceptingId(null);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} day(s) ago`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Available Requests</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Pending ambulance requests waiting for a driver.
          </p>
          <p className="text-xs text-slate-400 mt-1">Total: {requests.length} pending</p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-5 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-sm transition border border-violet-200"
        >
          🔄 Refresh
        </button>
      </div>
      {driverStatus === 'Off Duty' && (
        <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">⚫</span>
          <div className="flex-1">
            <p className="font-bold text-slate-700 text-sm">You are Off Duty</p>
            <p className="text-slate-600 text-xs mt-1">
              You cannot accept ambulance requests while Off Duty. Toggle to <b>Available</b> in your dashboard to start receiving rides.
            </p>
          </div>
        </div>
      )}

      {driverStatus === 'On Trip' && (
        <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">🚑</span>
          <div className="flex-1">
            <p className="font-bold text-violet-800 text-sm">You are On Trip</p>
            <p className="text-violet-700 text-xs mt-1">
              Finish or cancel your current ride before accepting a new one.
            </p>
          </div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-500 text-sm">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-4">🚑</span>
          <h3 className="text-lg font-bold text-slate-900">No pending requests</h3>
          <p className="text-slate-500 text-sm mt-1">
            There are no ambulance requests waiting right now. New requests will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((r) => (
            <div
              key={r.request_id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚑</span>
                  <span className="font-extrabold text-slate-900">Request #{r.request_id}</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Pending
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-5">📍</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pickup</p>
                    <p className="font-semibold text-slate-800">{r.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-5">🏥</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Drop</p>
                    <p className="font-semibold text-slate-800">{r.drop_location}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Patient</p>
                  <p className="font-bold text-slate-800">{r.first_name} {r.last_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Phone</p>
                  <p className="font-bold text-slate-800">{r.patient_phone}</p>
                </div>
              </div>

              {r.patient_notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <span className="font-bold">Notes:</span> {r.patient_notes}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>🕐 {timeAgo(r.request_time)}</span>
              </div>

              <button
                onClick={() => handleAccept(r.request_id)}
                disabled={acceptingId === r.request_id || driverStatus !== 'Available'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-800 hover:to-violet-700 text-white font-bold text-sm transition shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acceptingId === r.request_id
                  ? 'Accepting...'
                  : driverStatus !== 'Available'
                    ? `Cannot accept — ${driverStatus || 'status unknown'}`
                    : 'Accept & Start Ride'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}