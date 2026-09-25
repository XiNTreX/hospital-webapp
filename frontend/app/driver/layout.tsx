'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [driverName, setDriverName] = useState('Driver');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'DRIVER') {
      setIsAuthorized(false);
      return;
    }
    setIsAuthorized(true);

    const fetchName = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/driver/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDriverName(`${data.first_name} ${data.last_name}`);
        }
      } catch {
        /* silent */
      }
    };
    fetchName();
  }, [router]);

  const handleSignOut = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:5001/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Server logout failed', err);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/driver/dashboard', icon: '📊' },
    { label: 'Available Requests', href: '/driver/requests', icon: '🔔' },
    { label: 'Current Ride', href: '/driver/current', icon: '🚨' },
    { label: 'Completed Rides', href: '/driver/completed', icon: '✅' },
    { label: 'Cancelled Rides', href: '/driver/cancelled', icon: '🕓' },
    { label: 'My Ambulance', href: '/driver/ambulance', icon: '🛠️' },
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3FF] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-violet-100 text-center space-y-4">
          <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-500 font-medium text-sm">
            Your current account role does not have permission to view the Driver Portal.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-slate-800 font-sans flex flex-col relative overflow-x-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-5 pointer-events-none mix-blend-multiply z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#7c3aed08_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-violet-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-400 text-white font-black text-xl shadow-md shadow-violet-500/20">
            🚑
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Divided and Unpopular Hospital · Driver Portal
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>Ambulance Dispatch Network</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-violet-600 font-semibold">{driverName}</span>
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

      <div className="flex flex-1 z-10">
        <aside className="w-64 border-r border-violet-200/80 bg-white/70 backdrop-blur-md p-4 hidden md:flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Driver Navigation
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 bg-violet-50/70 rounded-2xl border border-violet-100 text-[11px] text-violet-700">
            <p className="font-bold">Dispatch Hotline</p>
            <p className="text-violet-600/80 text-[10px]">Control Room: +8801800000000</p>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}