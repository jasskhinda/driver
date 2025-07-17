'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DriverTripsView from '@/app/components/DriverTripsView';

export default function TripsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        
        // Check user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.role !== 'driver') {
          router.push('/dashboard');
          return;
        }

        // Initial trips will be loaded by the DriverTripsView component
        setTrips([]);
        
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCFD0]"></div>
      </div>
    );
  }

  return <DriverTripsView user={user} trips={trips} />;
}