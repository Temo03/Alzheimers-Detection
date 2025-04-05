"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Import Supabase client
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // Step in the process: 1 = Send OTP, 2 = Verify OTP, 3 = Update Password
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1: Send OTP to Email
  // @ts-ignore
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Prevent creating a new user if not signed up
          emailRedirectTo: window.location.origin, // Optional: for deep linking
        },
      });

      if (error) {
        if (error.message === "Signups not allowed for otp") {
          setErrorMessage("Email not found. Please SignUp");
        } else {
          setErrorMessage(error.message || "Failed to send OTP. Please try again.");
        }
        return;
      }

      setSuccessMessage("OTP sent successfully! Check your email.");
      setStep(2); // Move to the next step (Verify OTP)
    } catch (err) {
      console.error("Error sending OTP:", err);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  // @ts-ignore
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email", // Specify that this is an email-based OTP
      });

      if (error) {
        setErrorMessage(error.message || "Invalid OTP. Please try again.");
        return;
      }

      setSuccessMessage("OTP verified successfully! You can now reset your password.");
      setStep(3); // Move to the next step (Update Password)
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Update Password
  // @ts-ignore
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to update password. Please try again.");
        return;
      }

      setSuccessMessage("Password updated successfully! Redirecting to login...");
      // Reset form and redirect after a delay
      setTimeout(() => {
        router.push("/login");
      }, 500);
    } catch (err) {
      console.error("Error updating password:", err);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <h1 className="text-xl font-bold text-blue-600 flex items-center">
            Alzheimer's Detection System
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-extrabold text-center text-blue-600 mb-2">
            Forgot Password
          </h2>
          <p className="text-center text-gray-500 mb-6">
            {step === 1 && "Enter your email address to receive an OTP."}
            {step === 2 && "Enter the OTP sent to your email."}
            {step === 3 && "Set a new password for your account."}
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-500 text-sm rounded-lg text-center">
              {successMessage}
            </div>
          )}

          {/* Step-Specific Forms */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-green-500 text-white font-semibold rounded-lg transition duration-150 shadow-md ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"
                }`}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  placeholder="Enter the 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  pattern="\d{6}"
                  maxLength={6}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-green-500 text-white font-semibold rounded-lg transition duration-150 shadow-md ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"
                }`}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-green-500 text-white font-semibold rounded-lg transition duration-150 shadow-md ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"
                }`}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          {step === 1 && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Remember your password?{" "}
              <a href="/login" className="text-blue-600 font-medium hover:underline">
                Log in
              </a>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
