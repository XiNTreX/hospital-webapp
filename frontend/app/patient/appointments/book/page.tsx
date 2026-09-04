'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  photo_url: string;
}

interface Session {
  start: string;
  end: string;
  booked: number;
  available: boolean;
  remaining: number;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorIdParam = searchParams.get('doctorId');
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctorIdParam || '');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  // Fetch doctors list on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDoctors();
  }, [router]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/patient/doctors', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
        
        // If a doctor ID was passed in URL, auto-select that doctor
        if (doctorIdParam) {
          const found = data.find((d: Doctor) => String(d.doctor_id) === doctorIdParam);
          if (found) {
            setSelectedDoctorId(doctorIdParam);
            setSelectedDoctor(found);
          }
        } else if (data.length > 0) {
          // Otherwise select first doctor
          setSelectedDoctorId(String(data[0].doctor_id));
          setSelectedDoctor(data[0]);
        }
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Could not load doctors');
    }
  };

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchSlots();
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setError('');
    setSelectedSession('');
    setSessions([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5001/api/patient/appointments/slots?doctorId=${selectedDoctorId}&date=${selectedDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load slots');
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Could not load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const found = doctors.find(d => String(d.doctor_id) === doctorId);
    if (found) setSelectedDoctor(found);
    setSelectedDate('');
    setSelectedSession('');
    setSessions([]);
  };

  const handleBook = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSession) {
      setError('Please select a doctor, date, and time slot');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/patient/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: parseInt(selectedDoctorId),
          date: selectedDate,
          time: selectedSession,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`✅ Appointment booked! Your serial number is ${data.serialNo}`);
        setBookingData(data);
        setSelectedSession('');
        fetchSlots(); // refresh slots
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date and max date (1 month ahead)
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Book an Appointment</h1>

      {/* Step 1: Select Doctor - Hide if doctor is pre-selected */}
      {!doctorIdParam ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">1. Choose a Doctor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctors.map((doc) => (
              <button
                key={doc.doctor_id}
                onClick={() => handleDoctorSelect(String(doc.doctor_id))}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                  selectedDoctorId === String(doc.doctor_id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {doc.photo_url && (
                  <img src={doc.photo_url} alt={doc.first_name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div className="text-left">
                  <p className="font-medium text-sm">Dr. {doc.first_name} {doc.last_name}</p>
                  <p className="text-xs text-slate-500">{doc.specialization}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Show selected doctor info when pre-selected */
        selectedDoctor && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0">
                {selectedDoctor.photo_url ? (
                  <img 
                    src={selectedDoctor.photo_url} 
                    alt={selectedDoctor.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                    {selectedDoctor.first_name[0]}{selectedDoctor.last_name[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                </p>
                <p className="text-sm text-blue-600 font-medium">{selectedDoctor.specialization}</p>
                <button 
                  onClick={() => {
                    setSelectedDoctorId('');
                    setSelectedDoctor(null);
                    setSelectedDate('');
                    setSelectedSession('');
                    setSessions([]);
                    // Remove query param from URL
                    router.push('/patient/appointments/book');
                  }}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Change Doctor →
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Step 2: Select Date */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">2. Choose a Date</h2>
        <input
          type="date"
          min={today}
          max={maxDateStr}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
        <p className="text-xs text-slate-400 mt-2">Bookings allowed up to 1 month in advance</p>
      </div>

      {/* Step 3: Select Slot */}
      {selectedDoctorId && selectedDate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">3. Select Time Slot</h2>
          
          {loadingSlots ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm mt-2">Loading available slots...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm">
              No sessions available on this date. Please try another date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sessions.map((session) => (
                <button
                  key={session.start}
                  disabled={!session.available}
                  onClick={() => setSelectedSession(session.start)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    !session.available
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                      : selectedSession === session.start
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {session.start} – {session.end}
                    </span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                      {session.booked}/{session.booked + session.remaining} booked
                    </span>
                  </div>
                  {!session.available && (
                    <p className="text-xs text-rose-500 mt-1">Fully booked</p>
                  )}
                  {session.available && session.remaining <= 2 && (
                    <p className="text-xs text-amber-500 mt-1">Only {session.remaining} slots left!</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error / Success Messages */}
      {error && !loadingSlots && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm mb-4">
          {success}
          {bookingData && (
            <div className="mt-2 text-xs">
              Doctor ID: {bookingData.doctorId} | Date: {bookingData.date} | Time: {bookingData.time}
            </div>
          )}
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={handleBook}
        disabled={loading || !selectedDoctorId || !selectedDate || !selectedSession}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold text-sm transition shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Booking...' : 'Confirm Appointment'}
      </button>

      {/* Link back to dashboard */}
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