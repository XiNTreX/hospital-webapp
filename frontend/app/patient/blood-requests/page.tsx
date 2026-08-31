'use client';

import { useState } from 'react';

export default function PastBloodRequests() {
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Past Blood Requests</h1>
      <p className="text-gray-500 mb-8">A complete history of your blood donation requests.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Request ID</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Blood Group</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Quantity (Bags)</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Fulfillment Status</th>
            </tr>
          </thead>
          <tbody>
            {bloodRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl mb-3">🩸</span>
                    <p className="text-gray-500 font-medium">No history of blood requests found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              bloodRequests.map((request, index) => (
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