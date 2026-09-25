'use client';

import { useState, useEffect } from 'react';

export default function AdminTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/admin/tests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTests(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5001/api/admin/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, cost: parseFloat(cost) })
      });

      if (res.ok) {
        alert('Test added successfully!');
        setIsModalOpen(false);
        setName('');
        setCost('');
        fetchTests();
      } else {
        alert('Failed to add test.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while adding test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Diagnostic Tests Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">Manage hospital laboratory and imaging test offerings and pricing.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition shadow-md shadow-indigo-600/20"
        >
          + Add New Test
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center py-10">Loading test catalog...</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Test ID</th>
                <th className="px-6 py-4 font-bold">Test Name</th>
                <th className="px-6 py-4 font-bold text-right">Cost (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((test) => (
                <tr key={test.test_id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-bold text-slate-400">#{test.test_id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{test.name}</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600">৳{test.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Add New Diagnostic Test</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ color: '#000000' }}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Dengue IgG/IgM Antibody"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cost (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  style={{ color: '#000000' }}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Saving Test...' : 'Save Test to Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}