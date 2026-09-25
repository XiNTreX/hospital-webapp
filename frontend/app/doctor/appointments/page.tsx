'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Completed'>('Scheduled');
  
  // Calculate today's date in YYYY-MM-DD format based on local timezone
  const todayStr = new Date().toLocaleDateString('en-CA'); 

  useEffect(() => {
    const fetchDoctorAppointments = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/doctor/appointments', {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
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

  const scheduledAppointments = appointments.filter(apt => apt.status === 'Scheduled');
  const completedAppointments = appointments.filter(apt => apt.status === 'Completed');

  const displayedAppointments = activeTab === 'Scheduled' ? scheduledAppointments : completedAppointments;

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Patient Appointments</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6 flex space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('Scheduled')}
          className={`py-3 px-1 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'Scheduled' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Scheduled ({scheduledAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('Completed')}
          className={`py-3 px-1 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'Completed' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Completed ({completedAppointments.length})
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 font-medium">Loading appointments...</p>
      ) : displayedAppointments.length === 0 ? (
        <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} appointments found.</p>
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
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedAppointments.map((apt) => {
                const aptDate = new Date(apt.date);
                const aptDateStr = aptDate.toLocaleDateString('en-CA');
                
                const isToday = aptDateStr === todayStr;

                return (
                  <tr key={apt.appointment_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-emerald-600">#{apt.serial_no}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {apt.patient_first_name} {apt.patient_last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {apt.patient_age} yrs • {apt.gender}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {aptDateStr} at {apt.time}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        apt.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {apt.status === 'Scheduled' ? (
                        isToday ? (
                          <Link 
                            href={`/doctor/appointments/prescription?appointmentId=${apt.appointment_id}`}
                            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                          >
                            Write Prescription
                          </Link>
                        ) : (
                          <span 
                            title={`Prescription can only be written on ${aptDateStr}`}
                            className="inline-block px-4 py-2 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
                          >
                            Write Prescription
                          </span>
                        )
                      ) : (
                        <span className="inline-block px-4 py-2 text-slate-400 font-bold text-xs">
                          Done
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}