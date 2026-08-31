'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setErrorMessage('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      return 'Please enter both email address and password.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
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
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
  setSuccessMessage('Authentication successful! Opening hospital portal...');
  
  if (data.token) {
    localStorage.setItem('token', data.token);
    
    // Save user details so the Patient Portal layout can display the patient name immediately
    if (data.user) {
      localStorage.setItem('userData', JSON.stringify(data.user));
    }

    if (formData.rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    }
  }

  // Redirect specifically to the Patient Dashboard
  setTimeout(() => {
    // If your backend returns user roles, handle role routing dynamically:
    if (data.user?.role === 'PATIENT' || data.role === 'PATIENT') {
      window.location.href = '/patient/dashboard';
    } else {
      // Fallback or explicit redirect to patient dashboard
      window.location.href = data.redirectUrl === '/dashboard' ? '/patient/dashboard' : (data.redirectUrl || '/patient/dashboard');
    }
  }, 1200);
}
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Failed to connect to the server. Is the backend running on port 5001?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#EAF2F8] px-4 py-12 font-sans">
      {/* Soft clinical ambient glows */}
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-300/25 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-[100px]" />

      {/* Faint clinical grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-2xl">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black text-xl shadow-lg shadow-blue-500/25">
              ✚
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Divided & Unpopular
              </h2>
              <p className="text-xs text-slate-500">Hospital Portal System</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {/* <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 text-white">
              Sign In
            </span> */}
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Access your patient records, doctor dashboard, or dispatch logs
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email Address Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required
                placeholder="user@hospital.com"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <a href="#forgot" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
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
              
              {/* Toggle Show Password */}
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="text-xs text-slate-500 cursor-pointer">
              Remember my active session on this terminal
            </label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold transition duration-200 shadow-xl shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Hospital Portal</span>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          Don't have an account yet?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </main>
  );
}