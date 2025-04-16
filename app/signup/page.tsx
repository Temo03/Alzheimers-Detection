'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import { createClient } from '@/utils/supabase/client'; // Import Supabase client creator

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('doctor'); // Default role is 'doctor'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  // Create a Supabase client instance
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password confirmation
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if(userType === "patient"){
      const { data: patientsData } = await supabase
            .from("Patients")
            .select("*")
            .eq("email", email)
      
            
      if(!patientsData || patientsData.length === 0)
      {
        setErrorMessage('Patients must be added by their doctor before signing up.');
        return;
      }
    }

    try {
      // Call Supabase's signUp method
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType, // Use snake_case key to match the trigger
          },
        },
      });
      
      

      if (error) {
        setErrorMessage(error.message || 'An error occurred during signup');
        return;
      }

      if (data.user) {
        setSuccessMessage('Signup successful! Redirecting...');
        // Redirect to login page after a short delay
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (err) {
      console.error('Error during signup:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <h1 className="text-xl font-bold text-blue-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 mr-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Decision Support System
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-extrabold text-center text-blue-600">Create an Account</h2>
          <p className="text-center text-gray-500 mb-6">Sign up to access your medical dashboard</p>

          {errorMessage && <p className="text-center text-red-500 mb-4">{errorMessage}</p>}
          {successMessage && <p className="text-center text-green-500 mb-4">{successMessage}</p>}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
              />
            </div>

            {/* User Type Selection */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="userType"
                  value="doctor"
                  checked={userType === 'doctor'}
                  onChange={() => setUserType('doctor')}
                  className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
                />
                <span>Doctor</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="userType"
                  value="patient"
                  checked={userType === 'patient'}
                  onChange={() => setUserType('patient')}
                  className="text-green-600 focus:ring-green-500 border-gray-300 rounded-full"
                />
                <span>Patient</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 shadow-md"
            >
              Sign Up
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-medium hover:underline">Log in</a>
          </p>
        </div>
      </main>
    </div>
  );
}
