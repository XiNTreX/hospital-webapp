'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AmbulanceRequest {
  request_id: number;
  pickup_location: string;
  drop_location: string;
  request_time: string;
  status: string;
  patient_notes: string;
  first_name: string;
  last_name: string;
}

export default function AmbulanceRequestsHistory() {
  const router = useRouter();
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
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
      const res = await fetch('http://localhost:5001/api/patient/ambulance-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load ambulance requests');
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
      const res = await fetch(`http://localhost:5001/api/patient/ambulance-requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRequests(prev => prev.map(req => 
          req.request_id === requestId 
            ? { ...req, status: 'Cancelled' }
            : req
        ));
        setShowConfirmModal(null);
        alert('✅ Ambulance request cancelled successfully!');
      } else {
        setError(data.error || 'Failed to cancel request');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Accepted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En Route':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending': return '⏳';
      case 'Accepted': return '✅';
      case 'En Route': return '🚑';
      case 'Completed': return '🏥';
      case 'Cancelled': return '❌';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading ambulance requests...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ambulance Requests</h1>
          <p className="text-slate-500 mt-1">Track your emergency transport requests</p>
          <p className="text-sm text-slate-400 mt-1">Total: {requests.length} requests</p>
        </div>
        <button
          onClick={() => router.push('/patient/ambulance-requests/new')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-sm transition shadow-lg shadow-amber-500/25"
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
          <span className="text-4xl block mb-4">🚑</span>
          <h3 className="text-lg font-bold text-gray-900">No ambulance requests yet</h3>
          <p className="text-slate-500 text-sm mt-1">You haven't requested any ambulances.</p>
          <button 
            onClick={() => router.push('/patient/ambulance-requests/new')}
            className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition"
          >
            Request Ambulance Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.request_id} 
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition ${
                req.status === 'Cancelled' 
                  ? 'border-rose-200 bg-rose-50/30' 
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    req.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-400'
                      : req.status === 'En Route'
                      ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                      : req.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {getStatusIcon(req.status)}
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
                      {req.pickup_location} → {req.drop_location}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>Requested: {formatDateTime(req.request_time)}</p>
                </div>
              </div>

              {req.patient_notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                  <span className="font-medium">Notes:</span> {req.patient_notes}
                </div>
              )}

              {/* Status-specific displays */}
              {req.status === 'Pending' && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <span>⏳</span> Waiting for a driver to accept your request...
                  </p>
                </div>
              )}

              {req.status === 'Accepted' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <span>✅</span> A driver has accepted your request!
                  </p>
                </div>
              )}

              {req.status === 'En Route' && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-pulse">
                  <p className="text-sm text-indigo-700 flex items-center gap-2">
                    <span>🚑</span> Ambulance is on the way to your location!
                  </p>
                </div>
              )}

              {req.status === 'Completed' && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700 flex items-center gap-2">
                    <span>🏥</span> Transport completed. Thank you for using our service!
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

              {/* Cancel Button - Only for pending requests */}
              {req.status === 'Pending' && (
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
              <h3 className="text-xl font-bold text-slate-900">Cancel Ambulance Request?</h3>
              <p className="text-slate-500 text-sm mt-2">
                Are you sure you want to cancel this ambulance request? This action cannot be undone.
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