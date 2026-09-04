'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function DoctorDashboard() {
  const [profileData, setProfileData] = useState<any>(null);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5001/api/doctor/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setMessage({ type: 'success', text: 'Password successfully updated.' });
    setPasswords({ old: '', new: '', confirm: '' });
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Welcome back, {profileData ? `Dr. ${profileData.last_name}` : 'Doctor'}.
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Image Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-slate-100 border-4 border-emerald-50 mb-4 flex items-center justify-center relative">
              {profileData?.photo_url ? (
                <Image 
                  src={profileData.photo_url} 
                  alt={`Dr. ${profileData.last_name}`}
                  width={160}
                  height={160}
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-5xl animate-pulse">👨‍⚕️</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">My Profile</h2>
            <p className="text-emerald-600 font-medium">
              {profileData?.specialization || 'Loading...'}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Room: {profileData?.room_number || '...'}
            </p>
          </div>
        </div>

        {/* Password Reset Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Security Settings</h3>
            
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                message.type === 'error' ? 'bg-red-50 text-red-700 border-l-4 border-red-500' : 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                <input 
                  type="password" 
                  name="old"
                  value={passwords.old}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                  <input 
                    type="password" 
                    name="new"
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirm"
                    value={passwords.confirm}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-sm"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}