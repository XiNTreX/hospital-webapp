'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    if (role !== 'DOCTOR') {
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
        // Invalidate token on the server
        await fetch('http://localhost:5001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Server logout failed, clearing local session anyway', err);
      }
    }

    // Clear frontend state
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // Redirect to login
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: '📊' },
    { name: 'My Appointments', path: '/doctor/appointments', icon: '🗓️' },
    { name: 'Patient Records', path: '/doctor/patients', icon: '🗂️' },
    { name: 'Test Reviews', path: '/doctor/tests', icon: '🔬' },
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-500 font-medium text-sm">
            Your current account role does not have permission to view the Doctor Portal.
          </p>
          <button 
            onClick={() => router.push('/login')} 
            className="mt-6 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-[300px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-6 overflow-y-auto h-full">
          <h2 className="text-[11px] font-bold text-emerald-600 tracking-widest uppercase mb-4 px-2">
            Doctor Portal
          </h2>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[15px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-200 bg-white">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl font-semibold transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}