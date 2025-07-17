'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if the user just logged out
    const wasLoggedOut = searchParams.get('logout') === 'true';
    
    if (wasLoggedOut) {
      // Clear all auth tokens and session data
      const clearAuthData = async () => {
        try {
          // Sign out from Supabase
          await supabase.auth.signOut();
          
          // Clear any localStorage items that might contain tokens
          if (typeof window !== 'undefined') {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('supabase') || key.includes('auth'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Clear session storage as well
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && (key.includes('supabase') || key.includes('auth'))) {
                sessionStorage.removeItem(key);
              }
            }
          }
          
          // Small delay to ensure everything is cleared
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Redirect to login after ensuring everything is cleared
          router.push('/login');
        } catch (error) {
          console.error('Error during logout cleanup:', error);
          // Still redirect to login even if there's an error
          router.push('/login');
        }
      };
      
      clearAuthData();
    } else {
      // Regular redirect to login page
      router.push('/login');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#24393C]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#2E4F54] dark:text-[#E0F4F5] mb-2">
          Driver Portal
        </h1>
        <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
          Redirecting to login...
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#24393C]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2E4F54] dark:text-[#E0F4F5] mb-2">
            Driver Portal
          </h1>
          <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
            Loading...
          </p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}