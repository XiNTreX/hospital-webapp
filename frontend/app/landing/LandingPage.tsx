'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const NAVY_950 = '#071C33';
const NAVY_900 = '#0B2A4A';

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG, stroke-based)                                   */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };

function IconCalendar({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18M8 15h3" />
    </svg>
  );
}

function IconFlask({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2v6.5L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 8.5V2" />
      <path d="M8 2h8M7 15h10" />
    </svg>
  );
}

function IconStethoscope({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3v6a5 5 0 0 0 10 0V3" />
      <path d="M9 14v2a5 5 0 0 0 10 0v-3" />
      <circle cx="19" cy="10" r="2.2" />
    </svg>
  );
}

function IconPill({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M8.5 8.5l7 7" />
    </svg>
  );
}

function IconBed({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6v13M3 12h13a5 5 0 0 1 5 5v2M3 18h18" />
      <circle cx="8" cy="9.5" r="1.8" />
    </svg>
  );
}

function IconAmbulance({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 16V7a1 1 0 0 1 1-1h10v10M13 9h4.2a1 1 0 0 1 .8.4L21.4 13a1 1 0 0 1 .2.6V16" />
      <circle cx="6.5" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
      <path d="M2 16h2.7M8.3 16h4.7M19.3 16H22M8 9h1.5M10.7 9h1.5M9.5 7.3V9M9.5 9v1.7" />
    </svg>
  );
}

function IconDroplet({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.7s6.5 6.6 6.5 11a6.5 6.5 0 0 1-13 0c0-4.4 6.5-11 6.5-11z" />
      <path d="M9.2 14.5a3 3 0 0 0 2.6 2.7" />
    </svg>
  );
}

function IconMonitor({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8 21h8M12 17v4M6 10.5h2.5l1.5-2.5 2 5 1.5-2.5H18" />
    </svg>
  );
}

