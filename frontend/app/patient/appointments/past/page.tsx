'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Appointment {
  appointment_id: number;
  date: string;
  time: string;
  serial_no: number;
  status: string;
  doctor_id: number;
  doctor_first: string;
  doctor_last: string;
  specialization: string;
  photo_url: string;
}

export default function PastAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, cancelled

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/patient/appointments/past', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load past appointments');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'completed') return apt.status === 'Completed';
    if (filter === 'cancelled') return apt.status === 'Cancelled';
    return true;
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    // timeStr comes as '14:30:00' or '14:30'
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0]);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Missed':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading your past appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-rose-50 p-8 rounded-2xl border border-rose-200 max-w-md">
          <span className="text-4xl block mb-4">⚠️</span>
          <h3 className="text-lg font-bold text-rose-700">Something went wrong</h3>
          <p className="text-rose-600 text-sm mt-2">{error}</p>
          <button
            onClick={fetchAppointments}
            className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Past Appointments</h1>
        <p className="text-slate-500 mt-1">Review your completed and cancelled appointments.</p>
        <p className="text-sm text-slate-400 mt-1">Total: {appointments.length} appointments</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'completed'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          Completed ({appointments.filter(a => a.status === 'Completed').length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          Cancelled ({appointments.filter(a => a.status === 'Cancelled').length})
        </button>
      </div>

      {/* Appointment List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-4xl block mb-4">📅</span>
          <h3 className="text-lg font-bold text-gray-900">No past appointments</h3>
          <p className="text-slate-500 text-sm mt-1">You don't have any past appointments yet.</p>
          <button
            onClick={() => router.push('/patient/appointments/book')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
          >
            Book an Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.appointment_id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                {/* Doctor Photo */}
                <div className="flex-shrink-0">
                  {apt.photo_url ? (
                    <img
                      src={apt.photo_url}
                      alt={`Dr. ${apt.doctor_first}`}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold';
                          fallback.textContent = `${apt.doctor_first[0]}${apt.doctor_last[0]}`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                      {apt.doctor_first[0]}{apt.doctor_last[0]}
                    </div>
                  )}
                </div>

                {/* Appointment Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 truncate">
                        Dr. {apt.doctor_first} {apt.doctor_last}
                      </p>
                      <p className="text-sm text-blue-600 font-medium">{apt.specialization}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <span>📅</span> {formatDate(apt.date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🕐</span> {formatTime(apt.time)}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🎫</span> Serial #{apt.serial_no}
                    </p>
                  </div>

                  {/* Action buttons for completed appointments */}
                  {apt.status === 'Completed' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => router.push(`/patient/appointments/book?doctorId=${apt.doctor_id}`)}
                        className="flex-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition"
                      >
                        Book Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
    </div>
  );
}