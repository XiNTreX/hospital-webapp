import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Xintrex Hospital',
  description:
    'Terms and conditions governing the use of the Xintrex Hospital patient, donor, and driver portals.',
};

export default function TermsPage() {
  const lastUpdated = '25 September 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white font-black text-lg shadow-md">
              ✚
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-900 leading-tight">
                Xintrex Hospital
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Terms &amp; Conditions
              </p>
            </div>
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            ← Back to Sign Up
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: <b>{lastUpdated}</b> · Applies to all Patient, Blood Donor,
            Driver, Doctor, and Admin accounts on the Xintrex Hospital platform.
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account on the Xintrex Hospital platform (the
            &ldquo;Service&rdquo;), you confirm that you have read, understood, and agreed
            to be bound by these Terms &amp; Conditions. If you do not agree, you must not
            register for or use the Service.
          </p>
          <p>
            These Terms apply to all account types — Patient, Blood Donor, Driver, Doctor,
            and Admin — and are in addition to any specific terms disclosed in your portal.
            Where a role-specific section conflicts with the general terms, the
            role-specific section prevails for that role.
          </p>
        </Section>

        <Section title="2. Account Eligibility">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              You must be at least 18 years of age to register as a Blood Donor or Driver.
            </li>
            <li>
              Patients under 18 may use the Service only through a parent or legal
              guardian&rsquo;s account.
            </li>
            <li>
              You must provide accurate, current, and complete information during
              registration and keep it up to date.
            </li>
            <li>
              You may hold only one account. Creating multiple accounts to bypass
              restrictions, cooldowns, or bans is prohibited.
            </li>
          </ul>
        </Section>

        <Section title="3. Account Security">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              You are responsible for maintaining the confidentiality of your password.
            </li>
            <li>
              You must notify us immediately at{' '}
              <a href="mailto:support@xintrexhospital.com" className="text-blue-700 underline">
                support@xintrexhospital.com
              </a>{' '}
              if you suspect unauthorized access.
            </li>
            <li>
              You are responsible for all activity conducted through your account.
            </li>
            <li>
              Sharing credentials or impersonating another person is strictly prohibited
              and may result in immediate account termination.
            </li>
          </ul>
        </Section>

        <Section title="4. Data Collection and Privacy">
          <p>
            By registering, you consent to the collection, storage, and processing of the
            personal and health-related information you provide. This includes, but is not
            limited to:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Identity data: name, date of birth, gender, email, phone number, address.
            </li>
            <li>
              Health data (Patients and Donors): blood group, medical history, test
              results, prescriptions, and donation records.
            </li>
            <li>
              Vehicle and licensing data (Drivers): license number, ambulance assignment,
              and trip history.
            </li>
          </ul>
          <p>
            Your data is stored on secured servers and accessed only by authorized hospital
            staff and by you through your portal. We do not sell your personal data to
            third parties. Data may be disclosed when required by law or in a medical
            emergency.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Use the Service for any unlawful, fraudulent, or misleading purpose.
            </li>
            <li>
              Submit false medical information, fake test results, or fabricated donation
              records.
            </li>
            <li>
              Attempt to access other users&rsquo; accounts or data without authorization.
            </li>
            <li>
              Interfere with the operation of the Service, including via automated scripts
              or excessive requests.
            </li>
            <li>
              Post, transmit, or upload content that is abusive, threatening, or violates
              any applicable law.
            </li>
          </ul>
          <p>
            Violation may result in suspension or permanent termination of your account,
            and where appropriate, reporting to the relevant authorities.
          </p>
        </Section>

        <Section title="6. Patient Terms">
          <h3 className="mt-4 font-bold text-slate-900">6.1 Medical Information</h3>
          <p>
            You are responsible for ensuring that the medical information you provide is
            accurate. Incorrect information may lead to improper treatment. Always confirm
            details with your consultant during a physical consultation.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">6.2 Appointments</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Appointments can be booked up to <b>one month</b> in advance.
            </li>
            <li>
              You may hold only one active scheduled appointment with a given doctor at a
              time.
            </li>
            <li>
              Cancellations must be made through the portal. Repeated no-shows may limit
              your ability to book future appointments.
            </li>
          </ul>

          <h3 className="mt-6 font-bold text-slate-900">6.3 Emergency Services</h3>
          <p>
            The ambulance request feature is intended for genuine medical needs. Submitting
            false or prank requests is a criminal offence in Bangladesh and will result in
            immediate account termination and referral to authorities.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">6.4 Blood Requests</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>You may request between 1 and 5 units per request.</li>
            <li>
              Requests must have a genuine medical need with a valid future need date.
            </li>
            <li>
              Once donors pledge, you cannot cancel the request from the portal; contact
              the blood bank directly.
            </li>
          </ul>

          <h3 className="mt-6 font-bold text-slate-900">6.5 Records and Prescriptions</h3>
          <p>
            Digital prescriptions and test reports are for reference only. Official
            medical documents must be obtained from hospital reception.
          </p>
        </Section>

        <Section title="7. Blood Donor Terms">
          <h3 className="mt-4 font-bold text-slate-900">7.1 Eligibility &amp; Medical Fitness</h3>
          <p>To donate blood through this platform, you must:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Be between <b>18 and 60 years</b> of age.</li>
            <li>Weigh at least <b>50 kg</b>.</li>
            <li>
              Be in good general health and free from any condition that would make
              donation unsafe.
            </li>
            <li>
              Not have donated whole blood in the last <b>90 days</b> (or as advised by
              medical staff).
            </li>
            <li>Not be pregnant, breastfeeding, or within 6 months of childbirth.</li>
            <li>
              Be free from infectious diseases including HIV, Hepatitis B, Hepatitis C,
              and syphilis.
            </li>
            <li>
              Not have consumed alcohol in the last 24 hours or used recreational drugs.
            </li>
          </ul>

          <h3 className="mt-6 font-bold text-slate-900">7.2 Truthful Disclosure</h3>
          <p>
            You must truthfully answer all medical screening questions. Concealing risk
            factors endangers the recipient&rsquo;s life and may lead to legal
            consequences. All donated blood is screened before use.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">7.3 Donation Commitments</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              When you pledge to donate (either directly or via a referral), you commit to
              donating blood for that specific request.
            </li>
            <li>
              You must confirm your donation through the portal once it has been made.
            </li>
            <li>
              Repeated cancellations or no-shows will affect your eligibility to pledge in
              the future.
            </li>
          </ul>

          <h3 className="mt-6 font-bold text-slate-900">7.4 Referrals</h3>
          <p>
            When you refer another registered donor, you confirm that you have personally
            spoken with that donor and that they have agreed to be referred. You must not
            refer someone without their consent.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">7.5 Data Visibility</h3>
          <p>
            Your name, blood group, and availability status are visible to other donors who
            may wish to refer you. Your phone number and email are visible only to a donor
            who has successfully referred you, and to hospital staff. You may mark yourself
            as &ldquo;Unavailable&rdquo; at any time to stop appearing in the referral list.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">7.6 Post-Donation Cooldown</h3>
          <p>
            After a completed donation, you will automatically enter a <b>90-day
            cooldown</b>. During this period, you cannot donate again or change your
            availability status. You can still refer other donors.
          </p>
        </Section>

        <Section title="8. Driver Terms">
          <h3 className="mt-4 font-bold text-slate-900">8.1 Licensing</h3>
          <p>
            You must hold a valid, unexpired driving license with authorization to operate
            commercial vehicles. Providing a false license number will result in immediate
            rejection of your application and a permanent ban.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">8.2 Approval Process</h3>
          <p>
            Driver accounts are subject to admin approval. Your application will not grant
            you portal access until it has been reviewed and approved.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">8.3 Trip Responsibilities</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Accept requests only when you are physically fit and your vehicle is
              roadworthy.
            </li>
            <li>
              Update the trip status accurately at each stage (En Route, Arrived, Picked
              Up, Completed).
            </li>
            <li>
              Treat patients and their families with dignity and respect. Do not discuss
              patient details with anyone outside the hospital.
            </li>
            <li>
              Follow all traffic laws. The hospital is not responsible for traffic
              violations committed by the driver.
            </li>
          </ul>

          <h3 className="mt-6 font-bold text-slate-900">8.4 Availability</h3>
          <p>
            Set yourself to <b>Off Duty</b> when you are not available for trips. The
            system will not assign you new requests while you are Off Duty or On Trip.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">8.5 Cancellation</h3>
          <p>
            You may cancel an accepted trip only before you begin the trip. Cancelling
            after arrival or during transit will be logged and may lead to suspension.
          </p>

          <h3 className="mt-6 font-bold text-slate-900">8.6 Confidentiality</h3>
          <p>
            You may see patient names, phone numbers, and pickup/drop locations. This
            information is confidential and must not be shared, recorded, or used for any
            purpose outside the assigned trip.
          </p>
        </Section>

        <Section title="9. Doctor and Admin Terms">
          <p>
            Doctor and Admin accounts are provisioned internally by the hospital. By
            accepting such an account, you agree to:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Maintain the confidentiality of all patient information in accordance with
              medical ethics and applicable law.
            </li>
            <li>
              Use the portal only for its intended clinical or administrative purpose.
            </li>
            <li>
              Not share your credentials or delegate portal access to unauthorized
              persons.
            </li>
            <li>
              Report any suspected data breach or unusual system behavior to the hospital
              IT team immediately.
            </li>
          </ul>
        </Section>

        <Section title="10. Suspension and Termination">
          <p>
            We may suspend or terminate your account at our discretion if you violate
            these Terms, provide false information, or use the Service in a manner that
            endangers other users or the hospital. You may also delete your account at any
            time by contacting support.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Material changes will be
            communicated via email or through the portal. Continued use of the Service
            after changes are posted constitutes your acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            The Service is a coordination and record-keeping tool. It does not replace
            professional medical advice, diagnosis, or treatment. Always seek the advice
            of a qualified medical professional for any health concern.
          </p>
        </Section>

        <Section title="13. Governing Law">
          <p>
            These Terms are governed by the laws of the People&rsquo;s Republic of
            Bangladesh. Any dispute arising out of or relating to these Terms shall be
            subject to the exclusive jurisdiction of the courts of Dhaka.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For questions about these Terms, or to report a violation, contact us at:
          </p>
          <ul className="list-none space-y-1 pl-0">
            <li>
              📧{' '}
              <a href="mailto:legal@xintrexhospital.com" className="text-blue-700 underline">
                legal@xintrexhospital.com
              </a>
            </li>
            <li>📞 +880 1900-000000 (24/7)</li>
            <li>📍 Xintrex Hospital, Dhanmondi, Dhaka, Bangladesh</li>
          </ul>
        </Section>

        <div className="mt-16 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
          <p className="text-sm font-semibold text-blue-900">
            By ticking the checkbox during signup, you confirm that you have read and
            agreed to these Terms &amp; Conditions.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-block rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition"
          >
            Return to Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-extrabold text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}