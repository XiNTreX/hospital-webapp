'use client';

import { useState, useEffect } from 'react';

export default function DoctorRecordsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail View State
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'Prescriptions' | 'Reports'>('Prescriptions');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Fetch unique patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/doctor/records', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch patient details when a patient is selected
  useEffect(() => {
    if (!selectedPatient) return;
    
    const fetchDetails = async () => {
      setIsDetailsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [presRes, testRes] = await Promise.all([
          fetch(`http://localhost:5001/api/doctor/patients/${selectedPatient.patient_id}/prescriptions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:5001/api/doctor/patients/${selectedPatient.patient_id}/tests`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (presRes.ok) setPrescriptions(await presRes.json());
        if (testRes.ok) setReports(await testRes.json());
      } catch (error) {
        console.error('Failed to load patient details:', error);
      } finally {
        setIsDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedPatient]);

  // Filter patients based on search
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {/* ----------------- MASTER VIEW ----------------- */}
      {!selectedPatient ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Patient Directory</h1>
            <input
  type="text"
  placeholder="Search patients..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="px-4 py-2 border border-slate-300 rounded-lg w-72 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
/>
          </div>

          {isLoading ? (
            <p className="text-slate-500 font-medium">Loading patients...</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-slate-500 font-medium">No patients found.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Patient Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Age / Gender</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Last Visit</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.patient_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {patient.age} yrs • {patient.gender}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(patient.last_visit).toLocaleDateString('en-CA')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPatient(patient)}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition"
                        >
                          View Full Record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* ----------------- DETAIL VIEW ----------------- */
        <>
          <button 
            onClick={() => setSelectedPatient(null)}
            className="mb-6 flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition"
          >
            ← Back to Directory
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedPatient.first_name} {selectedPatient.last_name}
            </h2>
            <p className="text-slate-500 mt-1">
              {selectedPatient.age} yrs • {selectedPatient.gender}
            </p>
          </div>

          <div className="mb-6 flex space-x-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('Prescriptions')}
              className={`py-3 px-1 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'Prescriptions' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Past Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('Reports')}
              className={`py-3 px-1 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'Reports' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Past Lab Reports
            </button>
          </div>

          {isDetailsLoading ? (
            <p className="text-slate-500">Loading records...</p>
          ) : (
            <div>
              {/* Prescriptions Tab */}
              {activeTab === 'Prescriptions' && (
                <div className="space-y-6">
                  {prescriptions.length === 0 ? (
                    <p className="text-slate-500">No past prescriptions found.</p>
                  ) : (
                    prescriptions.map((pr) => (
                      <div key={pr.prescription_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                              {new Date(pr.date).toLocaleDateString('en-CA')}
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 mt-3">Diagnosis: {pr.diagnosis || 'None provided'}</h3>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Medicines</h4>
                          <div className="space-y-2">
                            {pr.medicines.map((med: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                                <span className="font-bold text-slate-800">{med.name} <span className="font-normal text-slate-500">({med.dosage})</span></span>
                                <span className="text-slate-600">{med.frequency} • {med.duration} • {med.before_after_meal}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {pr.advice && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Advice</h4>
                            <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100">{pr.advice}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'Reports' && (
                <div className="space-y-6">
                  {reports.length === 0 ? (
                    <p className="text-slate-500">No lab reports found.</p>
                  ) : (
                    reports.map((report) => (
                      <div key={report.report_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{report.test_name}</h3>
                            <p className="text-sm text-slate-500 mt-1">Date: {new Date(report.date).toLocaleDateString('en-CA')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            report.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {report.status}
                          </span>
                        </div>

                        {report.status === 'Completed' ? (
                          <div>
                            <div className="grid grid-cols-3 text-xs font-bold text-slate-400 uppercase mb-2 px-2">
                              <span>Parameter</span>
                              <span>Result</span>
                              <span>Normal Range</span>
                            </div>
                            <div className="space-y-1">
                              {report.parameters.map((param: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-3 text-sm p-2 bg-slate-50 rounded-lg">
                                  <span className="font-semibold text-slate-700">{param.parameter_name}</span>
                                  <span className="font-bold text-slate-900">{param.result_value}</span>
                                  <span className="text-slate-500">{param.normal_range}</span>
                                </div>
                              ))}
                            </div>
                            {report.remarks && (
                              <p className="mt-4 text-sm text-slate-600"><span className="font-bold">Remarks:</span> {report.remarks}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">This report is still being processed by the laboratory.</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}