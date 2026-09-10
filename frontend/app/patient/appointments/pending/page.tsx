'use client';

import { useState, useEffect } from 'react';

interface PendingAppointment {
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

interface TimeSlotItem {
  time: string;
  available: boolean;
}

export default function PendingAppointmentsPage() {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<PendingAppointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState<TimeSlotItem[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingAppointments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5001/api/patient/appointments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAppointments(data);
      } else {
        setError(data.error || 'Failed to load pending appointments.');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  // Handle Cancel Appointment
  const handleCancel = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5001/api/patient/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Appointment cancelled successfully.');
        fetchPendingAppointments();
      } else {
        setError(data.error || 'Failed to cancel appointment.');
      }
    } catch (err) {
      setError('Server connection error.');
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (apt: PendingAppointment) => {
    setActiveAppointment(apt);
    setNewDate('');
    setSlots([]);
    setSelectedTime('');
    setRescheduleModalOpen(true);
  };

  // Fetch Available Slots when Date Changes
  const handleDateChange = async (dateStr: string) => {
    setNewDate(dateStr);
    setSelectedTime('');
    if (!activeAppointment || !dateStr) return;

    setIsFetchingSlots(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://localhost:5001/api/patient/appointments/slots?doctorId=${activeAppointment.doctor_id}&date=${dateStr}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        // Robust mapping to handle backend slot objects using 'start'
        const rawSessions = data.sessions || [];
        const normalized = rawSessions.map((s: any) => {
          if (typeof s === 'string') return { time: s, available: true };
          return { time: s.start || s.time || s.slot || '', available: s.available ?? true };
        });
        const availableOnly = normalized.filter((s: TimeSlotItem) => s.available && s.time);
        setSlots(availableOnly);
      } else {
        setError(data.error || 'Failed to fetch slots.');
        setSlots([]);
      }
    } catch (err) {
      setError('Network error while checking slots.');
    } finally {
      setIsFetchingSlots(false);
    }
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment || !newDate || !selectedTime) return;

    setIsSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(
        `http://localhost:5001/api/patient/appointments/${activeAppointment.appointment_id}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ date: newDate, time: selectedTime })
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Appointment rescheduled successfully!');
        setRescheduleModalOpen(false);
        fetchPendingAppointments();
      } else {
        setError(data.error || 'Failed to reschedule appointment.');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate max date allowed (1 month from today)
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 1);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Pending Appointments</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your upcoming scheduled doctor consultations.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium">
          {successMessage}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="text-4xl">🗓️</div>
          <p className="text-slate-600 font-bold">No pending appointments found.</p>
          <p className="text-xs text-slate-400">Book an appointment from the Doctors list to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {appointments.map((apt) => (
            <div key={apt.appointment_id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={apt.photo_url || '/doctors/default.jpg'}
                    alt={`Dr. ${apt.doctor_first}`}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${apt.doctor_first}+${apt.doctor_last}`;
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">Dr. {apt.doctor_first} {apt.doctor_last}</h3>
                    <p className="text-xs font-semibold text-emerald-600">{apt.specialization}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-full border border-blue-100">
                  Serial #{apt.serial_no}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Date</span>
                  <span className="font-bold text-slate-800">{new Date(apt.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Time Slot</span>
                  <span className="font-bold text-slate-800">{apt.time}</span>
                </div>
                <div className="col-span-2 mt-1 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Room / Location:</span>{' '}
                  <span className="font-semibold text-slate-800">{apt.room_number || 'Main Diagnostic Block'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => openRescheduleModal(apt)}
                  className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleCancel(apt.appointment_id)}
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition border border-rose-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && activeAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Reschedule Appointment</h3>
              <button 
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Rescheduling appointment with <span className="font-bold text-slate-800">Dr. {activeAppointment.doctor_first} {activeAppointment.doctor_last}</span>. Current slot: {new Date(activeAppointment.date).toLocaleDateString()} at {activeAppointment.time}.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Select New Date</label>
                <input
                  type="date"
                  min={todayStr}
                  max={maxDateStr}
                  value={newDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {isFetchingSlots ? (
                <div className="py-4 text-center text-xs text-slate-500 font-medium">Checking available slots...</div>
              ) : newDate && slots.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-medium">
                  No available time slots found for this date. Please choose another date.
                </div>
              ) : slots.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Select Available Time Slot</label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                    {slots.map((s, index) => (
                      <button
                        type="button"
                        key={`${s.time}-${index}`}
                        onClick={() => setSelectedTime(s.time)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          selectedTime === s.time
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!selectedTime || isSubmitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Rescheduling...' : 'Confirm New Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}