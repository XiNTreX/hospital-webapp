'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateDhaka, timeAgoDhaka } from '../../utils/dhakaDate';

interface BloodRequest {
  request_id: number;
  blood_group_needed: string;
  units_needed: number;
  units_pledged: number;
  units_fulfilled: number;
  request_date: string;
  need_date: string;
  status: string;
  patient_notes: string | null;
  first_name: string;
  last_name: string;
  my_pledged_count: string;
}

interface ReferredDonor {
  name: string;
  phone: string;
  blood_group: string;
  age: string;
  last_donation_date: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [tab, setTab] = useState<'SELF' | 'REFERRED'>('SELF');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [referrals, setReferrals] = useState<ReferredDonor[]>([
    { name: '', phone: '', blood_group: 'O+', age: '', last_donation_date: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const [reqRes, profRes] = await Promise.all([
        fetch('http://localhost:5001/api/donor/requests/available', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5001/api/donor/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      else if (reqRes.status === 401) router.push('/login');
      else setError('Failed to load requests');
      if (profRes.ok) setProfile(await profRes.json());
    } catch {
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (req: BloodRequest) => {
    setActiveRequest(req);
    setTab(profile?.eligible_now ? 'SELF' : 'REFERRED');
    setAgreedTerms(false);
    setModalError('');
    setReferrals([{ name: '', phone: '', blood_group: 'O+', age: '', last_donation_date: '' }]);
    setModalOpen(true);
  };

  const addReferral = () => {
    if (!activeRequest) return;
    const remaining = activeRequest.units_needed - activeRequest.units_pledged;
    if (referrals.length >= remaining) return;
    setReferrals([...referrals, { name: '', phone: '', blood_group: 'O+', age: '', last_donation_date: '' }]);
  };

  const removeReferral = (idx: number) => {
    if (referrals.length <= 1) return;
    setReferrals(referrals.filter((_, i) => i !== idx));
  };

  const updateReferral = (idx: number, field: keyof ReferredDonor, value: string) => {
    setReferrals(referrals.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const submitPledge = async () => {
    if (!activeRequest) return;
    setModalError('');
    if (!agreedTerms) {
      setModalError('You must agree to the Terms & Conditions before proceeding.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { type: tab, agreedTerms };

      if (tab === 'REFERRED') {
        // Validate all referral fields
        for (const r of referrals) {
          if (!r.name.trim() || !r.phone.trim() || !r.age) {
            setModalError('Please fill all referral fields (name, phone, blood group, age).');
            setSubmitting(false);
            return;
          }
        }
        body.referredDonors = referrals.map((r) => ({
          name: r.name.trim(),
          phone: r.phone.trim(),
          blood_group: r.blood_group,
          age: parseInt(r.age),
          last_donation_date: r.last_donation_date || null,
        }));
      }

      const res = await fetch(
        `http://localhost:5001/api/donor/requests/${activeRequest.request_id}/pledge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        fetchData();
        if (tab === 'SELF') router.push('/donor/donations');
        else router.push('/donor/referred');
      } else {
        setModalError(data.error || 'Failed to pledge');
      }
    } catch {
      setModalError('Server error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm">Loading requests...</p>
      </div>
    );
  }

  const canSelfDonate = profile?.eligible_now === true;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Blood Requests</h1>
          <p className="text-slate-500 mt-1">Requests compatible with your blood group ({profile?.blood_group || '—'})</p>
          <p className="text-xs text-slate-400 mt-1">Total: {requests.length} pending</p>
        </div>
        <button
          onClick={fetchData}
          className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition border border-red-200"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Cooldown banner */}
      {profile?.in_cooldown && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">You&apos;re in the 90-day cooldown</p>
            <p className="text-amber-700 text-xs mt-1">
              You can&apos;t donate yourself right now, but you can still <b>refer other donors</b>.
              Eligible again on <b>{formatDateDhaka(profile.next_eligible_date)}</b>.
            </p>
          </div>
        </div>
      )}

      {!profile?.in_cooldown && !profile?.eligibility && (
        <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">⚫</span>
          <div className="flex-1">
            <p className="font-bold text-slate-700 text-sm">You&apos;ve marked yourself as Unavailable</p>
            <p className="text-slate-600 text-xs mt-1">
              Toggle to <b>Available</b> in your dashboard to donate yourself, or refer someone else here.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-4">🔔</span>
          <h3 className="text-lg font-bold text-slate-900">No requests available</h3>
          <p className="text-slate-500 text-sm mt-1">
            There are no pending requests compatible with your blood group right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((r) => {
            const remaining = r.units_needed - r.units_pledged;
            const myPledged = parseInt(r.my_pledged_count || '0');
            const progressPct = Math.min(100, Math.round((r.units_fulfilled / r.units_needed) * 100));
            return (
              <div key={r.request_id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🩸</span>
                    <span className="font-extrabold text-slate-900">Request #{r.request_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      {r.blood_group_needed}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Pending
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Patient</p>
                    <p className="font-bold text-slate-800 text-sm">{r.first_name} {r.last_name}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Needed by</p>
                    <p className="font-bold text-slate-800 text-sm">{formatDateDhaka(r.need_date)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">
                      {r.units_fulfilled}/{r.units_needed} bags fulfilled
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {remaining} bag{remaining !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {r.units_pledged > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {r.units_pledged} bag{r.units_pledged !== 1 ? 's' : ''} already pledged by other donors
                    </p>
                  )}
                </div>

                {r.patient_notes && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <span className="font-bold">Notes:</span> {r.patient_notes}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>🕐 {timeAgoDhaka(r.request_date)}</span>
                  {myPledged > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✅ You pledged {myPledged}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => openModal(r)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-800 hover:to-rose-700 text-white font-bold text-sm transition shadow-lg shadow-red-500/25"
                >
                  {canSelfDonate ? '❤️ Donate or Refer' : '👥 Refer a Donor'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pledge Modal */}
      {modalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-700 to-rose-600 p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-100">Blood Request</p>
                  <h3 className="text-xl font-black">#{activeRequest.request_id} · {activeRequest.blood_group_needed}</h3>
                  <p className="text-xs text-red-100 mt-1">
                    {activeRequest.units_needed - activeRequest.units_pledged} bag(s) remaining
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/80 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setTab('SELF')}
                disabled={!canSelfDonate}
                className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${
                  tab === 'SELF'
                    ? 'border-red-600 text-red-700 bg-red-50'
                    : 'border-transparent text-slate-500 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                🩸 I&apos;ll Donate
              </button>
              <button
                onClick={() => setTab('REFERRED')}
                className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${
                  tab === 'REFERRED'
                    ? 'border-red-600 text-red-700 bg-red-50'
                    : 'border-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                👥 I&apos;ll Refer
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {modalError}
                </div>
              )}

              {tab === 'SELF' && (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm font-bold text-red-900 mb-1">Self Donation</p>
                    <p className="text-xs text-red-700">
                      You&apos;ll donate <b>1 bag</b> of {activeRequest.blood_group_needed} blood.
                    </p>
                    <ul className="text-xs text-red-600 mt-2 space-y-1 list-disc list-inside">
                      <li>Blood group compatible: ✅ {profile?.blood_group}</li>
                      <li>Cooldown complete: ✅ (90+ days)</li>
                      <li>You confirm physically fit to donate</li>
                    </ul>
                  </div>
                </div>
              )}

              {tab === 'REFERRED' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs text-amber-800">
                      📋 Each referred person donates <b>1 bag</b>. Add up to {activeRequest.units_needed - activeRequest.units_pledged} referrals.
                    </p>
                  </div>

                  {referrals.map((rd, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Referral #{idx + 1}</span>
                        {referrals.length > 1 && (
                          <button
                            onClick={() => removeReferral(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Full name"
                        value={rd.name}
                        onChange={(e) => updateReferral(idx, 'name', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={rd.phone}
                          onChange={(e) => updateReferral(idx, 'phone', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                        />
                        <input
                          type="number"
                          placeholder="Age (18-60)"
                          min={18}
                          max={60}
                          value={rd.age}
                          onChange={(e) => updateReferral(idx, 'age', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={rd.blood_group}
                          onChange={(e) => updateReferral(idx, 'blood_group', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500 bg-white"
                        >
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          placeholder="Last donation"
                          value={rd.last_donation_date}
                          onChange={(e) => updateReferral(idx, 'last_donation_date', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Leave last donation empty if they&apos;ve never donated.
                      </p>
                    </div>
                  ))}

                  {referrals.length < activeRequest.units_needed - activeRequest.units_pledged && (
                    <button
                      onClick={addReferral}
                      className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                    >
                      + Add another referral
                    </button>
                  )}
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-slate-100">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I have read and agree to the{' '}
                  <Link
                    href="/donor/terms"
                    target="_blank"
                    className="text-red-700 font-bold underline"
                  >
                    Terms &amp; Conditions and Medical Fitness Criteria
                  </Link>
                  {tab === 'SELF'
                    ? ' and I confirm I am physically fit to donate blood.'
                    : ' and I confirm each referred person is physically fit and has met all criteria.'}
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitPledge}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-800 hover:to-rose-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-500/25 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Pledge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}