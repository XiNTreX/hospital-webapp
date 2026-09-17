'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateDhaka } from '../../utils/dhakaDate';
interface BloodRequest {
  request_id: number;
  blood_group_needed: string;
  units_needed: number;
  units_pledged: number;
  units_fulfilled: number;
  request_date: string;
  need_date: string;
  status: string;
  patient_notes: string;
  first_name: string;
  last_name: string;
}

export default function BloodRequestsHistory() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/patient/blood-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load blood requests');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (requestId: number) => {
    setCancellingId(requestId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/patient/blood-requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        // Update the request status in the list
        setRequests(prev => prev.map(req =>
          req.request_id === requestId
            ? { ...req, status: 'Cancelled' }
            : req
        ));
        setShowConfirmModal(null);
        alert('✅ Blood request cancelled successfully!');
      } else {
        setError(data.error || 'Failed to cancel request');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  // const formatDate = (dateStr: string) => {
  //   const date = new Date(dateStr);
  //   return date.toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric'
  //   });
  // };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Fulfilled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading blood requests...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blood Requests</h1>
          <p className="text-slate-500 mt-1">Track your blood donation requests</p>
          <p className="text-sm text-slate-400 mt-1">Total: {requests.length} requests</p>
        </div>
        <button
          onClick={() => router.push('/patient/blood-requests/new')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-bold text-sm transition shadow-lg shadow-rose-500/25"
        >
          + New Request
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-4xl block mb-4">🩸</span>
          <h3 className="text-lg font-bold text-gray-900">No blood requests yet</h3>
          <p className="text-slate-500 text-sm mt-1">You haven't submitted any blood requests.</p>
          <button
            onClick={() => router.push('/patient/blood-requests/new')}
            className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition"
          >
            Request Blood Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.request_id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition ${req.status === 'Cancelled'
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-slate-200'
                }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${req.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-400'
                      : 'bg-rose-100 text-rose-600'
                    }`}>
                    {req.blood_group_needed}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">
                        Request #{req.request_id}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {req.units_needed} unit{req.units_needed > 1 ? 's' : ''} needed
                      {req.units_fulfilled > 0 && req.status !== 'Cancelled' && (
                        <span className="ml-2 text-xs text-emerald-600 font-semibold">
                          · {req.units_fulfilled} fulfilled
                        </span>
                      )}
                      {req.units_pledged > req.units_fulfilled && req.status !== 'Cancelled' && (
                        <span className="ml-2 text-xs text-amber-600 font-semibold">
                          · {req.units_pledged - req.units_fulfilled} pledged
                        </span>
                      )}
                    </p>
                    {req.units_needed > 0 && req.status !== 'Cancelled' && (
                      <div className="mt-2 h-1.5 w-40 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all"
                          style={{ width: `${Math.min(100, Math.round((req.units_fulfilled / req.units_needed) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  {/* <p>Requested: {formatDate(req.request_date)}</p>
                  <p>Needed by: {formatDate(req.need_date)}</p> */}
                  {formatDateDhaka(req.request_date)}
                  {formatDateDhaka(req.need_date)}
                </div>
              </div>

              {req.patient_notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                  <span className="font-medium">Notes:</span> {req.patient_notes}
                </div>
              )}

              {/* Status-specific actions */}
              {/* Status-specific actions */}
              {req.status === 'Pending' && req.units_pledged === 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => setShowConfirmModal(req.request_id)}
                    disabled={cancellingId === req.request_id}
                    className="flex-1 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium transition disabled:opacity-50"
                  >
                    {cancellingId === req.request_id ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                </div>
              )}

              {/* Pledged: block cancellation */}
              {req.status === 'Pending' && req.units_pledged > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <span>🤝</span> {req.units_pledged} donor{req.units_pledged > 1 ? 's have' : ' has'} pledged. Cancellation is locked.
                  </p>
                </div>
              )}

              {req.status === 'Confirmed' && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700 flex items-center gap-2">
                    <span>✅</span> A donor has confirmed this request!
                  </p>
                </div>
              )}

              {req.status === 'Fulfilled' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <span>💉</span> This request has been fulfilled.
                  </p>
                </div>
              )}

              {req.status === 'Cancelled' && (
                <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-sm text-rose-700 flex items-center gap-2">
                    <span>❌</span> This request was cancelled.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      {showConfirmModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Cancel Blood Request?</h3>
              <p className="text-slate-500 text-sm mt-2">
                Are you sure you want to cancel this blood request? This action cannot be undone.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Request #{showConfirmModal}
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
                >
                  Keep Request
                </button>
                <button
                  onClick={() => handleCancel(showConfirmModal)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}