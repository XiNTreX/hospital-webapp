'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AmbulanceInfo {
  ambulance_id: number;
  ambulance_no: string;
  status: string;
  department_name: string | null;
}

interface DriverProfile {
  driver_id: number;
  first_name: string;
  last_name: string;
  email: string;
  license_no: string;
  phone: string;
  status: string;
}

export default function MyAmbulancePage() {
  const router = useRouter();
  const [ambulance, setAmbulance] = useState<AmbulanceInfo | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        const [ambRes, profRes] = await Promise.all([
          fetch('http://localhost:5001/api/driver/ambulance', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5001/api/driver/profile', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (ambRes.ok) setAmbulance(await ambRes.json());
        if (profRes.ok) setDriver(await profRes.json());
        if (!ambRes.ok && !profRes.ok) setError('Failed to load vehicle information.');
      } catch {
        setError('Server connection error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const statusPill = (s: string) => {
    if (s === 'Available')
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'On Trip') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading vehicle details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Ambulance</h1>
        <p className="text-slate-500 mt-1">Vehicle and driver information on record</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambulance Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm">
                🚑
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-100">
                  Assigned Ambulance
                </p>
                <h2 className="text-2xl font-black">
                  {ambulance?.ambulance_no || 'Not Assigned'}
                </h2>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {ambulance ? (
              <>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Vehicle ID
                  </span>
                  <span className="font-bold text-slate-800">#{ambulance.ambulance_id}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${statusPill(
                      ambulance.status
                    )}`}
                  >
                    {ambulance.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Department
                  </span>
                  <span className="font-bold text-slate-800">
                    {ambulance.department_name || 'Unassigned'}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl block mb-3">📭</span>
                <p className="text-slate-500 text-sm font-medium">No ambulance assigned yet.</p>
                <p className="text-slate-400 text-xs mt-1">
                  Contact your administrator to get a vehicle assigned.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Driver Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-600 to-violet-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm">
                🧑‍✈️
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-100">
                  Driver on Record
                </p>
                <h2 className="text-2xl font-black">
                  {driver ? `${driver.first_name} ${driver.last_name}` : '—'}
                </h2>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {driver && (
              <>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </span>
                  <span className="font-bold text-slate-800 text-sm truncate ml-3">
                    {driver.email}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </span>
                  <span className="font-bold text-slate-800">{driver.phone}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    License No
                  </span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    {driver.license_no}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${statusPill(
                      driver.status
                    )}`}
                  >
                    {driver.status}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}