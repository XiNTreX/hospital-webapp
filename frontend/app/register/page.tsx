'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  // Form state holding all role-specific attributes
  const [formData, setFormData] = useState({
    role: 'PATIENT',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Patient specific
    dob: '',
    gender: 'Male',
    emergencyPhone: '',
    // Blood Donor specific
    phone: '',
    bloodGroup: 'A+',
    lastDonated: '',
    // Driver specific
    licenseNo: '',
    vehicleType: 'Standard Ambulance',
    // Agreements
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation checks
  const password = formData.password;
  const hasStartedTyping = password.length > 0;
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /\d/.test(password);
  const reqSpecial = /[@$!%*?&]/.test(password);
  const isPasswordValid = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setErrorMessage('');
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      return 'Please fill out all required basic profile fields.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }

    if (!isPasswordValid) {
      return 'Please fulfill all password security criteria before registering.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }

    // Role specific checks
    if (formData.role === 'PATIENT' && !formData.dob) {
      return 'Date of Birth is required for patients.';
    }
    if (formData.role === 'BLOOD_DONOR' && !formData.phone) {
      return 'An active phone number is required for blood donor dispatch.';
    }
    if (formData.role === 'DRIVER' && (!formData.phone || !formData.licenseNo)) {
      return 'Both Phone Number and Driver License Number are required for emergency drivers.';
    }

    if (!formData.agreeTerms) {
      return 'You must accept the HIPAA privacy guidelines and terms of service.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Account registered successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErrorMessage(data.error || 'Registration failed.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Failed to connect to the Divided and Unpopular Network server. Is your backend server running on port 5001?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#EAF2F8] px-4 py-12">
      {/* Soft clinical ambient glows */}
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-300/25 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-[100px]" />

      {/* Faint clinical grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-10 shadow-2xl shadow-blue-900/10 backdrop-blur-2xl">

        {/* Top Medical Network Badge Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black text-xl shadow-lg shadow-blue-500/25">
              ✚
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Divided and Unpopular Health Network
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-200">
                  Verified Portal
                </span>
              </h2>
              <p className="text-xs text-slate-500">Secure Emergency & Clinical Management Platform</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-blue-600 text-white shadow-md cursor-default"
            >
              Register
            </button>
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition text-slate-500 hover:text-slate-900"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Medical Network Account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Select your healthcare role to customize your specialized dashboard
          </p>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role Selection Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2.5">
              Select Your Network Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-slate-50 border border-slate-200">

              {/* Patient Role */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${formData.role === 'PATIENT'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold'
                    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="text-base mb-0.5">🏥</span>
                <span className="text-xs">Patient</span>
              </button>

              {/* Blood Donor Role */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'BLOOD_DONOR' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${formData.role === 'BLOOD_DONOR'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md font-bold'
                    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="text-base mb-0.5">🩸</span>
                <span className="text-xs">Blood Donor</span>
              </button>

              {/* Driver Role */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'DRIVER' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${formData.role === 'DRIVER'
                    ? 'bg-amber-500 text-white border-amber-400 shadow-md font-bold'
                    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="text-base mb-0.5">🚑</span>
                <span className="text-xs">Driver</span>
              </button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="doctor.john@dividedandunpopularhealth.org"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Password & Confirm Password Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 9.9a3 3 0 104.24 4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pl-10 rounded-xl bg-white border text-slate-900 placeholder-slate-400 outline-none transition text-sm ${formData.confirmPassword
                      ? passwordsMatch
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-blue-500'
                    }`}
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Real-time Password Security Live Requirements Box */}
          {hasStartedTyping && (
            <div className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-500">
              <p className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider mb-1">Security Standards:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <p className={reqLength ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqLength ? '✓' : '○'} Min 8 characters</p>
                <p className={reqUpper ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqUpper ? '✓' : '○'} Uppercase letter</p>
                <p className={reqLower ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqLower ? '✓' : '○'} Lowercase letter</p>
                <p className={reqNumber ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqNumber ? '✓' : '○'} At least one number</p>
                <p className={reqSpecial ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqSpecial ? '✓' : '○'} Special character (@, $, !, %)</p>
                <p className={passwordsMatch ? "text-emerald-600 font-medium" : "text-slate-400"}>{passwordsMatch ? '✓' : '○'} Passwords match</p>
              </div>
            </div>
          )}

          {/* Dynamic Role Specific Fields for Registration */}
          <div className="pt-2">
            {/* Patient Fields */}
            {formData.role === 'PATIENT' && (
              <div className="space-y-4 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Patient Health Profile</span>
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">Basic Health Log</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Emergency Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="+8801700000000"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Blood Donor Fields */}
            {formData.role === 'BLOOD_DONOR' && (
              <div className="space-y-4 bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Blood Donor Registry</span>
                  <span className="text-[10px] text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">Urgent Dispatch Ready</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+8801712345678"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-rose-500 text-sm font-semibold text-rose-600"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Fields */}
            {formData.role === 'DRIVER' && (
              <div className="space-y-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Emergency Driver Information</span>
                  <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">Ambulance Network</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+8801712345678"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">Driver License Number</label>
                    <input
                      type="text"
                      name="licenseNo"
                      value={formData.licenseNo}
                      onChange={handleChange}
                      placeholder="DL-8829102"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="agreeTerms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                I agree to the <span className="text-blue-600 underline">Divided and Unpopular Healthcare Terms of Service</span> and acknowledge privacy protocols regarding medical dispatch logs.
              </label>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || (hasStartedTyping && (!isPasswordValid || !passwordsMatch))}
            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold transition duration-200 shadow-xl shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing Request...</span>
              </>
            ) : (
              <span>Create Account & Access Portal</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          Already registered in the Divided and Unpopular Network?{' '}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Sign in here
          </Link>
        </p>

      </div>
    </main>
  );
}