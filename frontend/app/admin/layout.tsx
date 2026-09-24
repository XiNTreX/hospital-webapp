'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    // For now, checking token and role. (You can create an ADMIN role in your DB or check email)
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Manage Doctors', path: '/admin/doctors', icon: '👨‍⚕️' },
    { name: 'Tests Catalog', path: '/admin/tests', icon: '🔬' },
    { name: 'Medicines Inventory', path: '/admin/medicines', icon: '💊' },
    { name: 'Driver Requests', path: '/admin/driver-requests', icon: '🚑' },
  ];

  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-[300px] bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-lg">
        <div className="p-6">
          <h2 className="text-[11px] font-bold text-indigo-400 tracking-widest uppercase mb-6 px-2">
            Hospital Admin Portal
          </h2>
          
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[15px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-4 py-2.5 rounded-xl font-semibold transition"
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