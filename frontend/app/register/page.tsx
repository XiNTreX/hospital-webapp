'use client';

import { useState } from 'react';
import Link from 'next/link'; 

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    role: 'PATIENT', // Default role
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    // Patient specific
    dob: '',
    gender: 'Male',
    // Blood Donor specific
    phone: '',
    bloodGroup: 'A+',
  });
  
  const [errorMessage, setErrorMessage] = useState('');

  // Real-Time Password Validation
  const password = formData.password;
  const hasStartedTyping = password.length > 0;
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /\d/.test(password);
  const reqSpecial = /[@$!%*?&]/.test(password);
  const isPasswordValid = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(''); 
  };

  const validateForm = () => {
    // Shared mandatory fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      return 'Please fill out all the basic profile fields.';
    }

    // Role-specific mandatory fields
    if (formData.role === 'PATIENT' && !formData.dob) {
      return 'Date of Birth is required for patients.';
    }
    if (formData.role === 'BLOOD_DONOR' && !formData.phone) {
      return 'A phone number is required for blood donors so we can contact you.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address (e.g., name@example.com).';
    }

    if (!isPasswordValid) {
      return 'Please ensure your password meets all the strict security requirements.';
    }

    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return; 
    }
    
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
        alert('Success: ' + data.message);
        window.location.href = '/login'; 
      } else {
        setErrorMessage(data.error || 'Registration failed.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Failed to connect to the server. Is the backend running?');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50 px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900">Create an Account</h1>
          <p className="text-gray-500 mt-2">Join our hospital network</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* Account Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I want to register as a...</label>
            <select 
              name="role" value={formData.role} onChange={handleChange}
              className="w-full px-4 py-3 text-blue-700 font-semibold rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-blue-50"
            >
              <option value="PATIENT">Patient (Standard Account)</option>
              <option value="BLOOD_DONOR">Blood Donor</option>
            </select>
          </div>

          <div className="flex gap-4 border-t border-gray-100 pt-5">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input 
                type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input 
                type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" name="email" value={formData.email} onChange={handleChange} required
              className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input 
              type="password" name="password" value={formData.password} onChange={handleChange} required
              className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
            
            {hasStartedTyping && (
              <div className="mt-3 text-xs space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className={reqLength ? "text-green-600 font-medium" : "text-gray-500"}>{reqLength ? '✓' : '○'} At least 8 characters</p>
                <p className={reqUpper ? "text-green-600 font-medium" : "text-gray-500"}>{reqUpper ? '✓' : '○'} One uppercase letter</p>
                <p className={reqLower ? "text-green-600 font-medium" : "text-gray-500"}>{reqLower ? '✓' : '○'} One lowercase letter</p>
                <p className={reqNumber ? "text-green-600 font-medium" : "text-gray-500"}>{reqNumber ? '✓' : '○'} One number</p>
                <p className={reqSpecial ? "text-green-600 font-medium" : "text-gray-500"}>{reqSpecial ? '✓' : '○'} One special character (@, $, !, %, *, ?, &)</p>
              </div>
            )}
          </div>

          {/* Conditional Rendering based on Role Selection */}
          {formData.role === 'PATIENT' ? (
            <div className="flex gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-1/2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <input 
                  type="date" name="dob" value={formData.dob} onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none transition"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select 
                  name="gender" value={formData.gender} onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none transition bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="w-1/2">
                <label className="block text-sm font-semibold text-red-800 mb-2">Phone Number</label>
                <input 
                  type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1234567890"
                  className="w-full px-4 py-3 text-gray-900 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-600 outline-none transition"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-semibold text-red-800 mb-2">Blood Group</label>
                <select 
                  name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-600 outline-none transition bg-white"
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
          )}

          <button 
            type="submit" 
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:bg-blue-300"
            disabled={hasStartedTyping && !isPasswordValid}
          >
            {formData.role === 'PATIENT' ? 'Register Patient' : 'Register as Donor'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>

      </div>
    </main>
  );
}