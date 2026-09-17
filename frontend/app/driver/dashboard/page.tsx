'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DriverProfile {
  driver_id: number;
  first_name: string;
  last_name: string;
  email: string;
  license_no: string;
  phone: string;
  status: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    license_no: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/driver/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          license_no: data.license_no || '',
        });
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setMessage({ text: 'Failed to load driver profile', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Server connection error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
        fetchProfile();
      } else {
        setMessage({ text: data.error || 'Failed to update profile.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Server connection error.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

 const handleStatusChange = async (newStatus: 'Available' | 'Off Duty') => {
  // No-op if already in that status
  if (profile?.status === newStatus) return;

  setStatusUpdating(true);
  setMessage(null);
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5001/api/driver/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile((prev) => (prev ? { ...prev, status: newStatus } : null));
      setMessage({
        text: newStatus === 'Available' ? "You're now Available for rides." : "You're now Off Duty.",
        type: 'success',
      });
    } else {
      setMessage({ text: data.error || 'Failed to update status.', type: 'error' });
    }
  } catch {
    setMessage({ text: 'Server connection error.', type: 'error' });
  } finally {
    setStatusUpdating(false);
  }
};
//   const getStatusBtnClass = (target: string, isActive: boolean) => {
//   if (!isActive) return 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
//   if (target === 'Available')
//     return 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30';
//   return 'bg-slate-500 text-white border-slate-500 shadow-md';
// };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusDot =
    profile?.status === 'Available'
      ? 'bg-emerald-500'
      : profile?.status === 'On Trip'
      ? 'bg-amber-500'
      : 'bg-slate-500';

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-violet-950 via-purple-900 to-violet-900 p-6 sm:p-8 text-white shadow-xl border border-violet-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-300 border border-fuchsia-400/30 mb-3">
              🚑 Driver Portal Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.first_name || 'Driver'} {profile?.last_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Manage emergency ambulance dispatch and your ride history.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <span className={`inline-block h-3 w-3 rounded-full ${statusDot} animate-pulse`} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-200 font-bold">Status</p>
              <p className="text-sm font-black text-white">{profile?.status || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/driver/requests"
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 border border-violet-400/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md transition-transform group-hover:scale-110">
                🔔
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">Available Requests</h3>
            </div>
            <p className="text-xs text-violet-100 font-medium leading-relaxed">
              Browse and accept pending ambulance requests.
            </p>
          </Link>

          <Link
            href="/driver/current"
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-amber-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-amber-500/20 border border-amber-400/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md transition-transform group-hover:scale-110">
                🚨
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">Current Ride</h3>
            </div>
            <p className="text-xs text-amber-100 font-medium leading-relaxed">
              Manage your active ambulance trip.
            </p>
          </Link>

          <Link
            href="/driver/completed"
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md transition-transform group-hover:scale-110">
                ✅
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">Ride History</h3>
            </div>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed">
              Review your completed and cancelled rides.
            </p>
          </Link>
        </div>
      </div>

      {/* Availability Toggle */}
<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="border-b border-slate-100 pb-4 mb-5">
    <h2 className="text-lg font-bold text-slate-900">Availability</h2>
    <p className="text-xs text-slate-500">
      Choose whether you&apos;re available for ambulance dispatch. &quot;On Trip&quot; is set automatically.
    </p>
  </div>

  {profile?.status === 'On Trip' ? (
    // Locked state — driver has an active ride
    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
      <span className="text-2xl">🚨</span>
      <div className="flex-1">
        <p className="font-bold text-amber-800 text-sm">Currently On Trip</p>
        <p className="text-xs text-amber-700 mt-0.5">
          You can&apos;t change availability during an active ride.
        </p>
        <Link
          href="/driver/current"
          className="inline-block mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition"
        >
          View Current Ride →
        </Link>
      </div>
    </div>
  ) : (
    // Normal 2-state toggle
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => handleStatusChange('Available')}
        disabled={statusUpdating || profile?.status === 'Available'}
        className={`py-4 rounded-2xl font-bold text-sm border-2 transition flex items-center justify-center gap-2 ${
          profile?.status === 'Available'
            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30 cursor-default'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
        } disabled:opacity-60`}
      >
        <span className="text-lg">🟢</span>
        <span>Available</span>
      </button>

      <button
        onClick={() => handleStatusChange('Off Duty')}
        disabled={statusUpdating || profile?.status === 'Off Duty'}
        className={`py-4 rounded-2xl font-bold text-sm border-2 transition flex items-center justify-center gap-2 ${
          profile?.status === 'Off Duty'
            ? 'bg-slate-500 text-white border-slate-500 shadow-md cursor-default'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
        } disabled:opacity-60`}
      >
        <span className="text-lg">⚫</span>
        <span>Off Duty</span>
      </button>
    </div>
  )}

  {profile?.status !== 'On Trip' && (
    <p className="text-xs text-slate-500 mt-4">
      ℹ️ When you accept a ride, your status changes to <b>On Trip</b> automatically. It returns to <b>Available</b> when you complete or cancel.
    </p>
  )}
</div>

      {/* Profile */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal Details</h2>
            <p className="text-xs text-slate-500">View or update your registered driver profile</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                disabled={!isEditing}
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                disabled={!isEditing}
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                disabled={!isEditing}
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                License Number
              </label>
              <input
                type="text"
                name="license_no"
                disabled={!isEditing}
                value={formData.license_no}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-md hover:bg-violet-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}