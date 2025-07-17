'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/app/components/DashboardLayout';
import VehicleCheckoffForm from '@/app/components/VehicleCheckoffForm';

export default function VehicleCheckoffPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Check if checkoff was completed today
        const today = new Date().toISOString().split('T')[0];
        const { data: checkoff } = await supabase
          .from('vehicle_checkoffs')
          .select('id')
          .eq('driver_id', session.user.id)
          .eq('checkoff_date', today)
          .single();
          
        if (checkoff) {
          setHasCompletedToday(true);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [router, supabase]);

  const handleComplete = () => {
    // Redirect to dashboard after completion
    router.push('/dashboard?checkoff=completed');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCFD0]"></div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="checkoff">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6">
          {hasCompletedToday && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-800 dark:text-green-200 font-medium">
                ✓ Vehicle checkoff already completed today
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You can update your checkoff below if needed.
              </p>
            </div>
          )}
          
          <VehicleCheckoffForm user={user} onComplete={handleComplete} />
        </div>
      </div>
    </DashboardLayout>
  );
}