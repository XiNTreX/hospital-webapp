'use client';

import { formatDateDhaka } from '../../../utils/dhakaDate';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function PastAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPastAppointments = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Unauthorized');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/api/patient/appointments/past', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load past appointments');
        const data = await response.json();
        setAppointments(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastAppointments();
  }, []);

  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  // };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Past Appointments</h1>
        <p className="text-slate-500">Review your completed medical consultations.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium">Loading past appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
          <span className="text-5xl mb-4">📅</span>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No past appointments</h3>
          <p className="text-slate-500 text-sm mb-6">You don't have any completed appointments yet.</p>
          <Link 
            href="/patient/doctors" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition shadow-sm"
          >
            Book an Appointment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((apt) => (
            <div key={apt.appointment_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center relative border border-slate-200">
                    {apt.photo_url ? (
                      <Image 
                        src={apt.photo_url} 
                        alt={`Dr. ${apt.doctor_last}`} 
                        width={56} 
                        height={56} 
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👨‍⚕️</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Dr. {apt.doctor_first} {apt.doctor_last}</h3>
                    <p className="text-emerald-600 text-sm font-medium">{apt.specialization}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    {/* <span>{formatDate(apt.date)}</span> */}
                    <span>{formatDateDhaka(apt.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span>{formatTime(apt.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔢</span>
                    <span>Serial #{apt.serial_no}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}