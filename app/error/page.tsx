"use client";

import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back(); // Navigate to the previous page
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M12 6a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
            Alzheimer's Detection System
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-extrabold text-red-600">Oops!</h2>
          <p className="text-gray-500 mt-4 mb-6">
            Something went wrong. Please try again.
          </p>

          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-150 shadow-md mb-4"
          >
            Go Back
          </button>

          {/* Home Button */}
          <a
            href="/"
            className="w-full py-3 block bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 shadow-md"
          >
            Return to Home
          </a>
        </div>
      </main>
    </div>
  );
}
