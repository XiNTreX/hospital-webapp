'use client';

import { useState, useEffect } from 'react';

interface TestItem {
  test_id: number;
  name: string;
  cost: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTests = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5001/api/patient/tests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          setTests(data);
        } else {
          setError(data.error || 'Failed to load test catalog.');
        }
      } catch (err) {
        setError('Server connection error. Ensure the backend is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Diagnostic Tests Catalog</h2>
        <p className="text-slate-500 text-sm mt-1">Browse all available medical tests and imaging services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {tests.map((test) => (
          <div key={test.test_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">{test.name}</h3>
            <span className="text-emerald-600 font-black text-lg ml-4">৳{test.cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}