'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  degrees: string;
  email: string;
  phone: string;
  room_number: string;
  fee: number;
  status: string;
  photo_url: string;
}

export default function DoctorsList() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDoctors();
  }, [router]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/patient/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
        setError('');
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load doctors. Please try again.');
      }
    } catch (err) {
      console.error('Fetch doctors error:', err);
      setError('Could not connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique specializations for filter
  const specializations = [...new Set(doctors.map(d => d.specialization))];

  // Filter doctors based on search and specialization
  const filteredDoctors = doctors.filter(doc => {
    const fullName = `${doc.first_name} ${doc.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesSpecialization = !specializationFilter || doc.specialization === specializationFilter;
    return matchesSearch && matchesSpecialization;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-rose-50 p-8 rounded-2xl border border-rose-200 max-w-md">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-bold text-rose-700">Error</h3>
          <p className="text-rose-600 text-sm mt-2">{error}</p>
          <button
            onClick={fetchDoctors}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Our Specialists</h1>
        <p className="text-gray-500 mt-1">Browse our directory and find the right doctor for your needs.</p>
        <p className="text-sm text-blue-600 mt-1">Total Doctors: {doctors.length}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white min-w-[180px]"
        >
          <option value="">All Specializations</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <span className="text-4xl mb-4">🩺</span>
          <h3 className="text-lg font-bold text-gray-900">No doctors found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.doctor_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group"
            >
              {/* Doctor Photo */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0 bg-slate-100">
                  {doc.photo_url ? (
                    <img
                      src={doc.photo_url}
                      alt={`Dr. ${doc.first_name} ${doc.last_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails, show initials
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold';
                          fallback.textContent = `${doc.first_name[0]}${doc.last_name[0]}`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                      {doc.first_name[0]}{doc.last_name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-900 truncate">
                    Dr. {doc.first_name} {doc.last_name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">{doc.specialization}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${doc.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  {doc.status}
                </span>
              </div>

              {/* Doctor Details */}
              <div className="space-y-1.5 text-sm text-slate-600">
                <p className="text-xs text-slate-400">{doc.degrees}</p>
                <p>📧 {doc.email}</p>
                <p>📞 {doc.phone}</p>
                <p>🏥 Room {doc.room_number}</p>
                <p className="font-semibold text-slate-900">Fee: ৳{doc.fee}</p>
              </div>

              {/* Book Appointment Button */}
              <button
                onClick={() => router.push(`/patient/appointments/book?doctorId=${doc.doctor_id}`)}
                className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}