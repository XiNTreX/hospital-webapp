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
  room_number: string;
  photo_url: string;
}

export default function PendingAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/patient/appointments/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load appointments');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    setCancellingId(appointmentId);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/patient/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Remove the cancelled appointment from the list
        setAppointments(prev => prev.filter(apt => apt.appointment_id !== appointmentId));
        setShowConfirmModal(null);
        
        // Show success message briefly
        setError(''); // clear any errors
        // Optionally show a success toast/notification
        alert('✅ Appointment cancelled successfully!');
      } else {
        setError(data.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0]);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading your appointments...</p>
      </div>
    );
  }

  if (error && appointments.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Appointments</h1>
        <p className="text-slate-500 mt-1">View and manage your upcoming appointments.</p>
        <p className="text-sm text-slate-400 mt-1">Total: {appointments.length} appointments</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Appointment List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-4xl block mb-4">✅</span>
          <h3 className="text-lg font-bold text-gray-900">No pending appointments</h3>
          <p className="text-slate-500 text-sm mt-1">You're all caught up! No upcoming appointments.</p>
          <button 
            onClick={() => router.push('/patient/appointments/book')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
          >
            Book an Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
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
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      Scheduled
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
                      <span>🏥</span> Room {apt.room_number}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🎫</span> Serial #{apt.serial_no}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                    <button 
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal(apt.appointment_id)}
                      disabled={cancellingId === apt.appointment_id}
                      className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium transition disabled:opacity-50"
                    >
                      {cancellingId === apt.appointment_id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
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

      {/* Cancel Confirmation Modal */}
      {showConfirmModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Cancel Appointment?</h3>
              <p className="text-slate-500 text-sm mt-2">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Appointment #{showConfirmModal}
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
                >
                  Keep Appointment
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