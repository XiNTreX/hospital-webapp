'use client';

import { useState, useEffect } from 'react';

export default function DoctorTestReviewsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [resultText, setResultText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingTests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5001/api/doctor/pending-tests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setTests(await response.json());
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTests();
  }, []);

  const handleSubmitResult = async () => {
    if (!resultText.trim()) return alert('Please enter the test result.');
    
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:5001/api/doctor/tests/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          report_id: selectedTest.report_id,
          result_text: resultText
        })
      });

      if (response.ok) {
        alert('Result saved successfully!');
        setSelectedTest(null);
        setResultText('');
        fetchPendingTests(); // Refresh the table
      } else {
        alert('Failed to save result.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Pending Test Reviews</h1>
      
      {isLoading ? (
        <p className="text-slate-500">Loading pending tests...</p>
      ) : tests.length === 0 ? (
        <p className="text-slate-500">No pending test reports require your attention.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Date Prescribed</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Patient</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Test Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.report_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-600">{test.date.split('T')[0]}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {test.first_name} {test.last_name} <span className="font-normal text-slate-500 text-xs ml-1">({test.age}y, {test.gender})</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">{test.test_name}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedTest(test)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      Add Result
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result Entry Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Submit Test Result</h2>
                <p className="text-sm font-bold text-blue-600 mt-1">{selectedTest.test_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Patient: {selectedTest.first_name} {selectedTest.last_name}</p>
              </div>
              <button 
                onClick={() => { setSelectedTest(null); setResultText(''); }} 
                className="text-slate-400 hover:text-slate-700 font-bold text-xl"
              >✕</button>
            </div>

            <label className="block text-sm font-bold text-slate-700 mb-2">Findings / Values</label>
            <textarea
              rows={5}
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-sm text-slate-900 mb-6"
              placeholder="e.g., Hemoglobin: 14.2 g/dL (Normal range: 13.8 - 17.2 g/dL)&#10;Impression: Normal study."
            />

            <button 
              onClick={handleSubmitResult} 
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Saving...' : 'Save & Complete Test'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}