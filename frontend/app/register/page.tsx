'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Blood Compatibility Matrix
const CAN_DONATE_TO: Record<string, string[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

// Find which donor blood groups can donate TO the requested blood group
function getCompatibleDonorGroups(neededBG: string) {
  const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return allGroups.filter(donorBG => (CAN_DONATE_TO[donorBG] || []).includes(neededBG));
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    role: 'PATIENT',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'Male',
    emergencyPhone: '',
    phone: '',
    bloodGroup: 'A+',
    lastDonated: '',
    licenseNo: '',
    vehicleType: 'Standard Ambulance',
    agreedToTerms: false,
    inviteToken: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite Details State
  const [inviteDetails, setInviteDetails] = useState<{
    valid: boolean;
    referrerName: string;
    bloodGroupNeeded: string;
    requestId: number;
  } | null>(null);

  // Parse invite token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setFormData((prev) => ({ ...prev, role: 'BLOOD_DONOR', inviteToken: invite }));
      
      fetch(`http://localhost:5001/api/auth/invite/${invite}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setInviteDetails(data);
            setFormData((prev) => ({ ...prev, bloodGroup: data.bloodGroupNeeded }));
          } else {
            setErrorMessage(data.error || 'Invalid or expired invite link.');
          }
        })
        .catch(() => setErrorMessage('Error validating invite link.'));
    }
  }, []);

  const password = formData.password;
  const hasStartedTyping = password.length > 0;
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /\d/.test(password);
  const reqSpecial = /[@$!%*?&#_\-^+]/.test(password);
  const isPasswordValid = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setErrorMessage('');
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      return 'Please fill out all required basic profile fields (Name, Email, Passwords).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address.';
    if (!isPasswordValid) return 'Please fulfill all password security criteria before registering.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';

    if (formData.role === 'PATIENT' && !formData.dob) return 'Date of Birth is required for patients.';
    if (formData.role === 'BLOOD_DONOR' && !formData.phone) return 'An active phone number is required for blood donor dispatch.';
    if (formData.role === 'DRIVER' && (!formData.phone || !formData.licenseNo)) return 'Both Phone Number and Driver License Number are required for emergency drivers.';
    if (!formData.agreedToTerms) return 'You must accept the Terms & Conditions to create an account.';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.pendingApproval) {
        setSuccessMessage('Your driver account request has been submitted. Please wait for admin approval before logging in.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (response.ok) {
        setSuccessMessage(data.message || 'Account registered successfully! Redirecting to login...');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setErrorMessage(data.error || 'Registration failed.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage('Failed to connect to the network server. Please check your connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine available blood group options
  const availableBloodGroups = inviteDetails 
    ? getCompatibleDonorGroups(inviteDetails.bloodGroupNeeded)
    : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#EAF2F8] px-4 py-12">
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-300/25 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-10 shadow-2xl shadow-blue-900/10 backdrop-blur-2xl">
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
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button type="button" className="px-3 py-1.5 text-xs font-semibold rounded-lg transition bg-blue-600 text-white shadow-md cursor-default">
              Register
            </button>
            <Link href="/login" className="px-3 py-1.5 text-xs font-semibold rounded-lg transition text-slate-500 hover:text-slate-900">
              Sign In
            </Link>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Medical Network Account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Select your healthcare role to customize your specialized dashboard
          </p>
        </div>

        {inviteDetails && (
          <div className="mb-6 p-4 rounded-2xl bg-violet-50 border border-violet-200 text-violet-800 text-sm font-medium">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🤝</span>
              <span className="font-black text-base">You have been invited!</span>
            </div>
            <p>
              <b>{inviteDetails.referrerName}</b> invited you to donate blood for Emergency Request #{inviteDetails.requestId} (Needed Type: <b>{inviteDetails.bloodGroupNeeded}</b>). You can select any compatible blood group below.
            </p>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2.5">
              Select Your Network Role
            </label>
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl border border-slate-200 ${inviteDetails ? 'bg-slate-100 opacity-70 pointer-events-none' : 'bg-slate-50'}`}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${formData.role === 'PATIENT' ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
              >
                <span className="text-base mb-0.5">🏥</span>
                <span className="text-xs">Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'BLOOD_DONOR' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${formData.role === 'BLOOD_DONOR' ? 'bg-rose-500 text-white border-rose-400 shadow-md font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
              >
                <span className="text-base mb-0.5">🩸</span>
                <span className="text-xs">Blood Donor</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'DRIVER' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${formData.role === 'DRIVER' ? 'bg-amber-500 text-white border-amber-400 shadow-md font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
              >
                <span className="text-base mb-0.5">🚑</span>
                <span className="text-xs">Driver</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 transition text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="doctor.john@dividedandunpopularhealth.org" className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 transition text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 transition text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Confirm Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 outline-none transition text-sm ${formData.confirmPassword ? passwordsMatch ? 'border-emerald-400 focus:border-emerald-500' : 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'}`} />
              </div>
            </div>
          </div>

          {hasStartedTyping && (
            <div className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-500">
              <p className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider mb-1">Security Standards:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <p className={reqLength ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqLength ? '✓' : '○'} Min 8 characters</p>
                <p className={reqUpper ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqUpper ? '✓' : '○'} Uppercase letter</p>
                <p className={reqLower ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqLower ? '✓' : '○'} Lowercase letter</p>
                <p className={reqNumber ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqNumber ? '✓' : '○'} At least one number</p>
                <p className={reqSpecial ? "text-emerald-600 font-medium" : "text-slate-400"}>{reqSpecial ? '✓' : '○'} Special char (@$!%*?&#_-)</p>
                <p className={passwordsMatch ? "text-emerald-600 font-medium" : "text-slate-400"}>{passwordsMatch ? '✓' : '○'} Passwords match</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            {formData.role === 'PATIENT' && (
              <div className="space-y-4 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Emergency Phone</label>
                  <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm" />
                </div>
              </div>
            )}

            {formData.role === 'BLOOD_DONOR' && (
              <div className="space-y-4 bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">
                      Blood Group {inviteDetails && <span className="text-[10px] lowercase font-normal text-rose-600">(Compatible with {inviteDetails.bloodGroupNeeded})</span>}
                    </label>
                    {/* FIX: Removed disabled attribute and dynamically mapped compatible blood groups */}
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm font-semibold">
                      {availableBloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'DRIVER' && (
              <div className="space-y-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">Driver License</label>
                    <input type="text" name="licenseNo" value={formData.licenseNo} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 pt-4">
              <input type="checkbox" id="agreedToTerms" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-slate-300 cursor-pointer" />
              <label htmlFor="agreedToTerms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                I agree to the <Link href="/terms" target="_blank" className="text-blue-600 underline font-semibold">Terms &amp; Conditions</Link> and acknowledge privacy protocols.
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 text-white font-extrabold shadow-xl disabled:opacity-40 uppercase tracking-wider text-sm">
            {isSubmitting ? 'Processing...' : 'Create Account & Access Portal'}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          Already registered? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}