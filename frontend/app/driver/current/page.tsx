'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CurrentRide {
  request_id: number;
  pickup_location: string;
  drop_location: string;
  request_time: string;
  status: string;
  patient_notes: string | null;
  accepted_at: string;
  en_route_at: string | null;
  arrived_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
  first_name: string;
  last_name: string;
  patient_phone: string | null;
}

const STEPS = ['Accepted', 'En Route', 'Arrived', 'Picked Up', 'Completed'];

const NEXT_ACTION_LABEL: Record<string, { label: string; icon: string }> = {
  Accepted: { label: 'Start Trip (En Route)', icon: '🚗' },
  'En Route': { label: 'Mark Arrived at Pickup', icon: '📍' },
  Arrived: { label: 'Confirm Picked Up', icon: '🧍' },
  'Picked Up': { label: 'Complete Ride', icon: '🏁' },
};

const NEXT_STATUS: Record<string, string> = {
  Accepted: 'En Route',
  'En Route': 'Arrived',
  Arrived: 'Picked Up',
  'Picked Up': 'Completed',
};

export default function CurrentRidePage() {
  const router = useRouter();
  const [ride, setRide] = useState<CurrentRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const fetchRide = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch('http://localhost:5001/api/driver/requests/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRide(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load current ride');
      }
    } catch {
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  const handleAdvance = async () => {
    if (!ride) return;
    const next = NEXT_STATUS[ride.status];
    if (!next) return;

    if (next === 'Completed' && !confirm('Confirm ride completion? This cannot be undone.')) {
      return;
    }

    setUpdating(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/driver/requests/${ride.request_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (res.ok) {
        if (next === 'Completed') {
          router.push('/driver/completed');
        } else {
          fetchRide();
        }
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch {
      setError('Server error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!ride) return;
    setUpdating(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/driver/requests/${ride.request_id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/driver/cancelled');
      } else {
        setError(data.error || 'Failed to cancel');
        setShowCancel(false);
      }
    } catch {
      setError('Server error');
      setShowCancel(false);
    } finally {
      setUpdating(false);
    }
  };

  const formatTime = (s: string | null) =>
    s ? new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading ride...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-4">🚨</span>
          <h3 className="text-lg font-bold text-slate-900">No active ride</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            You don&apos;t have an ambulance ride in progress.
          </p>
          <Link
            href="/driver/requests"
            className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition shadow-lg shadow-violet-500/20"
          >
            🔔 Browse Available Requests
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(ride.status);
  const nextAction = NEXT_ACTION_LABEL[ride.status];
  const canCancel = ride.status === 'Accepted';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Current Ride</h1>
        <p className="text-slate-500 mt-1">Manage your active ambulance trip step by step.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Progress Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                      done
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    } ${active ? 'ring-4 ring-violet-200' : ''}`}
                  >
                    {done && i < currentIdx ? '✓' : i + 1}
                  </div>
                  <p
                    className={`text-[10px] mt-2 font-bold text-center ${
                      done ? 'text-violet-700' : 'text-slate-400'
                    }`}
                  >
                    {s}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 -mt-5 rounded-full ${
                      i < currentIdx ? 'bg-violet-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ride Details */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-100">Active Ride</p>
              <h2 className="text-2xl font-black">Request #{ride.request_id}</h2>
            </div>
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/30">
              {ride.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 p-4 bg-violet-50 rounded-2xl border border-violet-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-lg">
                {ride.first_name?.[0]}
                {ride.last_name?.[0]}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-violet-500">Patient</p>
                <p className="font-bold text-slate-900">
                  {ride.first_name} {ride.last_name}
                </p>
              </div>
            </div>
            {ride.patient_phone && (
              <a
                href={`tel:${ride.patient_phone}`}
                className="px-4 py-2 bg-white rounded-xl text-violet-700 font-bold text-xs border border-violet-200 hover:bg-violet-50 transition shadow-sm"
              >
                📞 Call
              </a>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
              <span className="text-lg mt-0.5">📍</span>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pickup</p>
                <p className="text-sm font-semibold text-slate-800">{ride.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
              <span className="text-lg mt-0.5">🎯</span>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Drop</p>
                <p className="text-sm font-semibold text-slate-800">{ride.drop_location}</p>
              </div>
            </div>
          </div>

          {ride.patient_notes && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600 mb-1">
                Patient Notes
              </p>
              <p className="text-sm text-amber-800">{ride.patient_notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Accepted</p>
              <p className="text-xs font-bold text-slate-700">{formatTime(ride.accepted_at)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">En Route</p>
              <p className="text-xs font-bold text-slate-700">{formatTime(ride.en_route_at)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Arrived</p>
              <p className="text-xs font-bold text-slate-700">{formatTime(ride.arrived_at)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Picked Up</p>
              <p className="text-xs font-bold text-slate-700">{formatTime(ride.picked_up_at)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {nextAction && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-extrabold text-base transition shadow-xl shadow-violet-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="text-lg">{nextAction.icon}</span>
              <span>{updating ? 'Updating...' : nextAction.label}</span>
            </button>
          )}

          {canCancel ? (
            <button
              onClick={() => setShowCancel(true)}
              disabled={updating}
              className="w-full py-3 rounded-2xl bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm transition disabled:opacity-50"
            >
              ❌ Cancel Ride
            </button>
          ) : (
            <p className="text-center text-xs text-slate-500 font-medium">
              🔒 Cancellation is disabled once you start the trip.
            </p>
          )}
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Cancel this ride?</h3>
              <p className="text-slate-500 text-sm mt-2">
                The patient will be notified and the request will be unassigned from you.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancel(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
                >
                  Keep Ride
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm disabled:opacity-50"
                >
                  {updating ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}