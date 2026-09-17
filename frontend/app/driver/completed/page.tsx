'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CompletedRide {
  request_id: number;
  pickup_location: string;
  drop_location: string;
  request_time: string;
  status: string;
  patient_notes: string | null;
  accepted_at: string;
  completed_at: string;
  first_name: string;
  last_name: string;
}

export default function CompletedRidesPage() {
  const router = useRouter();
  const [rides, setRides] = useState<CompletedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        const res = await fetch('http://localhost:5001/api/driver/requests/completed', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setRides(await res.json());
        } else if (res.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load completed rides');
        }
      } catch {
        setError('Server connection error');
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [router]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading completed rides...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Completed Rides</h1>
        <p className="text-slate-500 mt-1">Your successful ambulance dispatch history</p>
        <p className="text-xs text-slate-400 mt-1">Total: {rides.length} completed rides</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {rides.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-4">✅</span>
          <h3 className="text-lg font-bold text-slate-900">No completed rides yet</h3>
          <p className="text-slate-500 text-sm mt-1">Completed rides will show up here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((r) => (
            <div
              key={r.request_id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
                    ✅
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">Ride #{r.request_id}</p>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {r.pickup_location} → {r.drop_location}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      👤 {r.first_name} {r.last_name}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Accepted: {formatDate(r.accepted_at)}</p>
                  <p className="font-semibold text-emerald-600">
                    Completed: {formatDate(r.completed_at)}
                  </p>
                </div>
              </div>
              {r.patient_notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <span className="font-bold">Notes:</span> {r.patient_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}