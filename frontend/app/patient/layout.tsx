'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [patientName, setPatientName] = useState('Patient');

  useEffect(() => {
    // Check authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load stored patient info if available
    const userStr = localStorage.getItem('userData');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setPatientName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Patient');
      } catch (e) {
        console.error('Error parsing user session');
      }
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/patient/dashboard', icon: '📊' },
    { label: 'View Doctors List', href: '/patient/doctors', icon: '🩺' },
    { label: 'Pending Appointments', href: '/patient/appointments/pending', icon: '⏳' },
    { label: 'Past Appointments', href: '/patient/appointments/past', icon: '📅' },
    { label: 'View Test List', href: '/patient/tests', icon: '🧪' },
    { label: 'Pending Test Reports', href: '/patient/reports/pending', icon: '📋' },
    { label: 'Past Test Reports', href: '/patient/reports/past', icon: '📁' },
    { label: 'Past Blood Requests', href: '/patient/blood-requests', icon: '🩸' },
    { label: 'Past Ambulance Requests', href: '/patient/ambulance-requests', icon: '🚑' },
    { label: 'Admission History', href: '/patient/admissions', icon: '🏥' },
  ];

  return (
    <div className="min-h-screen bg-[#EAF2F8] text-slate-800 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Visual Element with Faded Hospital Ambient Artwork */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-5 pointer-events-none mix-blend-multiply z-0" 
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1920&q=80')` }}
      />
      
      {/* Faint clinical grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black text-xl shadow-md shadow-blue-500/20">
            ✚
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Divided And Unpopular Hospital & Diagnostic Center
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>Patient Medical Portal</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 font-semibold">{patientName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 text-xs font-bold hover:bg-rose-100 hover:text-rose-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Page Layout Body */}
      <div className="flex flex-1 z-10">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200/80 bg-white/70 backdrop-blur-md p-4 hidden md:flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Patient Navigation
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-[11px] text-blue-700">
            <p className="font-bold">24/7 Helpline</p>
            <p className="text-blue-600/80 text-[10px]">Emergency Dispatch: +8801700000000</p>
          </div>
        </aside>

        {/* Dynamic Route Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}