function IconPhone({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function IconClock({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconShield({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l7.5 3v6c0 5-3.2 8.4-7.5 10-4.3-1.6-7.5-5-7.5-10v-6z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

function IconArrowRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconCheck({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

function IconMenu({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconHeartPulse({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.5s-8-4.7-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.1c0 5.7-8 10.4-8 10.4z" />
      <path d="M5.5 12h3l1.5-2.5 2 4 1.5-2.5h5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll reveal wrapper                                              */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`rv transition-all duration-700 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Brand mark — uses /landing/logo.png when provided, falls back      */
/*  to a cross badge so the header never renders broken.               */
/* ------------------------------------------------------------------ */

function BrandMark({ size = 44 }: { onDark?: boolean; size?: number }) {
  const [logoOk, setLogoOk] = useState(true);

  if (!logoOk) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#1B5FAF] to-[#2E9C87] font-black text-white shadow-md"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden="true"
      >
        ✚
      </div>
    );
  }

  return (
    <Image
      src="/landing/logo-mark.png"
      alt="Divided and Unpopular Hospital and Diagnostic Center emblem"
      width={size}
      height={size}
      className="object-contain"
      onError={() => setLogoOk(false)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Static data — drawn from the existing project (seed doctors,       */
/*  helplines in the role layouts, specialties in the DB).             */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Doctors', href: '#doctors' },
  { label: 'Services', href: '#services' },
  { label: 'Blood Donation', href: '#blood-donation' },
  { label: 'Emergency', href: '#emergency' },
  { label: 'Admission', href: '#admission' },
  { label: 'Contact', href: '#contact' },
];

const FEATURED_DOCTORS = [
  {
    name: 'Dr. Farhana Rahman',
    specialty: 'Cardiology',
    degrees: 'MBBS, FCPS (Medicine)',
    photo: '/doctors/img14.jpg',
    fee: '৳1,500',
  },
  {
    name: 'Dr. Tariq Mahmud',
    specialty: 'Neurology',
    degrees: 'MBBS, MD (Neurology)',
    photo: '/doctors/img2.jpg',
    fee: '৳1,500',
  },
  {
    name: 'Dr. Nusrat Jahan',
    specialty: 'Pediatrics',
    degrees: 'MBBS, FCPS',
    photo: '/doctors/img15.jpg',
    fee: '৳1,000',
  },
  {
    name: 'Dr. Rafiqul Islam',
    specialty: 'Orthopedics',
    degrees: 'MBBS, MS (Ortho)',
    photo: '/doctors/img6.jpg',
    fee: '৳1,200',
  },
  {
    name: 'Dr. Kamal Hossain',
    specialty: 'General Surgery',
    degrees: 'MBBS, MS, FRCS',
    photo: '/doctors/img4.jpg',
    fee: '৳2,000',
  },
  {
    name: 'Dr. Laila Hasan',
    specialty: 'Oncology',
    degrees: 'MBBS, FCPS (Radiotherapy)',
    photo: '/doctors/img20.jpg',
    fee: '৳1,500',
  },
];
const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Gynecology',
  'General Surgery', 'Dermatology', 'Psychiatry', 'Oncology', 'Internal Medicine',
];

// const ADMISSION_STEPS = [
//   {
//     step: '01',
//     title: 'Consultation',
//     text: 'Meet a consultant in the outpatient department. Your history and initial findings are recorded digitally.',
//   },
//   {
//     step: '02',
//     title: 'Consultant Recommendation',
//     text: 'If your condition requires inpatient care, your consultant recommends admission with a care plan.',
//   },
//   {
//     step: '03',
//     title: 'Registration & Bed Allotment',
//     text: 'The admission desk registers you and allots a bed. Your stay is tracked in the hospital system.',
//   },
//   {
//     step: '04',
//     title: 'Treatment & Care',
//     text: 'Receive treatment under your consultant, with prescriptions, tests and notes maintained in one record.',
//   },
// ];

const ADMISSION_CONTACTS = [
  {
    icon: '📞',
    title: 'Call the Admission Desk',
    text: 'Speak directly with our 24/7 admission team for bed availability and intake questions.',
    action: '+880 1900-000000',
    href: 'tel:+8801900000000',
  },
  {
    icon: '✉️',
    title: 'Email Admissions',
    text: 'Send referrals, insurance details or general admission queries. We reply within 24 hours.',
    action: 'admission@xintrexhospital.com',
    href: 'mailto:admission@xintrexhospital.com',
  },
  {
    icon: '📍',
    title: 'Visit the Admission Office',
    text: 'Ground floor, next to the main reception. Open daily for walk-in admission support.',
    action: 'Divided and Unpopular Hospital & Diagnostic Center, Dhanmondi, Dhaka',
    href: '#location', // change to your maps link if you have one
  },
];

const EMERGENCY_HOTLINE = '+880 1700-000000';
const BLOOD_BANK_HOTLINE = '+880 1900-000000';

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroOk, setHeroOk] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-root min-h-screen bg-white text-slate-800">
      <style>{`
        html { scroll-behavior: smooth; }
        .landing-root { font-family: var(--font-body), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; }
        .font-display { font-family: var(--font-display), var(--font-body), ui-sans-serif, system-ui, sans-serif; }
        @media (prefers-reduced-motion: reduce) {
          .rv { transition: none !important; opacity: 1 !important; transform: none !important; }
          html { scroll-behavior: auto; }
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md'
            : 'border-b border-white/10 bg-gradient-to-b from-black/40 to-transparent'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Sign In — required top-left gateway into the existing auth page */}
          <Link
            href="/login"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#1B5FAF] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#1B5FAF]/25 transition hover:bg-[#14497F] focus:outline-none focus:ring-2 focus:ring-[#1B5FAF]/50 sm:px-5"
          >
            <IconShield className="h-4 w-4" />
            Sign In
          </Link>

          {/* Brand */}
          <Link href="#home" className="flex min-w-0 items-center gap-3">
            <BrandMark size={40} />
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span
                className={`font-display truncate text-[15px] font-extrabold tracking-tight ${
                  scrolled ? 'text-[#0B2A4A]' : 'text-white'
                }`}
              >
                Divided and Unpopular
              </span>
              <span
                className={`truncate text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                  scrolled ? 'text-slate-500' : 'text-white/70'
                }`}
              >
                Hospital &amp; Diagnostic Center
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Sections">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  scrolled
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-[#0B2A4A]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={`ml-auto rounded-lg p-2 transition lg:hidden ${
              scrolled ? 'text-[#0B2A4A] hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        {/* Mobile nav panel */}
        {menuOpen && (
          <nav
            className="border-t border-slate-200 bg-white px-4 pb-6 pt-2 shadow-xl lg:hidden"
            aria-label="Sections"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#0B2A4A]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#1B5FAF] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#14497F]"
            >
              <IconShield className="h-4 w-4" />
              Sign In to the Hospital Portal
            </Link>
          </nav>
        )}
      </header>

      {/* ================= 01 · HERO ================= */}
      <section id="home" className="relative flex min-h-[100svh] items-center overflow-hidden" style={{ backgroundColor: NAVY_950 }}>
        {/* Hospital building image — primary hero background */}
        {heroOk && (
          <Image
            src="/landing/hospital-building.jpg"
            alt="Divided and Unpopular Hospital and Diagnostic Center building"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            onError={() => setHeroOk(false)}
          />
        )}
        {/* Layered readability gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071C33]/95 via-[#0B2A4A]/80 to-[#071C33]/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/0 to-transparent" style={{ backgroundImage: 'linear-gradient(to top, rgba(7,28,51,0.9), transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071C33] to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-36 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Reveal>
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl bg-white/95 p-2.5 shadow-lg backdrop-blur">
                  <BrandMark size={64} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7FD1C0]">
                    Dhaka · Bangladesh
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">
                    Hospital &amp; Diagnostic Center
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
                Comprehensive care.
                <br />
                Advanced diagnostics.
                <br />
                <span className="text-[#5FC2AD]">Compassionate people.</span>
              </h1>
            </Reveal>

            <Reveal delay={240}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Divided and Unpopular Hospital and Diagnostic Center brings consultant-led
                treatment, a full diagnostic laboratory, a 24/7 ambulance network and a
                blood donor program together — in one coordinated system of care.
              </p>
            </Reveal>

            <Reveal delay={360}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#services"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold text-[#0B2A4A] shadow-xl transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  Explore Our Services
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/10"
                >
                  <IconShield className="h-4 w-4" />
                  Sign In
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Fact strip */}
          <Reveal delay={480}>
            <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/15 pt-8 sm:grid-cols-4">
              {[
                ['20+', 'Consultant doctors'],
                ['10', 'Clinical specialties'],
                ['24/7', 'Emergency & ambulance'],
                ['Digital', 'Prescriptions & reports'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-extrabold text-white sm:text-3xl">{value}</dt>
                  <dd className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ================= 02 · ABOUT / WHY US ================= */}
      <section id="about" className="scroll-mt-20 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#12876F]">
                  Who we are
                </p>
                <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#0B2A4A] sm:text-4xl">
                  One hospital, one connected standard of care
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-600">
                  We are a multidisciplinary hospital and diagnostic center in Dhaka. Outpatient
                  consultations, laboratory diagnostics, inpatient admission, a pharmacy, a blood
                  donor network and an ambulance fleet operate as a single coordinated system —
                  so your information follows you, not the paperwork.
                </p>
              </Reveal>

              <Reveal delay={140}>
                <div className="mt-8 flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="space-y-4">
              {[
                {
                  n: '01',
                  title: 'Consultant-led outpatient care',
                  text: 'Every appointment is with a named consultant across ten specialties, with transparent consultation fees published up front.',
                  icon: <IconStethoscope className="h-5 w-5" />,
                },
                {
                  n: '02',
                  title: 'Diagnostics under one roof',
                  text: 'Our laboratory handles your test queue from specimen collection to consultant-verified reports, delivered to your patient portal.',
                  icon: <IconFlask className="h-5 w-5" />,
                },
                {
                  n: '03',
                  title: 'Digital prescriptions & records',
                  text: 'Prescriptions, test reports and admission history are written into your digital record — readable by you and your care team, anytime.',
                  icon: <IconMonitor className="h-5 w-5" />,
                },
                {
                  n: '04',
                  title: 'Emergency support, day and night',
                  text: 'A 24/7 ambulance dispatch desk and an active blood donor network stand behind the hospital around the clock.',
                  icon: <IconClock className="h-5 w-5" />,
                },
              ].map((item, i) => (
                <Reveal key={item.n} delay={i * 110}>
                  <div className="group flex gap-5 rounded-2xl border border-slate-200/90 bg-white p-6 transition duration-300 hover:border-[#1B5FAF]/30 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2A4A]/5 text-[#1B5FAF] transition group-hover:bg-[#1B5FAF] group-hover:text-white">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-display text-[11px] font-bold tracking-[0.18em] text-slate-400">
                        {item.n}
                      </p>
                      <h3 className="font-display mt-1 text-lg font-bold text-[#0B2A4A]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 03 · DOCTORS ================= */}
      <section id="doctors" className="scroll-mt-20 bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#12876F]">
                Our medical team
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#0B2A4A] sm:text-4xl">
                Meet our consultants
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Twenty consultants practice across our ten specialties. These are a few of the
                senior physicians you can be referred to.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_DOCTORS.map((doc, i) => (
              <Reveal key={doc.name} delay={(i % 3) * 110}>
                <article className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50">
                  <div className="relative aspect-[4/4.4] overflow-hidden bg-slate-100">
                    <Image
                      src={doc.photo}
                      alt={`Portrait of ${doc.name}, ${doc.specialty} consultant`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[#0B2A4A]/85 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                      {doc.specialty}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg font-bold text-[#0B2A4A]">{doc.name}</h3>
                    <p className="mt-1 text-[13px] font-medium text-slate-500">{doc.degrees}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Consultation
                      </span>
                      <span className="font-display text-sm font-bold text-[#12876F]">{doc.fee}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="mt-14 flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#1B5FAF]/15 bg-[#1B5FAF]/[0.04] p-7 sm:flex-row">
              <p className="text-center text-sm font-semibold text-[#0B2A4A] sm:text-left sm:text-base">
                Appointments with our consultants are booked through the hospital portal after sign in.
              </p>
              <Link
                href="/login"
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1B5FAF] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#1B5FAF]/25 transition hover:bg-[#14497F]"
              >
                Sign In to Book an Appointment
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 04 · SERVICES ================= */}
      <section id="services" className="scroll-mt-20 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#12876F]">
                What we offer
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#0B2A4A] sm:text-4xl">
                Healthcare services, end to end
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                From your first consultation to discharge — and everything in between.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Appointments — wide feature card */}
            <Reveal className="sm:col-span-2">
              <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#0B2A4A] to-[#10375C] p-8 text-white shadow-lg transition duration-300 hover:shadow-2xl">
                <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-[#1B5FAF]/25 blur-2xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                      <IconCalendar className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
                      Portal service
                    </span>
                  </div>
                  <h3 className="font-display mt-6 text-xl font-bold">Appointments</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
                    Choose your consultant, see live slot availability, and book or reschedule —
                    with serial numbers issued automatically. Managed through the portal after sign in.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="group/link relative mt-7 inline-flex w-fit items-center gap-2 text-sm font-bold text-white/90 transition hover:text-white"
                >
                  Sign In to Book an Appointment
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </article>
            </Reveal>

            {/* Diagnostic tests */}
            <Reveal delay={110}>
              <article className="group h-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition duration-300 hover:border-[#1B5FAF]/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#12876F]/10 text-[#12876F]">
                  <IconFlask className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">Diagnostic Tests</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  A full laboratory test catalog with parameter-based reporting. Submit your
                  specimen at the collection desk and track pending reports in your portal.
                </p>
              </article>
            </Reveal>

            {/* OPD */}
            <Reveal>
              <article className="group h-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition duration-300 hover:border-[#1B5FAF]/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B5FAF]/10 text-[#1B5FAF]">
                  <IconStethoscope className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">Doctor Consultation</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Consultant OPD across ten specialties, each with published degrees, room numbers
                  and transparent consultation fees.
                </p>
              </article>
            </Reveal>

            {/* Prescriptions */}
            <Reveal delay={110}>
              <article className="group h-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition duration-300 hover:border-[#1B5FAF]/30 hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#12876F]/10 text-[#12876F]">
                    <IconMonitor className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Portal service
                  </span>
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">Digital Prescriptions</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Your consultant issues prescriptions digitally — diagnosis, medicines and advice
                  stored in your record, viewable from your patient portal.
                </p>
              </article>
            </Reveal>

            {/* Pharmacy */}
            <Reveal delay={220}>
              <article className="group h-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition duration-300 hover:border-[#1B5FAF]/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B5FAF]/10 text-[#1B5FAF]">
                  <IconPill className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">Pharmacy &amp; Medicines</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  An in-house pharmacy stocked against the hospital formulary, so prescribed
                  medicines are available on site during your visit.
                </p>
              </article>
            </Reveal>

            {/* Admission — wide */}
            <Reveal delay={110} className="sm:col-span-2 lg:col-span-2">
              <article className="group h-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition duration-300 hover:border-[#1B5FAF]/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2A4A]/5 text-[#0B2A4A]">
                  <IconBed className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">Admission &amp; Inpatient Care</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
                  When your consultant recommends inpatient treatment, the admission desk registers
                  your stay and tracks it end to end — with your full admission history always
                  available in your portal.
                </p>
              </article>
            </Reveal>

            {/* Ambulance pointer card */}
            <Reveal delay={220}>
              <a
                href="#emergency"
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition duration-300 hover:border-[#B4232A]/30 hover:shadow-lg"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B4232A]/10 text-[#B4232A]">
                    <IconAmbulance className="h-6 w-6" />
                  </div>
                  <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">24/7 Ambulance</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Emergency transport dispatched around the clock. Details in the emergency section.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#B4232A]">
                  Emergency services
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= 05 · BLOOD DONATION ================= */}
      <section id="blood-donation" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-28" style={{ backgroundColor: '#23060B' }}>
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#8E1F2C]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#5C1220]/30 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <Reveal>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8E1F2C]/25 text-[#F2A9B0]">
                  <IconDroplet className="h-7 w-7" />
                </div>
                <h2 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  One donation can save a life
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
                  Every day, patients in our care need emergency blood — mothers in
                  delivery rooms, surgical patients, children in oncology wards. Our blood
                  donor network matches verified donors to active hospital requests in real
                  time, so no request goes unanswered.
                </p>
              </Reveal>

              <Reveal delay={140}>
                <ul className="mt-8 space-y-3.5">
                  {[
                    'Register once as a donor with your blood group and eligibility',
                    'Receive matching hospital blood requests when your group is needed',
                    'Track your donations and the people you referred, right in the portal',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-white/80">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8E1F2C] text-white">
                        <IconCheck className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={260}>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/login"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#C22736] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-[#C22736]/30 transition hover:bg-[#A81E2C]"
                  >
                    Sign In to Become a Donor
                    <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                    Blood bank helpline · {BLOOD_BANK_HOTLINE}
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Donor info panel */}
            <Reveal delay={200}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur sm:p-10">
                <h3 className="font-display text-lg font-bold text-white">Can I donate?</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Most healthy adults can. Our team verifies these criteria at the time of donation:
                </p>
                <dl className="mt-7 space-y-5">
                  {[
                    ['Blood group', 'All groups accepted — O− and AB are especially valuable'],
                    ['Age & health', 'Adults in good general health pass a brief screening'],
                    ['Interval', 'Regular donors can give repeatedly with safe recovery gaps'],
                    ['Eligibility', 'Recent illness, medication or low hemoglobin may pause donation'],
                  ].map(([term, desc]) => (
                    <div key={term} className="border-b border-white/10 pb-5 last:border-0 last:pb-0">
                      <dt className="text-sm font-bold text-white">{term}</dt>
                      <dd className="mt-1 text-[13px] leading-relaxed text-white/55">{desc}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-7 rounded-xl bg-[#8E1F2C]/20 p-4 text-[13px] leading-relaxed text-[#F2C9CD]">
                  Donations are always voluntary and non-remunerated. Your contribution stays
                  inside the hospital network that treats your community.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= 06 · EMERGENCY / AMBULANCE ================= */}
      <section id="emergency" className="scroll-mt-20 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60">
            <div className="grid lg:grid-cols-5">
              {/* Emergency info */}
              <div className="bg-[#0B2A4A] p-8 text-white sm:p-12 lg:col-span-3">
                <Reveal>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <IconAmbulance className="h-7 w-7" />
                  </div>
                  <h2 className="font-display mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    24/7 Ambulance Support
                  </h2>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
                    Our ambulance network operates day and night. When a patient raises an
                    emergency request, dispatch assigns the nearest available ambulance and
                    tracks the ride from pickup to hospital arrival.
                  </p>
                </Reveal>

                <Reveal delay={140}>
                  <a
                    href={`tel:${EMERGENCY_HOTLINE.replace(/[^+\d]/g, '')}`}
                    className="group mt-9 inline-flex flex-col rounded-2xl border border-white/15 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                      <IconPhone className="h-4 w-4 text-[#7FD1C0]" />
                      Emergency dispatch hotline
                    </span>
                    <span className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      {EMERGENCY_HOTLINE}
                    </span>
                    <span className="mt-1 text-xs font-medium text-white/50">
                      Available 24 hours · answered by the control room
                    </span>
                  </a>
                </Reveal>
              </div>

              {/* Dispatch steps */}
              <div className="border-t border-slate-200 bg-slate-50 p-8 sm:p-12 lg:col-span-2 lg:border-l lg:border-t-0">
                <Reveal delay={120}>
                  <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    How dispatch works
                  </h3>
                  <ol className="mt-7 space-y-7">
                    {[
                      ['Request logged', 'An emergency transport request is placed with patient location and need.'],
                      ['Ambulance assigned', 'Dispatch assigns an available ambulance and driver to the ride.'],
                      ['Transport & handover', 'The patient is transported and handed over to the hospital team.'],
                    ].map(([title, text], i) => (
                      <li key={title} className="flex gap-4">
                        <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B2A4A] text-[13px] font-bold text-white">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-display text-[15px] font-bold text-[#0B2A4A]">{title}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-relaxed text-slate-600">
                    Registered patients can request an ambulance directly from the patient portal
                    after sign in.
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 07 · ADMISSION ================= */}
     {/* ================= 07 · ADMISSION CONTACT ================= */}
<section id="admission" className="scroll-mt-20 bg-slate-50 py-24 sm:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <Reveal>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#12876F]">
          Inpatient services
        </p>
        <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#0B2A4A] sm:text-4xl">
          Contact us for admission related information
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Planning a hospital stay or need to check bed availability? Our admission desk is
          available around the clock to guide you through the process.
        </p>
      </div>
    </Reveal>

    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ADMISSION_CONTACTS.map((item, i) => (
        <Reveal key={item.title} delay={i * 120}>
          <a
            href={item.href}
            className="group flex h-full flex-col rounded-2xl border border-[#1B5FAF]/15 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#1B5FAF]/40 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1B5FAF] bg-white text-lg text-[#1B5FAF] shadow-sm">
              {item.icon}
            </div>
            <h3 className="font-display mt-5 text-lg font-bold text-[#0B2A4A]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#1B5FAF] group-hover:text-[#14497F]">
              {item.action}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        </Reveal>
      ))}
    </div>

    <Reveal delay={200}>
      <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-[#1B5FAF]/15 bg-white p-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="max-w-xl text-sm font-semibold text-[#0B2A4A] sm:text-base">
          Once admitted, your consultation notes, prescriptions, tests and inpatient records
          stay connected inside the hospital portal.
        </p>
        <Link
          href="/login"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1B5FAF] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#1B5FAF]/25 transition hover:bg-[#14497F]"
        >
          Sign In to the Patient Portal
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Reveal>
  </div>
</section>
      {/* ================= 08 · DIGITAL HEALTHCARE ================= */}
      <section id="digital" className="scroll-mt-20 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#12876F]">
                Digital healthcare
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#0B2A4A] sm:text-4xl">
                Your hospital, in one secure portal
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                Everything on this page is backed by a working hospital system. When you sign in,
                each member of our community gets exactly the tools their role needs — nothing
                more, nothing less:
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {['Patients', 'Doctors', 'Blood Donors', 'Ambulance Drivers', 'Administration'].map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-[#0B2A4A]/15 bg-[#0B2A4A]/[0.04] px-3.5 py-1.5 text-xs font-bold text-[#0B2A4A]"
                  >
                    {role}
                  </span>
                ))}
              </div>

              <Link
                href="/login"
                className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#0B2A4A]/20 transition hover:bg-[#071C33]"
              >
                Access Your Hospital Services
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>

            <Reveal delay={160}>
              <div className="rounded-3xl border border-slate-200/90 bg-slate-50/70 p-8 sm:p-10">
                <ul className="space-y-6">
                  {[
                    {
                      icon: <IconCalendar className="h-5 w-5" />,
                      title: 'For patients',
                      text: 'Book and manage appointments, view digital prescriptions and test reports, request blood or an ambulance, and revisit your admission history.',
                    },
                    {
                      icon: <IconStethoscope className="h-5 w-5" />,
                      title: 'For doctors',
                      text: 'Consultant schedules, patient records, prescription writing and a laboratory specimen queue — depending on the doctor’s role.',
                    },
                    {
                      icon: <IconDroplet className="h-5 w-5" />,
                      title: 'For blood donors',
                      text: 'See matching hospital blood requests, pledge donations and track your giving history.',
                    },
                    {
                      icon: <IconAmbulance className="h-5 w-5" />,
                      title: 'For ambulance drivers',
                      text: 'Receive dispatch assignments and update ride status from pickup to handover.',
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1B5FAF] shadow-sm">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-display text-[15px] font-bold text-[#0B2A4A]">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 flex items-start gap-2.5 border-t border-slate-200 pt-6 text-[13px] leading-relaxed text-slate-500">
                  <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-[#12876F]" />
                  Access to every service above requires authenticated sign in. There is no public
                  route into hospital operations.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= 09 · FINAL CTA ================= */}
      <section className="relative overflow-hidden py-24 sm:py-28" style={{ backgroundColor: NAVY_900 }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff07_1px,transparent_1px)] bg-[size:40px_40px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <IconHeartPulse className="mx-auto h-10 w-10 text-[#5FC2AD]" />
            <h2 className="font-display mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Your health, our priority.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65">
              Sign in to schedule a consultation, review your reports, or join our donor and
              ambulance networks. Our team is ready when you are.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-[#0B2A4A] shadow-xl transition hover:bg-slate-100"
              >
                <IconShield className="h-4 w-4" />
                Sign In
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={`tel:${EMERGENCY_HOTLINE.replace(/[^+\d]/g, '')}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-8 py-4 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                <IconPhone className="h-4 w-4" />
                Emergency · {EMERGENCY_HOTLINE}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 10 · FOOTER ================= */}
      <footer id="contact" className="scroll-mt-20 bg-[#071C33] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <BrandMark size={44} />
                <div className="leading-tight">
                  <p className="font-display text-[15px] font-extrabold tracking-tight text-white">
                    Divided and Unpopular
                  </p>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Hospital &amp; Diagnostic Center
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
                A multidisciplinary hospital and diagnostic center in Dhaka — consultant-led
                treatment, diagnostics, inpatient care, a blood donor network and 24/7 ambulance
                services in one coordinated system.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <IconShield className="h-3.5 w-3.5 text-[#5FC2AD]" />
                Public information site · clinical services require sign in
              </p>
            </div>

            {/* Sections */}
            <div>
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Hospital
              </h3>
              <ul className="mt-5 space-y-3">
                {NAV_LINKS.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="text-sm text-slate-400 transition hover:text-white">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Contact
              </h3>
              <ul className="mt-5 space-y-4 text-sm">
                <li>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Emergency dispatch</p>
                  <a href={`tel:${EMERGENCY_HOTLINE.replace(/[^+\d]/g, '')}`} className="mt-0.5 block font-semibold text-white transition hover:text-[#7FD1C0]">
                    {EMERGENCY_HOTLINE}
                  </a>
                </li>
                <li>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Blood bank</p>
                  <a href={`tel:${BLOOD_BANK_HOTLINE.replace(/[^+\d]/g, '')}`} className="mt-0.5 block font-semibold text-white transition hover:text-[#7FD1C0]">
                    {BLOOD_BANK_HOTLINE}
                  </a>
                </li>
                <li>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Location</p>
                  <p className="mt-0.5 text-slate-400">Dhaka, Bangladesh</p>
                </li>
                <li>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Emergency &amp; ambulance</p>
                  <p className="mt-0.5 text-slate-400">Open 24 hours, every day</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Divided and Unpopular Hospital and Diagnostic Center. All rights reserved.
            </p>
            <Link href="/login" className="text-xs font-bold text-slate-400 transition hover:text-white">
              Sign In to the Hospital Portal →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
