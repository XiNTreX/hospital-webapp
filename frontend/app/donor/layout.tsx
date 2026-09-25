'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [donorName, setDonorName] = useState('Donor');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingReferrals, setPendingReferrals] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const role = localStorage.getItem('role');
    if (role !== 'BLOOD_DONOR') {
      setIsAuthorized(false);
      return;
    }
    setIsAuthorized(true);

    const fetchHeaderData = async () => {
      try {
        const [profRes, refRes] = await Promise.all([
          fetch('http://localhost:5001/api/donor/profile', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5001/api/donor/referrals/incoming', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (profRes.ok) {
          const data = await profRes.json();
          setDonorName(`${data.first_name} ${data.last_name}`);
        }
        if (refRes.ok) {
          const refs = await refRes.json();
          setPendingReferrals(
            refs.filter(
              (r: any) => r.status === 'Pending' || r.status === 'Pledged'
            ).length
          );
        }
      } catch {
        /* silent */
      }
    };
    
    // Fetch immediately on mount or when the route changes
    fetchHeaderData();

    // FIX: Set up a polling interval to keep the badge synced across all pages
    const syncInterval = setInterval(fetchHeaderData, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(syncInterval);
  }, [router, pathname]);

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
    { label: 'Dashboard', href: '/donor/dashboard', icon: '📊' },
    { label: 'Available Requests', href: '/donor/requests', icon: '🔔' },
    {
      label: 'Referred Requests',
      href: '/donor/referred-requests',
      icon: '📨',
      badge: pendingReferrals,
    },
    { label: 'My Donations', href: '/donor/donations', icon: '✅' },
    { label: 'Referred Donations', href: '/donor/referred', icon: '👥' },
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEF2F2] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-500 font-medium text-sm">
            Your current account role does not have permission to view the Donor Portal.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 w-full px-4 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF2F2] text-slate-800 font-sans flex flex-col relative overflow-x-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-5 pointer-events-none mix-blend-multiply z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#991b1b08_1px,transparent_1px),linear-gradient(to_bottom,#991b1b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-red-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-700 to-rose-500 text-white font-black text-xl shadow-md shadow-red-500/20">
            🩸
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Divided and Unpopular Hospital · Blood Donor Network
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span>Donate · Refer · Save Lives</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-red-700 font-semibold">{donorName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 text-xs font-bold hover:bg-rose-100 hover:text-rose-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Sign Out</span>
        </button>
      </header>

      <div className="flex flex-1 z-10">
        <aside className="w-64 border-r border-red-200/80 bg-white/70 backdrop-blur-md p-4 hidden md:flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Donor Navigation
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-red-700 text-white shadow-md shadow-red-500/20'
                      : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 bg-red-50/70 rounded-2xl border border-red-100 text-[11px] text-red-700">
            <p className="font-bold">Blood Bank Helpline</p>
            <p className="text-red-600/80 text-[10px]">24/7: +8801900000000</p>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}