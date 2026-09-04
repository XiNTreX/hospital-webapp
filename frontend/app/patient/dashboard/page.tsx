'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PatientProfile {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  emergencyPhone: string;
}

export default function PatientDashboardPage() {
  const [profile, setProfile] = useState<PatientProfile>({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    gender: 'Male',
    emergencyPhone: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load patient details on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setProfile((prev) => ({
          ...prev,
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
          dob: parsed.dob || '',
          gender: parsed.gender || 'Male',
          emergencyPhone: parsed.emergencyPhone || '',
        }));
      } catch (e) {
        console.error('Failed to parse cached user data', e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5001/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
        // Sync local storage cache
        const updatedUser = { ...JSON.parse(localStorage.getItem('userData') || '{}'), ...profile };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      } else {
        setMessage({ text: data.error || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Server connection error. Is backend running?', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-sky-300 border border-sky-400/30 mb-3">
              🏥 Patient Portal Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile.firstName || 'Patient'} {profile.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Manage appointments, request emergency services, and view medical records.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium ${message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* QUICK EMERGENCY & CARE ACTIONS (HIGH CONTRAST ICONS) */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Quick Emergency & Care Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Book Appointment Card */}
          <Link
            href="/patient/appointments/book"
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md transition-transform group-hover:scale-110">
                🩺
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Book an Appointment
              </h3>
            </div>
            <p className="text-xs text-blue-100 font-medium leading-relaxed">
              Schedule a visit with specialized doctors.
            </p>
          </Link>

          {/* Request for Blood Card */}
          <Link
            href="/patient/blood-requests/new"  // 👈 This should link to /patient/blood-requests/new
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-400/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md transition-transform group-hover:scale-110">
                🩸
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Request for Blood
              </h3>
            </div>
            <p className="text-xs text-pink-100 font-medium leading-relaxed">
              Submit urgent blood requirements to network donors.
            </p>
          </Link>

          {/* Request for Ambulance Card */}
          <Link
            href="/patient/ambulance-requests/new"  // 👈 This should link to /patient/ambulance-requests/new
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-amber-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 border border-amber-400/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md transition-transform group-hover:scale-110">
                🚑
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Request for Ambulance
              </h3>
            </div>
            <p className="text-xs text-amber-100 font-medium leading-relaxed">
              Dispatch emergency transit to your live location.
            </p>
          </Link>

        </div>
      </div>

      {/* Patient Profile Details Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal & Emergency Details</h2>
            <p className="text-xs text-slate-500">View or update your registered patient profile information</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile Info'}
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
                name="firstName"
                disabled={!isEditing}
                value={profile.firstName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                disabled={!isEditing}
                value={profile.lastName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                disabled // Email address remains static/read-only
                value={profile.email}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                disabled={!isEditing}
                value={profile.dob}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Gender
              </label>
              <select
                name="gender"
                disabled={!isEditing}
                value={profile.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                disabled={!isEditing}
                value={profile.emergencyPhone}
                onChange={handleChange}
                placeholder="+8801700000000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}