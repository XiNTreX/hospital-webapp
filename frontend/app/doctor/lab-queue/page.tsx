'use client';

import { useState, useEffect } from 'react';

export default function LabQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Processing State
  const [selectedSpecimen, setSelectedSpecimen] = useState<any>(null);
  const [parameters, setParameters] = useState<any[]>([]);
  const [resultsMap, setResultsMap] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/doctor/lab-queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Queue is already sorted by date/submission time ascending from backend
        setQueue(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenProcessModal = async (specimen: any) => {
    setSelectedSpecimen(specimen);
    setRemarks('');
    setResultsMap({});
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/doctor/lab-tests/${specimen.test_id}/parameters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setParameters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (parameterId: number, value: string) => {
    setResultsMap(prev => ({ ...prev, [parameterId]: value }));
  };

  const handleSubmitReport = async () => {
    for (const param of parameters) {
      if (!resultsMap[param.parameter_id]) {
        alert(`Please fill in a value for ${param.parameter_name}`);
        return;
      }
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const formattedResults = Object.keys(resultsMap).map(paramId => ({
      parameter_id: parseInt(paramId),
      result_value: resultsMap[parseInt(paramId)]
    }));

    try {
      const res = await fetch('http://localhost:5001/api/doctor/lab-tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          report_id: selectedSpecimen.report_id,
          remarks,
          results: formattedResults
        })
      });

      if (res.ok) {
        alert('Test report submitted successfully!');
        setSelectedSpecimen(null);
        fetchQueue();
      } else {
        alert('Failed to submit report.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Pathology Specimen Queue</h1>
        <p className="text-slate-500 text-sm mt-1">Incoming patient specimens sorted by time of submission.</p>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center py-10">Loading queue...</p>
      ) : queue.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">No specimens currently waiting in the queue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Submission Time</th>
                <th className="px-6 py-4 font-bold">Patient ID & Name</th>
                <th className="px-6 py-4 font-bold">Test Name</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((item) => (
                <tr key={item.report_id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 text-slate-600 font-medium">{item.date.replace('T', ' ').substring(0, 16)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    Patient #{item.patient_id} <span className="font-normal text-slate-600 ml-1">({item.first_name} {item.last_name})</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{item.test_name}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenProcessModal(item)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      Process Specimen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Processing Modal */}
      {selectedSpecimen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedSpecimen.test_name}</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Patient #{selectedSpecimen.patient_id}: {selectedSpecimen.first_name} {selectedSpecimen.last_name}</p>
              </div>
              <button onClick={() => setSelectedSpecimen(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Test Parameters & Measurements</h3>
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
                    {parameters.map((param) => (
                      <tr key={param.parameter_id} className="bg-white">
                        <td className="p-3 font-bold text-slate-800">{param.parameter_name}</td>
                        <td className="p-3 text-slate-500 text-xs font-medium">{param.normal_range}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Enter value"
                            value={resultsMap[param.parameter_id] || ''}
                            onChange={(e) => handleInputChange(param.parameter_id, e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Pathologist Remarks</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter clinical notes, interpretations, or remarks..."
                className="w-full p-4 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Report...' : 'Finalize & Publish Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}