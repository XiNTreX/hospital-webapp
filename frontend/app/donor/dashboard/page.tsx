'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateDhaka } from '../../utils/dhakaDate';

interface DonorProfile {
  donor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  blood_group: string;
  eligibility: boolean;
  last_donation_date: string | null;
  donation_count: number;
  in_cooldown: boolean;
  eligible_now: boolean;
  next_eligible_date: string | null;
}

interface Stats {
  self_fulfilled: string;
  referred_fulfilled: string;
  self_active: string;
  referred_active: string;
}

export default function DonorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    try {
      const [profRes, statRes] = await Promise.all([
        fetch('http://localhost:5001/api/donor/profile', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5001/api/donor/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profRes.ok) {
        const d = await profRes.json();
        setProfile(d);
        setFormData({ first_name: d.first_name, last_name: d.last_name, phone: d.phone });
      } else if (profRes.status === 401) {
        router.push('/login');
      }
      if (statRes.ok) setStats(await statRes.json());
    } catch {
      setMessage({ text: 'Server connection error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/donor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
        fetchAll();
      } else {
        setMessage({ text: data.error || 'Failed to update.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Server connection error.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    setTogglingAvail(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/donor/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eligibility: !profile.eligibility }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => (p ? { ...p, eligibility: !p.eligibility, eligible_now: !p.eligibility && !p.in_cooldown } : null));
        setMessage({ text: data.message, type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to update.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Server connection error.', type: 'error' });
    } finally {
      setTogglingAvail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // --- Banner eligibility state ---
  let pillIcon = '✅';
  let pillLabel = 'Eligible to donate';
  let pillBg = 'bg-emerald-500/20';
  let pillBorder = 'border-emerald-400/40';
  let pillText = 'text-emerald-100';
  let pillDot = 'bg-emerald-500';

  if (profile?.in_cooldown) {
    pillIcon = '🔴';
    pillLabel = 'In 90-day cooldown';
    pillBg = 'bg-red-500/30';
    pillBorder = 'border-red-300/50';
    pillText = 'text-red-100';
    pillDot = 'bg-red-400';
  } else if (!profile?.eligibility) {
    pillIcon = '⚫';
    pillLabel = 'Currently unavailable';
    pillBg = 'bg-slate-500/30';
    pillBorder = 'border-slate-300/50';
    pillText = 'text-slate-100';
    pillDot = 'bg-slate-400';
  }

  const cooldownDays = profile?.next_eligible_date
    ? Math.max(0, Math.ceil((new Date(profile.next_eligible_date).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950 via-red-900 to-rose-900 p-6 sm:p-8 text-white shadow-xl border border-red-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-400/30 mb-3">
              🩸 Blood Donor Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Blood Group <b className="text-white">{profile?.blood_group}</b> · Lifetime donations: {profile?.donation_count || 0}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 ${pillBg} backdrop-blur-sm rounded-2xl border ${pillBorder}`}>
            <span className={`inline-block h-3 w-3 rounded-full ${pillDot} ${!profile?.in_cooldown && profile?.eligibility ? 'animate-pulse' : ''}`} />
            <div>
              <p className={`text-[10px] uppercase tracking-wider ${pillText} font-bold`}>Status</p>
              <p className="text-sm font-black text-white">
                {pillIcon} {pillLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Availability / Cooldown card */}
      {profile?.in_cooldown ? (
        <div className="rounded-3xl border-2 border-red-200 bg-red-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🔴</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-900">In Cooldown</h2>
              <p className="text-sm text-red-800 mt-1">
                You must wait 90 days between whole blood donations.
              </p>
              <p className="text-sm text-red-700 mt-2 font-semibold">
                Eligible again on {formatDateDhaka(profile.next_eligible_date)} · {cooldownDays} day{cooldownDays !== 1 ? 's' : ''} left
              </p>
              <p className="text-xs text-red-600 mt-3">
                ℹ️ You can still <Link href="/donor/requests" className="underline font-bold">refer other donors</Link> to help patients.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-bold text-slate-900">Availability</h2>
            <p className="text-xs text-slate-500">
              Choose whether you&apos;re available to donate. You can still refer donors when unavailable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleAvailability}
              disabled={togglingAvail || profile?.eligibility === true}
              className={`py-4 rounded-2xl font-bold text-sm border-2 transition flex items-center justify-center gap-2 ${
                profile?.eligibility
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30 cursor-default'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
              } disabled:opacity-60`}
            >
              <span className="text-lg">🟢</span>
              <span>Available</span>
            </button>
            <button
              onClick={toggleAvailability}
              disabled={togglingAvail || profile?.eligibility === false}
              className={`py-4 rounded-2xl font-bold text-sm border-2 transition flex items-center justify-center gap-2 ${
                !profile?.eligibility
                  ? 'bg-slate-500 text-white border-slate-500 shadow-md cursor-default'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              } disabled:opacity-60`}
            >
              <span className="text-lg">⚫</span>
              <span>Unavailable</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            ℹ️ Toggle is disabled during cooldown.
          </p>
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Your Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-3xl mb-1">🩸</p>
              <p className="text-2xl font-black text-red-700">{stats.self_fulfilled}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Self donations</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-3xl mb-1">👥</p>
              <p className="text-2xl font-black text-amber-700">{stats.referred_fulfilled}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Referrals fulfilled</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-3xl mb-1">⏳</p>
              <p className="text-2xl font-black text-blue-700">{stats.self_active}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Active pledges</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
              <p className="text-3xl mb-1">🤝</p>
              <p className="text-2xl font-black text-violet-700">{stats.referred_active}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Active referrals</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/donor/requests"
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20 border border-red-400/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-xl shadow-md transition-transform group-hover:scale-110">
                🔔
              </div>
              <h3 className="text-base font-bold text-white">Available Requests</h3>
            </div>
            <p className="text-xs text-red-100 leading-relaxed">See pending blood requests matching your group.</p>
          </Link>

          <Link
            href="/donor/donations"
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-xl shadow-md transition-transform group-hover:scale-110">
                ✅
              </div>
              <h3 className="text-base font-bold text-white">My Donations</h3>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">Track your personal donation history.</p>
          </Link>

          <Link
            href="/donor/referred"
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-amber-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-amber-500/20 border border-amber-400/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-xl shadow-md transition-transform group-hover:scale-110">
                👥
              </div>
              <h3 className="text-base font-bold text-white">Referred</h3>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">Donations you referred to others.</p>
          </Link>

          <button
            onClick={() => {
              const el = document.getElementById('profile-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/20 border border-slate-400/30 text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-xl shadow-md transition-transform group-hover:scale-110">
                👤
              </div>
              <h3 className="text-base font-bold text-white">Edit Profile</h3>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed">Update your personal details.</p>
          </button>
        </div>
      </div>

      {/* Profile */}
      <div id="profile-section" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal Details</h2>
            <p className="text-xs text-slate-500">View or update your registered donor profile</p>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Blood Group</label>
              <input
                type="text"
                value={profile?.blood_group || ''}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                🔒 Blood group can only be changed by hospital staff. Contact support.
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-red-700 text-white font-bold text-sm shadow-md hover:bg-red-800 transition disabled:opacity-50"
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