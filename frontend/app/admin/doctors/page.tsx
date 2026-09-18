'use client';

import { useState, useEffect } from 'react';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for New Doctor
  const [formData, setFormData] = useState({
    email: '',
    password: 'password123',
    first_name: '',
    last_name: '',
    specialization: '',
    doctor_type: 'Clinical',
    room_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDoctors = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5001/api/admin/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDoctors(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5001/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Doctor onboarded successfully!');
        setIsModalOpen(false);
        setFormData({
          email: '',
          password: 'password123',
          first_name: '',
          last_name: '',
          specialization: '',
          doctor_type: 'Clinical',
          room_number: ''
        });
        fetchDoctors();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to onboard doctor.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while onboarding doctor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Doctors & Staff</h1>
          <p className="text-slate-500 text-sm mt-1">Onboard new clinical and laboratory staff members.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition shadow-md shadow-indigo-600/20"
        >
          + Onboard Doctor
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center py-10">Loading doctors directory...</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Role Type</th>
                <th className="px-6 py-4 font-bold">Specialization</th>
                <th className="px-6 py-4 font-bold">Room / Office</th>
                <th className="px-6 py-4 font-bold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doc) => (
                <tr key={doc.doctor_id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">Dr. {doc.first_name} {doc.last_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${doc.doctor_type === 'Laboratory' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                      {doc.doctor_type || 'Clinical'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{doc.specialization || 'General'}</td>
                  <td className="px-6 py-4 text-slate-600">{doc.room_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-500">{doc.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Onboard New Doctor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Sarah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Jenkins"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="doctor@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Type</label>
                  <select
                    value={formData.doctor_type}
                    onChange={(e) => setFormData({ ...formData, doctor_type: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Clinical">Clinical Doctor</option>
                    <option value="Laboratory">Laboratory Pathologist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room / Office</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Room 302"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Cardiology, Pathology"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Onboarding Doctor...' : 'Confirm & Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}