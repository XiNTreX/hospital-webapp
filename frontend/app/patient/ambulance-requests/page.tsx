'use client';

import { useState } from 'react';

export default function AmbulanceRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ambulance Requests</h1>
      <p className="text-gray-500 mb-8">History of your emergency and scheduled transport requests.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Req ID</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Date & Time</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Pickup Location</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl mb-3">🚑</span>
                    <p className="text-gray-500 font-medium">No ambulance requests found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req, index) => (
                <tr key={index}>
                  {/* Map data here */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}