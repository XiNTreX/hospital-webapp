'use client';

import { useState, useEffect } from 'react';

export default function DoctorPatientRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State & Tabs
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'prescription' | 'tests'>('prescription');
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [testReportsData, setTestReportsData] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Sub-modal for individual test full parameters
  const [selectedTestDetails, setSelectedTestDetails] = useState<any>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5001/api/doctor/records', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setRecords(await response.json());
      } catch (err) {
        console.error('Failed to load patient records');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleOpenRecord = async (record: any) => {
    setSelectedRecord(record);
    setActiveTab('prescription');
    setIsLoadingDetails(true);
    setPrescriptionData(null);
    setTestReportsData([]);

    const token = localStorage.getItem('token');
    try {
      const presRes = await fetch(`http://localhost:5001/api/doctor/prescriptions/${record.appointment_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (presRes.ok) setPrescriptionData(await presRes.json());

      const testsRes = await fetch(`http://localhost:5001/api/doctor/records/${record.appointment_id}/tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (testsRes.ok) setTestReportsData(await testsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Patient Records</h1>
      
      {isLoading ? (
        <p className="text-slate-500">Loading records...</p>
      ) : records.length === 0 ? (
        <p className="text-slate-500">No completed patient records found.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Patient Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Age / Gender</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.appointment_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-600">{record.date.split('T')[0]}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{record.first_name} {record.last_name}</td>
                  <td className="px-6 py-4 text-slate-600">{record.age} yrs • {record.gender}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleOpenRecord(record)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Details Modal with Tabs */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedRecord.first_name} {selectedRecord.last_name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Consultation Date: {selectedRecord.date.split('T')[0]}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('prescription')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition ${activeTab === 'prescription' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Prescription
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition ${activeTab === 'tests' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Test Reports
              </button>
            </div>

            {isLoadingDetails ? (
              <p className="text-center py-10 text-slate-500">Loading details...</p>
            ) : activeTab === 'prescription' ? (
              prescriptionData ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-bold uppercase">Diagnosis</p>
                    <p className="text-slate-800 font-medium mt-1">{prescriptionData.diagnosis || 'None recorded'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Prescribed Medicines</h3>
                    {prescriptionData.medicines?.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl mb-2 text-sm">
                        <span className="font-bold text-emerald-700">{m.name}</span> ({m.frequency}) - {m.duration}
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-slate-500 text-center py-6">No prescription found.</p>
            ) : (
              <div className="space-y-4">
                {testReportsData.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No diagnostic tests found for this patient.</p>
                ) : (
                  testReportsData.map((testReport, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900 text-base">{testReport.test_name}</h4>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${testReport.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                            {testReport.status === 'Completed' ? 'Completed' : 'Not done yet'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Date: {testReport.date.split('T')[0]}</p>
                        {testReport.status === 'Completed' && (
                          <p className="text-xs font-medium text-slate-600 mt-1">
                            <span className="font-bold text-slate-900">Remarks:</span> {testReport.remarks || 'None'}
                          </p>
                        )}
                      </div>

                      {testReport.status === 'Completed' ? (
                        <button
                          onClick={() => setSelectedTestDetails(testReport)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pending Specimen</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-modal for Full Test Report Details */}
      {selectedTestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedTestDetails.test_name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Date: {selectedTestDetails.date.split('T')[0]}</p>
              </div>
              <button onClick={() => setSelectedTestDetails(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 font-bold">Parameter Name</th>
                    <th className="p-3 font-bold">Expected Range</th>
                    <th className="p-3 font-bold">Measured Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedTestDetails.parameters?.map((p: any, pIdx: number) => (
                    <tr key={pIdx} className="bg-white">
                      <td className="p-3 font-bold text-slate-800">{p.parameter_name}</td>
                      <td className="p-3 text-slate-500 text-xs">{p.normal_range}</td>
                      <td className="p-3 font-bold text-blue-600">{p.result_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400 font-bold uppercase">Pathologist Remarks</p>
              <p className="text-slate-800 font-medium mt-1 text-sm">{selectedTestDetails.remarks || 'No remarks provided.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}