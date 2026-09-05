'use client';

import { useState, useEffect } from 'react';

export default function DonorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/donor/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load donor profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) return <div className="p-10">Loading dashboard...</div>;
  if (!profile) return <div className="p-10 text-red-500">Failed to load profile.</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Welcome, {profile.first_name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-500 mb-2">Blood Group</p>
          <span className="text-5xl font-extrabold text-rose-600">{profile.blood_group}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-500 mb-2">Total Donations</p>
          <span className="text-5xl font-extrabold text-slate-800">{profile.donation_count}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-500 mb-2">Current Status</p>
          {profile.eligibility ? (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold">Eligible to Donate</span>
          ) : (
            <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full font-bold">Ineligible Currently</span>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Donor Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
          <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
          <p><strong>Donor Type:</strong> {profile.is_regular ? 'Regular' : 'Occasional'}</p>
          <p><strong>Last Donation Date:</strong> {new Date(profile.last_donation_date).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}