'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import LoginForm from '@/app/components/LoginForm';

function LoginContent() {
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // If user was logged out, ensure we clear the session
    const wasLoggedOut = searchParams.get('logout') === 'true';
    const error = searchParams.get('error');
    
    if (wasLoggedOut) {
      // Force signOut one more time to ensure cookies are cleared
      supabase.auth.signOut()
        .then(() => {
          // Add the logout parameter to the URL without triggering a navigation
          const url = new URL(window.location);
          url.searchParams.set('logout', 'true');
          window.history.replaceState({}, '', url);
        })
        .catch(err => console.error('Error clearing session after logout:', err));
    }
  }, [searchParams, supabase.auth]);
  
  // Check for error messages
  const error = searchParams.get('error');
  let errorMessage = null;
  
  if (error === 'drivers_only') {
    errorMessage = 'This portal is for drivers only. Please use the driver credentials provided by your dispatcher.';
  } else if (error === 'access_denied') {
    errorMessage = 'Access denied. You do not have permission to access this application.';
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <Image src="/LOGO2 (1).webp" alt="Logo" width={60} height={60} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Compassionate Care Transportation</h1>
              <div className="bg-[#84CED3] text-white px-3 py-1 rounded-lg text-sm font-medium inline-block">
                Driver Portal
              </div>
            </div>
          </div>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        
        <LoginForm />
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Driver access only</p>
          <p className="mt-1">Contact your dispatcher for credentials</p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}