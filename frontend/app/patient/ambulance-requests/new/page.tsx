'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAmbulanceRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    patientNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          pickupLocation: `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
        }));
        setUseCurrentLocation(true);
      },
      (err) => {
        setError('Unable to get your location. Please enter manually.');
        console.error('Geolocation error:', err);
      }
    );
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

      const res = await fetch('http://localhost:5001/api/patient/ambulance-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`✅ Ambulance request submitted successfully! Request ID: #${data.request_id}`);
        setFormData({
          pickupLocation: '',
          dropLocation: '',
          patientNotes: '',
        });
        setUseCurrentLocation(false);
        setTimeout(() => {
          router.push('/patient/ambulance-requests');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit ambulance request');
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
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
            🚑
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Ambulance</h1>
            <p className="text-sm text-slate-500">Emergency medical transport request</p>
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

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Pickup Location <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                placeholder="Enter pickup address or location"
                required
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium transition whitespace-nowrap"
              >
                📍 Use My Location
              </button>
            </div>
            {useCurrentLocation && (
              <p className="text-xs text-emerald-600 mt-1">✅ Using your current location</p>
            )}
          </div>

          {/* Drop Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Drop Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="dropLocation"
              value={formData.dropLocation}
              onChange={handleChange}
              placeholder="Enter hospital or destination address"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            />
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
              placeholder="Any special requirements or medical conditions..."
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/patient/ambulance-requests')}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-sm transition shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : '🚑 Request Ambulance'}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div className="text-xs text-amber-700">
              <p className="font-semibold">How it works:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-600">
                <li>Your request will be visible to available ambulance drivers</li>
                <li>Status will show as "Pending" until a driver accepts</li>
                <li>You'll be notified when a driver is assigned</li>
                <li>You can track the ambulance status in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}