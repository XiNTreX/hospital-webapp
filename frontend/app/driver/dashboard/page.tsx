'use client';

import { useState, useEffect } from 'react';

export default function DriverDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/driver/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load driver profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5001/api/driver/status', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setProfile({ ...profile, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) return <div className="p-10">Loading dashboard...</div>;
  if (!profile) return <div className="p-10 text-red-500">Failed to load profile.</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Driver Portal
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Driver Information</h2>
          <div className="space-y-4 text-slate-700">
            <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
            <p><strong>License Number:</strong> <span className="font-mono bg-slate-100 px-2 py-1 rounded">{profile.license_no}</span></p>
            <p><strong>Phone Contact:</strong> {profile.phone}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Duty Status</h2>
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => handleStatusChange('Available')}
              disabled={updating || profile.status === 'Available'}
              className={`w-full py-3 rounded-lg font-bold transition ${
                profile.status === 'Available' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Available
            </button>
            <button 
              onClick={() => handleStatusChange('On Trip')}
              disabled={updating || profile.status === 'On Trip'}
              className={`w-full py-3 rounded-lg font-bold transition ${
                profile.status === 'On Trip' ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              On Trip
            </button>
            <button 
              onClick={() => handleStatusChange('Off Duty')}
              disabled={updating || profile.status === 'Off Duty'}
              className={`w-full py-3 rounded-lg font-bold transition ${
                profile.status === 'Off Duty' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Off Duty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}