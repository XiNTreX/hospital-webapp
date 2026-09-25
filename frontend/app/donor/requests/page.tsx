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
  units_pending: number;
  request_date: string;
  need_date: string;
  status: string;
  patient_notes: string | null;
  first_name: string;
  last_name: string;
  my_pledged_count: string;
}

interface ReferralCandidate {
  donor_id: number;
  name: string;
  blood_group: string;
  last_donation_date: string | null;
}

const CAN_DONATE_TO: Record<string, string[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

const isCompatible = (donorBG: string | undefined, neededBG: string) =>
  !!donorBG && (CAN_DONATE_TO[donorBG] || []).includes(neededBG);

export default function DonorRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
  const [tab, setTab] = useState<'SELF' | 'REFERRED'>('SELF');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [candidates, setCandidates] = useState<ReferralCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedDonorIds, setSelectedDonorIds] = useState<number[]>([]);

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

  const openModal = async (req: BloodRequest) => {
    setActiveRequest(req);
    const selfCompatible = isCompatible(profile?.blood_group, req.blood_group_needed);
    const canSelf = profile?.eligible_now === true && selfCompatible;
    setTab(canSelf ? 'SELF' : 'REFERRED');
    setAgreedTerms(false);
    setModalError('');
    setSelectedDonorIds([]);
    setCandidates([]);
    setModalOpen(true);

    setCandidatesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5001/api/donor/referral-candidates?blood_group_needed=${encodeURIComponent(
          req.blood_group_needed
        )}&request_id=${req.request_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setCandidates(await res.json());
    } catch {
      /* silent */
    } finally {
      setCandidatesLoading(false);
    }
  };

  const toggleDonor = (donorId: number) => {
    if (!activeRequest) return;
    const remaining =
      activeRequest.units_needed -
      activeRequest.units_pledged -
      (activeRequest.units_pending || 0);
    setSelectedDonorIds((prev) => {
      if (prev.includes(donorId)) return prev.filter((id) => id !== donorId);
      if (prev.length >= remaining) return prev;
      return [...prev, donorId];
    });
  };

  const submitPledge = async () => {
    if (!activeRequest) return;
    setModalError('');
    if (!agreedTerms) {
      setModalError('You must agree to the Terms & Conditions before proceeding.');
      return;
    }
    if (tab === 'REFERRED' && selectedDonorIds.length === 0) {
      setModalError('Please select at least one donor to refer.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { type: tab, agreedTerms };
      if (tab === 'REFERRED') body.referredDonorIds = selectedDonorIds;

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

  const selfCompatibleWithActive = activeRequest
    ? isCompatible(profile?.blood_group, activeRequest.blood_group_needed)
    : false;
  const canSelfDonate = profile?.eligible_now === true && selfCompatibleWithActive;

  // Helper to render the per-card eligibility badge
  const renderBadge = (compatible: boolean) => {
    if (!compatible) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          ⚠️ Not your type
        </span>
      );
    }
    if (profile?.eligible_now) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
          ✅ You can donate
        </span>
      );
    }
    if (profile?.in_cooldown) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
          ⏳ Compatible · On cooldown
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        ⚫ Compatible · Unavailable
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Blood Requests</h1>
          <p className="text-slate-500 mt-1">
            All pending requests · Your blood group:{' '}
            <b>{profile?.blood_group || '—'}</b>
          </p>
          <p className="text-xs text-slate-400 mt-1">Total: {requests.length} pending</p>
        </div>
        <button
          onClick={fetchData}
          className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition border border-red-200"
        >
          🔄 Refresh
        </button>
      </div>

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
            <p className="font-bold text-slate-700 text-sm">
              You&apos;ve marked yourself as Unavailable
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Toggle to <b>Available</b> in your dashboard to donate yourself, or refer someone
              else here.
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
            There are no pending blood requests right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((r) => {
            const remaining =
              r.units_needed - r.units_pledged - (r.units_pending || 0);
            const myPledged = parseInt(r.my_pledged_count || '0');
            const progressPct = Math.min(
              100,
              Math.round((r.units_fulfilled / r.units_needed) * 100)
            );
            const compatible = isCompatible(profile?.blood_group, r.blood_group_needed);

            return (
              <div
                key={r.request_id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🩸</span>
                    <span className="font-extrabold text-slate-900">
                      Request #{r.request_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      {r.blood_group_needed}
                    </span>
                    {renderBadge(compatible)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Patient
                    </p>
                    <p className="font-bold text-slate-800 text-sm">
                      {r.first_name} {r.last_name}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Needed by
                    </p>
                    <p className="font-bold text-slate-800 text-sm">
                      {formatDateDhaka(r.need_date)}
                    </p>
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
                  {(r.units_pledged > 0 || r.units_pending > 0) && (
                    <div className="flex flex-wrap gap-3 text-[11px] mt-2">
                      {r.units_pledged > 0 && (
                        <span className="text-emerald-700 font-bold">
                          ✅ {r.units_pledged} bag
                          {r.units_pledged !== 1 ? 's' : ''} confirmed
                        </span>
                      )}
                      {r.units_pending > 0 && (
                        <span className="text-amber-600 font-bold">
                          ⏳ {r.units_pending} awaiting approval
                        </span>
                      )}
                    </div>
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
                  {compatible && profile?.eligible_now
                    ? '❤️ Donate or Refer'
                    : compatible
                    ? '👥 Refer a Donor'
                    : '👥 Refer a Compatible Donor'}
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
            <div className="bg-gradient-to-r from-red-700 to-rose-600 p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-100">
                    Blood Request
                  </p>
                  <h3 className="text-xl font-black">
                    #{activeRequest.request_id} · {activeRequest.blood_group_needed}
                  </h3>
                  <p className="text-xs text-red-100 mt-1">
                    {activeRequest.units_needed -
                      activeRequest.units_pledged -
                      (activeRequest.units_pending || 0)}{' '}
                    bag(s) remaining
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

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {modalError}
                </div>
              )}

              {tab === 'SELF' && (
                <div className="space-y-3">
                  {!selfCompatibleWithActive ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                      <p className="text-sm font-bold text-rose-900 mb-1">
                        ⚠️ Your blood group can&apos;t donate to this request
                      </p>
                      <p className="text-xs text-rose-700">
                        You are <b>{profile?.blood_group}</b>. This request needs{' '}
                        <b>{activeRequest.blood_group_needed}</b>. Your blood type is not
                        compatible with the patient&apos;s.
                      </p>
                      <button
                        onClick={() => setTab('REFERRED')}
                        className="mt-3 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Refer a Donor Instead →
                      </button>
                    </div>
                  ) : !profile?.eligible_now ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <p className="text-sm font-bold text-amber-900 mb-1">
                        ⏳ You can&apos;t donate right now
                      </p>
                      <p className="text-xs text-amber-700">
                        {profile?.in_cooldown
                          ? `You're in the 90-day cooldown. Eligible again on ${formatDateDhaka(
                              profile.next_eligible_date
                            )}.`
                          : 'You are currently marked as unavailable.'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                      <p className="text-sm font-bold text-red-900 mb-1">Self Donation</p>
                      <p className="text-xs text-red-700">
                        You&apos;ll donate <b>1 bag</b> of {activeRequest.blood_group_needed}{' '}
                        blood.
                      </p>
                      <ul className="text-xs text-red-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Blood group compatible: ✅ {profile?.blood_group}</li>
                        <li>Cooldown complete: ✅ (90+ days)</li>
                        <li>You confirm physically fit to donate</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {tab === 'REFERRED' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs text-amber-800">
                      📋 Select up to{' '}
                      <b>
                        {activeRequest.units_needed -
                          activeRequest.units_pledged -
                          (activeRequest.units_pending || 0)}
                      </b>{' '}
                      registered donor(s). They must be available, eligible, and compatible
                      with {activeRequest.blood_group_needed}.
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      ⓘ The referral will only count once the donor accepts it.
                    </p>
                  </div>

                  {candidatesLoading ? (
                    <p className="text-center text-slate-400 py-6 text-sm">
                      Loading eligible donors...
                    </p>
                  ) : candidates.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                      No compatible donors are currently available in the network.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {candidates.map((c) => {
                        const checked = selectedDonorIds.includes(c.donor_id);
                        return (
                          <label
                            key={c.donor_id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                              checked
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDonor(c.donor_id)}
                              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900">{c.name}</p>
                              <p className="text-xs text-slate-500">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold mr-2">
                                  {c.blood_group}
                                </span>
                                {c.last_donation_date
                                  ? `Last donated ${formatDateDhaka(c.last_donation_date)}`
                                  : 'First-time donor'}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {selectedDonorIds.length > 0 && (
                    <p className="text-xs text-slate-500 text-center font-medium">
                      {selectedDonorIds.length} donor
                      {selectedDonorIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}

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
                disabled={submitting || (tab === 'SELF' && !canSelfDonate)}
                className="flex-1 py-3 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-800 hover:to-rose-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-500/25 disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting...'
                  : tab === 'SELF'
                  ? 'Confirm Donation'
                  : `Send ${selectedDonorIds.length} Referral${
                      selectedDonorIds.length !== 1 ? 's' : ''
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}