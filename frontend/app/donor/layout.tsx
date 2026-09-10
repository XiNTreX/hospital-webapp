'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Check role authorization
    const role = localStorage.getItem('role');
    if (role !== 'BLOOD_DONOR') {
      setIsAuthorized(false);
      return;
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:5001/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Server logout failed');
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-500 font-medium text-sm">
            Your current account role does not have permission to view the Donor Portal.
          </p>
          <button 
            onClick={() => router.push('/login')} 
            className="mt-6 w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-rose-600">Donor Portal</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/donor/dashboard" className="block px-4 py-3 rounded-lg bg-rose-50 text-rose-700 font-bold transition">
            My Dashboard
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-slate-600 hover:bg-slate-50 hover:text-rose-600 rounded-lg font-bold transition flex items-center gap-3">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}