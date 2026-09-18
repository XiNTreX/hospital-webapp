'use client';

import { useState, useEffect } from 'react';

export default function PendingTestReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPendingReports = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5001/api/patient/reports/pending', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (response.ok) {
        setReports(data);
      } else {
        setError(data.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const handleSubmitSpecimen = async (reportId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5001/api/patient/reports/submit-specimen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ report_id: reportId })
      });

      if (response.ok) {
        fetchPendingReports(); // Refresh the list to show updated status
      } else {
        alert('Failed to submit specimen. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while submitting specimen.');
    }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading pending tests...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Pending Tests</h2>
        <p className="text-slate-500 text-sm mt-1">Submit your samples to the laboratory to begin processing.</p>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm font-medium">{error}</div>}

      {reports.length === 0 && !error ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">You have no pending diagnostic tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <div key={report.report_id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">{report.test_name}</h3>
                <p className="text-sm text-slate-500 mt-1">Prescribed by Dr. {report.doc_first} {report.doc_last}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Date: {report.date.split('T')[0]}</p>
              </div>

              <div>
                {(report.status === 'Pending' || report.status === 'Prescribed') ? (
                  <button
                    onClick={() => handleSubmitSpecimen(report.report_id)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md"
                  >
                    Submit Sample
                  </button>
                ) : (
                  <div className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 text-center font-bold text-sm rounded-xl">
                    ⏳ Specimen at Lab (Processing)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}