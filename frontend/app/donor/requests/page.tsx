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

  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      const [reqRes, profRes] = await Promise.all([
        fetch('http://localhost:5001/api/donor/requests/available', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5001/api/donor/profile', { headers: { Authorization: `Bearer ${token}` } }),
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
    setInviteLink(null);
    setModalOpen(true);
  };

  const generateInvite = async () => {
    if (!activeRequest) return;
    setModalError('');
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/donor/requests/${activeRequest.request_id}/generate-invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setInviteLink(data.inviteUrl);
      } else {
        setModalError(data.error || 'Failed to generate link.');
      }
    } catch {
      setModalError('Server error while generating invite link.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPledge = async () => {
    if (!activeRequest || tab !== 'SELF') return;
    setModalError('');
    if (!agreedTerms) {
      setModalError('You must agree to the Terms & Conditions before proceeding.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body = { type: 'SELF', agreedTerms };

      const res = await fetch(`http://localhost:5001/api/donor/requests/${activeRequest.request_id}/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        fetchData();
        router.push('/donor/donations');
      } else {
        setModalError(data.error || 'Failed to pledge');
      }
    } catch {
      setModalError('Server error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-slate-500 text-sm">Loading requests...</p>
    </div>
  );

  const renderBadge = (compatible: boolean) => {
    if (!compatible) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">⚠️ Not your type</span>;
    if (profile?.eligible_now) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✅ You can donate</span>;
    if (profile?.in_cooldown) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ Compatible · On cooldown</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">⚫ Compatible · Unavailable</span>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Blood Requests</h1>
          <p className="text-slate-500 mt-1">All pending requests · Your blood group: <b>{profile?.blood_group || '—'}</b></p>
          <p className="text-xs text-slate-400 mt-1">Total: {requests.length} pending</p>
        </div>
        <button onClick={fetchData} className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition border border-red-200">
          🔄 Refresh
        </button>
      </div>

      {profile?.in_cooldown && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">You&apos;re in the 90-day cooldown</p>
            <p className="text-amber-700 text-xs mt-1">You can&apos;t donate yourself right now, but you can still <b>refer other donors</b>. Eligible again on <b>{formatDateDhaka(profile.next_eligible_date)}</b>.</p>
          </div>
        </div>
      )}

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">{error}</div>}

      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-4">🔔</span>
          <h3 className="text-lg font-bold text-slate-900">No requests available</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((r) => {
            // FIX: Remaining calculation ONLY looks at actual fulfilled bags now, allowing unlimited pledges
            const remaining = r.units_needed - r.units_fulfilled;
            const progressPct = Math.min(100, Math.round((r.units_fulfilled / r.units_needed) * 100));
            const compatible = isCompatible(profile?.blood_group, r.blood_group_needed);

            return (
              <div key={r.request_id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🩸</span>
                    <span className="font-extrabold text-slate-900">Request #{r.request_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">{r.blood_group_needed}</span>
                    {renderBadge(compatible)}
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
                    <span className="text-xs font-bold text-slate-600">{r.units_fulfilled}/{r.units_needed} bags fulfilled</span>
                    <span className="text-xs font-bold text-amber-600">{remaining} bag{remaining !== 1 ? 's' : ''} remaining</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-rose-500" style={{ width: `${progressPct}%` }} />
                  </div>
                  {(r.units_pledged > 0 || r.units_pending > 0) && (
                    <div className="flex flex-wrap gap-3 text-[11px] mt-2">
                      {r.units_pledged > 0 && (
                        <span className="text-emerald-700 font-bold">
                          ✅ {r.units_pledged} pledge{r.units_pledged !== 1 ? 's' : ''} received
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>🕐 {timeAgoDhaka(r.request_date)}</span>
                </div>

                <button onClick={() => openModal(r)} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/25">
                  {compatible && profile?.eligible_now ? '❤️ Donate or Refer' : compatible ? '👥 Refer a Donor' : '👥 Refer a Compatible Donor'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-700 to-rose-600 p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black">#{activeRequest.request_id} · {activeRequest.blood_group_needed}</h3>
                  {/* FIX: Modal also reflects only fulfilled bags for remaining count */}
                  <p className="text-xs text-red-100 mt-1">
                    {activeRequest.units_needed - activeRequest.units_fulfilled} bag(s) remaining
                  </p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white text-lg font-bold">✕</button>
              </div>
            </div>

            <div className="flex border-b border-slate-200">
              <button onClick={() => setTab('SELF')} disabled={!isCompatible(profile?.blood_group, activeRequest.blood_group_needed) || !profile?.eligible_now} className={`flex-1 py-3 text-sm font-bold border-b-2 ${tab === 'SELF' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-slate-500'}`}>🩸 I&apos;ll Donate</button>
              <button onClick={() => setTab('REFERRED')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${tab === 'REFERRED' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-slate-500'}`}>👥 I&apos;ll Refer</button>
            </div>

            <div className="p-5 space-y-4">
              {modalError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{modalError}</div>}

              {tab === 'SELF' && (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm font-bold text-red-900 mb-1">Self Donation</p>
                    <p className="text-xs text-red-700">You&apos;ll donate <b>1 bag</b> of {activeRequest.blood_group_needed} blood.</p>
                    <label className="flex items-start gap-3 cursor-pointer pt-3 mt-3 border-t border-red-200">
                      <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600" />
                      <span className="text-xs text-red-800">I agree to the <Link href="/donor/terms" target="_blank" className="text-red-900 font-bold underline">Terms & Conditions</Link>.</span>
                    </label>
                  </div>
                </div>
              )}

              {tab === 'REFERRED' && (
                <div className="space-y-4">
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                    <p className="text-sm font-bold text-violet-900 mb-1">Invite an External Donor</p>
                    <p className="text-xs text-violet-700 leading-relaxed">
                      Generate a secure invite link to send to a friend via WhatsApp, Messenger, or SMS. When they register using your link, they will automatically be pledged to this emergency request!
                    </p>
                  </div>

                  {!inviteLink ? (
                    <button onClick={generateInvite} disabled={submitting} className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition shadow-md disabled:opacity-50">
                      {submitting ? 'Generating...' : '🔗 Generate Secure Invite Link'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase">Your Unique Invite Link:</p>
                      <div className="flex items-center gap-2">
                        <input type="text" readOnly value={inviteLink} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-600 text-xs font-mono outline-none" />
                        <button onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Link copied to clipboard!'); }} className="px-4 py-3 bg-slate-800 text-white font-bold text-xs rounded-xl">Copy</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              {tab === 'SELF' ? (
                <>
                  <button onClick={() => setModalOpen(false)} disabled={submitting} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl">Cancel</button>
                  <button onClick={submitPledge} disabled={submitting || !isCompatible(profile?.blood_group, activeRequest.blood_group_needed)} className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl">{submitting ? 'Submitting...' : 'Confirm Donation'}</button>
                </>
              ) : (
                <button onClick={() => setModalOpen(false)} className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition">Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}