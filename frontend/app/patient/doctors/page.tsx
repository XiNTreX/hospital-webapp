'use client';

import { useState } from 'react';

export default function DoctorsList() {
  // Data will be fetched and stored here later
  const [doctors, setDoctors] = useState<any[]>([]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Specialists</h1>
      <p className="text-gray-500 mb-8">Browse our directory and find the right doctor for your needs.</p>

      {doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
          <span className="text-4xl mb-4">🩺</span>
          <h3 className="text-lg font-bold text-gray-900">Loading Doctors...</h3>
          <p className="text-gray-500 text-sm mt-1">Specialist data will appear here once connected to the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Data mapping will go here: doctors.map(doc => ...) */}
        </div>
      )}
    </div>
  );
}