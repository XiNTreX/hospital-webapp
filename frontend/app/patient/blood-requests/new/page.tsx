'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBloodRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    units: 1,
    needDate: '',
    patientNotes: '',
  });

  // Set default need date to tomorrow (minimum)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, needDate: dateStr }));
  }, []);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const unitOptions = [1, 2, 3, 4, 5];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('http://localhost:5001/api/patient/blood-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`✅ Blood request submitted successfully! Request ID: #${data.request_id}`);
        // Reset form
        setFormData({
          bloodGroup: 'A+',
          units: 1,
          needDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          patientNotes: '',
        });
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/patient/blood-requests');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit blood request');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-2xl">
            🩸
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Blood</h1>
            <p className="text-sm text-slate-500">Submit a request for blood donation</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Blood Group Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Blood Group Needed <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {bloodGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bloodGroup: group }))}
                  className={`py-2 rounded-xl text-sm font-bold transition ${
                    formData.bloodGroup === group
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Units Needed */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Units Needed <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <select
                name="units"
                value={formData.units}
                onChange={handleChange}
                className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-rose-500"
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <span className="text-sm text-slate-500">unit{formData.units > 1 ? 's' : ''}</span>
              <span className="text-xs text-slate-400">(Max 5 units per request)</span>
            </div>
          </div>

          {/* Need Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Date Needed By <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="needDate"
              value={formData.needDate}
              onChange={handleChange}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-rose-500"
            />
            <p className="text-xs text-slate-400 mt-1">Requests must be at least 1 day in advance</p>
          </div>

          {/* Patient Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Notes <span className="text-slate-400">(Optional)</span>
            </label>
            <textarea
              name="patientNotes"
              value={formData.patientNotes}
              onChange={handleChange}
              placeholder="Any additional information for the blood donor..."
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/patient/blood-requests')}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-bold text-sm transition shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Blood Request'}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div className="text-xs text-blue-700">
              <p className="font-semibold">How it works:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-600">
                <li>Your request will be visible to registered blood donors</li>
                <li>Status will show as "Pending" until a donor confirms</li>
                <li>You'll be notified when a donor accepts your request</li>
                <li>Maximum 5 units per request</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}