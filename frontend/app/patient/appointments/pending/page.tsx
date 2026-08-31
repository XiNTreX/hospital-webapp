'use client';

import { useState } from 'react';

export default function PendingAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Appointments</h1>
      <p className="text-gray-500 mb-8">View and manage your upcoming doctor visits.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Appt ID</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Doctor</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Date & Time</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl mb-3">⏳</span>
                    <p className="text-gray-500 font-medium">No pending appointments found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((apt, index) => (
                <tr key={index}>
                  {/* Table rows will be populated here */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}