'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FEF2F2] text-slate-800">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-red-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-700 to-rose-500 text-white font-black text-xl shadow-md">
            🩸
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Terms &amp; Medical Fitness Criteria
            </h1>
            <p className="text-[11px] text-slate-500">Blood Donor Network · Xintrex Hospital</p>
          </div>
        </div>
        <Link
          href="/donor/dashboard"
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
        >
          ← Back
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black text-red-900 mb-1">Terms &amp; Conditions</h2>
          <p className="text-sm text-slate-500 mb-6">
            By proceeding with a donation (self or referred), you agree to the following.
          </p>

          {/* Section 1 */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              1. General Consent
            </h3>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>I am voluntarily donating blood or referring a donor, without any coercion.</li>
              <li>I understand that blood donation is a medical procedure and carries minor risks (dizziness, bruising, fainting).</li>
              <li>I confirm the information I provide is accurate to the best of my knowledge.</li>
              <li>I understand that providing false medical information may harm the recipient and is legally punishable.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              2. Medical Fitness Criteria
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              I confirm that <b>the donor</b> (myself for self-donation, or each referred person) meets ALL of the following criteria:
            </p>
            <div className="space-y-3">
              {[
                { label: 'Age', detail: 'I am between 18 and 60 years old.' },
                { label: 'Weight', detail: 'I weigh at least 50 kg.' },
                { label: 'Blood-borne diseases', detail: 'I do NOT have Hepatitis B, Hepatitis C, HIV/AIDS, Syphilis, or Malaria.' },
                { label: 'Recent illness', detail: 'I have NOT had fever, cold, cough, sore throat, or infection in the last 7 days.' },
                { label: 'Antibiotics', detail: 'I am NOT currently on antibiotics or completed a course within the last 7 days.' },
                { label: 'Tattoo / Piercing', detail: 'I have NOT had a tattoo, piercing, or acupuncture in the last 6 months.' },
                { label: 'Surgery', detail: 'I have NOT had major surgery in the last 6 months.' },
                { label: 'Dental work', detail: 'I have NOT had a tooth extraction in the last 72 hours.' },
                { label: 'Alcohol', detail: 'I have NOT consumed alcohol in the last 24 hours.' },
                { label: 'Chronic disease', detail: 'I do NOT have uncontrolled heart disease, cancer, epilepsy, or severe asthma.' },
                { label: 'Pregnancy / Lactation', detail: 'I am NOT pregnant, and not breastfeeding (applies to female donors).' },
                { label: 'Menstruation', detail: 'I am NOT currently menstruating (applies to female donors).' },
                { label: 'Medication', detail: 'I am NOT on blood thinners, insulin, or any disqualifying medication.' },
                { label: 'Cooldown', detail: 'It has been at least 90 days (3 months) since my last blood donation.' },
                { label: 'Recent vaccination', detail: 'It has been at least 14 days since my last vaccination (except flu shot).' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl">
                  <span className="mt-0.5 text-red-600 font-bold text-sm">✓</span>
                  <div>
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-slate-700 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              3. Referral Attestation
            </h3>
            <p className="text-sm text-slate-700 mb-2">
              If I refer someone, I confirm that:
            </p>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>I have personally verified the referred person meets all medical fitness criteria above.</li>
              <li>I have the referred person&apos;s explicit permission to submit their information.</li>
              <li>I understand that I am morally responsible if the referred person is found unfit or provides false information.</li>
              <li>The referred person will present themselves at the hospital&apos;s blood bank for final medical screening.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              4. Data Consent
            </h3>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>My information (name, phone, blood group, donation history) will be stored in the hospital network.</li>
              <li>My information will be shared with patients or their representatives when they need blood matching my group.</li>
              <li>For referrals, the referred person&apos;s name, phone, and blood group will be shared with the requesting patient.</li>
              <li>I can opt out of the network at any time via the donor dashboard.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              5. Liability Acknowledgment
            </h3>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>This platform is a <b>matchmaking service</b>. Final medical verification is done by the hospital&apos;s blood bank.</li>
              <li>The hospital reserves the right to reject any donor who fails screening, regardless of this pledge.</li>
              <li>I understand that providing false information may result in permanent account suspension and legal action.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              6. Cooldown &amp; Safety
            </h3>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>I understand a mandatory 90-day gap is required between whole blood donations for the safety of both donor and recipient.</li>
              <li>I will not attempt to bypass the cooldown by using a different account or providing false information.</li>
              <li>I will inform hospital staff immediately if I feel unwell after donation.</li>
            </ul>
          </section>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-red-700 to-rose-600 p-6 text-white shadow-lg">
          <h3 className="font-black text-lg mb-2">🧾 By proceeding with any pledge on this platform</h3>
          <p className="text-sm text-red-50">
            You confirm that you have read, understood, and agree to all the terms and medical
            criteria above. Your acceptance is logged with a timestamp on our servers.
          </p>
        </div>

        <div className="text-center pb-8">
          <Link
            href="/donor/dashboard"
            className="inline-block px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}