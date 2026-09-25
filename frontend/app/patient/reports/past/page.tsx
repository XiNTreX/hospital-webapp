'use client';

import { useState, useEffect } from 'react';

export default function PastTestReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal for Detailed View
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchPastReports = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/patient/reports/past', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setReports(data);
        else setError(data.error || 'Failed to load reports');
      } catch (err) {
        setError('Server connection error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPastReports();
  }, []);

  const handleViewReportDetails = async (report: any) => {
    setSelectedReport(report);
    setIsLoadingDetails(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5001/api/patient/reports/${report.report_id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDetails(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading your test reports...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Past Test Reports</h2>
        <p className="text-slate-500 text-sm mt-1">Review your completed diagnostic test results and pathologist findings.</p>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm font-medium">{error}</div>}

      {reports.length === 0 && !error ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">You have no completed test reports at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <div key={report.report_id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-blue-700">{report.test_name}</h3>
                <p className="text-xs text-slate-500 mt-1">Prescribed by Dr. {report.doc_first} {report.doc_last}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Date: {new Date(report.date).toLocaleDateString('en-CA')}</p>
              </div>

              <button
                onClick={() => handleViewReportDetails(report)}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200"
              >
                View Full Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedReport.test_name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Date: {new Date(selectedReport.date).toLocaleDateString('en-CA')}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            {isLoadingDetails ? (
              <p className="text-center py-10 text-slate-500">Loading report parameters...</p>
            ) : (
              <div className="space-y-6">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-3 font-bold">Parameter</th>
                        <th className="p-3 font-bold">Expected Range</th>
                        <th className="p-3 font-bold">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.map((d: any, idx: number) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-3 font-bold text-slate-800">{d.parameter_name}</td>
                          <td className="p-3 text-slate-500 text-xs">{d.normal_range}</td>
                          <td className="p-3 font-bold text-blue-600">{d.result_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase">Pathologist Remarks</p>
                  <p className="text-slate-800 font-medium mt-1">{selectedReport.remarks || 'No remarks provided.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}