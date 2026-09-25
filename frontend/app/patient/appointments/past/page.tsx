'use client';

import { useState, useEffect } from 'react';

export default function PastAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Prescription Modal State
  const [prescription, setPrescription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  useEffect(() => {
    const fetchPastAppointments = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5001/api/patient/appointments/past', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setAppointments(data);
      } catch (err) {
        setError('Server connection error.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPastAppointments();
  }, []);

  const handleViewPrescription = async (appointmentId: number) => {
    setIsModalOpen(true);
    setIsLoadingPrescription(true);
    setPrescription(null);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:5001/api/patient/prescriptions/${appointmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setPrescription(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading past appointments...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Past Appointments</h2>
        <p className="text-slate-500 text-sm mt-1">Review your completed medical consultations and prescriptions.</p>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {appointments.map((apt) => (
          <div key={apt.appointment_id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <img
                src={apt.photo_url || '/doctors/default.jpg'}
                alt="Doctor"
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h3 className="font-bold text-slate-900">Dr. {apt.doctor_first} {apt.doctor_last}</h3>
                <p className="text-xs font-semibold text-emerald-600">{apt.specialization}</p>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-1">
              <p>🗓️ Date: <span className="font-bold text-slate-900">{new Date(apt.date).toLocaleDateString('en-CA')}</span></p>
              <p>⏰ Time: <span className="font-bold text-slate-900">{apt.time}</span></p>
              <p>✅ Status: <span className="text-emerald-600 font-bold">{apt.status}</span></p>
            </div>

            <button
              onClick={() => handleViewPrescription(apt.appointment_id)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200"
            >
              View Prescription
            </button>
          </div>
        ))}
      </div>

      {/* Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b-2 border-blue-600 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-blue-900">Medical Prescription</h2>
                {prescription && <p className="text-sm font-bold text-slate-500">Dr. {prescription.doc_first} {prescription.doc_last} ({prescription.specialization})</p>}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-2xl">✕</button>
            </div>

            {isLoadingPrescription ? (
              <p className="text-center py-10 text-slate-500">Fetching prescription details...</p>
            ) : prescription ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase">Diagnosis</p>
                  <p className="text-slate-800 font-medium mt-1">{prescription.diagnosis || 'None recorded'}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">💊 Prescribed Medicines</h3>
                  {prescription.medicines?.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="p-3 font-bold">Medicine</th>
                            <th className="p-3 font-bold">Dosage</th>
                            <th className="p-3 font-bold">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {prescription.medicines.map((m: any, idx: number) => (
                            <tr key={idx} className="bg-white">
                              <td className="p-3 font-bold text-blue-700">{m.name} <span className="text-slate-400 text-xs font-normal">({m.dosage})</span></td>
                              <td className="p-3 font-semibold text-slate-800">{m.frequency} <span className="text-xs text-slate-500">({m.before_after_meal})</span></td>
                              <td className="p-3 text-slate-600">{m.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-slate-500">No medicines prescribed.</p>}
                </div>

                {prescription.tests?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">🔬 Advised Tests</h3>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {prescription.tests.map((t: any, idx: number) => <li key={idx} className="font-semibold">{t.name}</li>)}
                    </ul>
                  </div>
                )}

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-600 font-bold uppercase">General Advice</p>
                  <p className="text-amber-900 font-medium mt-1">{prescription.advice || 'No additional advice.'}</p>
                </div>
              </div>
            ) : (
              <p className="text-center py-10 text-rose-500 font-bold">Prescription not found or not yet generated.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}