'use client';

import { useState, useEffect } from 'react';

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMedicines = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/admin/medicines', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMedicines(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5001/api/admin/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, generic_name: genericName, description })
      });

      if (res.ok) {
        alert('Medicine added successfully!');
        setIsModalOpen(false);
        setName('');
        setGenericName('');
        setDescription('');
        fetchMedicines();
      } else {
        alert('Failed to add medicine.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while adding medicine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Medicines Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage global pharmacy drug directory and autocomplete options.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition shadow-md shadow-indigo-600/20"
        >
          + Add New Medicine
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center py-10">Loading medicine inventory...</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Brand / Trade Name</th>
                <th className="px-6 py-4 font-bold">Generic Name</th>
                <th className="px-6 py-4 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((med) => (
                <tr key={med.medicine_id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-bold text-slate-400">#{med.medicine_id}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{med.name}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{med.generic_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-500">{med.description || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Add New Medicine</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ color: '#000000' }}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Napa Extra"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Generic Name</label>
                <input
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  style={{ color: '#000000' }}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Paracetamol + Caffeine"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Dosage Info</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ color: '#000000' }}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 500mg tablet"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Saving Medicine...' : 'Save to Pharmacy Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}