'use client';

import { useState, useEffect } from 'react';

interface DonorProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  blood_group: string;
  last_donation_date: string;
}

export default function DonorDashboard() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5001/api/donor/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setProfile(data);
        } else {
          setError(data.error || 'Failed to load profile.');
        }
      } catch (err) {
        setError('Server connection error.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) return <div className="p-8 text-slate-500 font-bold">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-rose-600 font-bold">{error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Blood Donor Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Name</p>
            <p className="text-lg font-medium text-slate-900">{profile?.first_name} {profile?.last_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Blood Group</p>
            <span className="inline-block mt-1 px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg text-sm">
              {profile?.blood_group}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Phone</p>
            <p className="text-base font-medium text-slate-900">{profile?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Last Donation</p>
            <p className="text-base font-medium text-slate-900">
              {profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'No recorded donations'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}