'use client';

import { useState, useEffect } from 'react';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorAppointments = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/doctor/appointments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error('Failed to load doctor appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorAppointments();
  }, []);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Patient Appointments</h1>
      
      {isLoading ? (
        <p className="text-slate-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-slate-500">No appointments scheduled yet.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Serial</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Patient Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Age / Gender</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Date & Time</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.appointment_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-emerald-600">#{apt.serial_no}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {apt.patient_first_name} {apt.patient_last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {apt.patient_age} yrs • {apt.gender}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {apt.date.split('T')[0]} at {apt.time}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}