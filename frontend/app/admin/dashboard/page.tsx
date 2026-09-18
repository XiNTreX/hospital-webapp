'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0, pendingTests: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5001/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <div className="p-10 text-slate-500">Loading admin metrics...</div>;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Admin Control Center</h1>
        <p className="text-slate-500 text-sm mt-1">System-wide metrics and hospital operational overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</p>
          <p className="text-4xl font-black text-slate-900">{stats.totalPatients}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Doctors</p>
          <p className="text-4xl font-black text-indigo-600">{stats.totalDoctors}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Appointments</p>
          <p className="text-4xl font-black text-slate-900">{stats.totalAppointments}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Lab Tests</p>
          <p className="text-4xl font-black text-amber-500">{stats.pendingTests}</p>
        </div>
      </div>
    </div>
  );
}