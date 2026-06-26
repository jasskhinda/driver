'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@/lib/supabase-client-compat';
import DashboardLayout from './DashboardLayout';

export default function DashboardView({ user }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    waitingAcceptance: 0,
    currentAssignedTrips: 0,
    completedTrips: 0,
    rejectedTrips: 0
  });
  const [isAvailable, setIsAvailable] = useState(false);
  const [availSaving, setAvailSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Get driver profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        setIsAvailable(profileData?.is_available ?? false);

        // Get trip statistics
        
        // Waiting Acceptance - only trips specifically assigned to this driver awaiting acceptance
        const { count: waitingCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'awaiting_driver_acceptance')
          .eq('driver_id', user.id);

        // Current Assigned Trips - trips assigned to this driver that are not completed
        const { count: currentAssignedCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .in('status', ['upcoming', 'in_progress']);

        // Completed Trips - all completed trips by this driver
        const { count: completedCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .eq('status', 'completed');

        // Rejected Trips - trips rejected by this driver
        const { count: rejectedCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .eq('status', 'rejected');

        setStats({
          waitingAcceptance: waitingCount || 0,
          currentAssignedTrips: currentAssignedCount || 0,
          completedTrips: completedCount || 0,
          rejectedTrips: rejectedCount || 0
        });
        

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, supabase]);

  // Live-sync availability across devices (web <-> mobile) via Supabase Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('driver_availability_dashboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (typeof payload.new?.is_available === 'boolean') {
            setIsAvailable(payload.new.is_available);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase]);

  const toggleAvailability = async () => {
    if (availSaving) return;
    const next = !isAvailable;
    setAvailSaving(true);
    setIsAvailable(next); // optimistic
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: next })
        .eq('id', user.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating availability:', error);
      setIsAvailable(!next); // revert on failure
      alert('Could not update availability. Please try again.');
    } finally {
      setAvailSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#84CED3]"></div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="dashboard">
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard - Production</h1>
        </div>

        {/* Availability */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-block h-3 w-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{isAvailable ? 'Available' : 'Unavailable'}</h3>
              <p className="text-sm text-gray-600">
                {isAvailable ? "You're visible to dispatch for new trips" : 'Turn on to receive new trip assignments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {availSaving && <span className="text-xs text-gray-400">Saving…</span>}
            <button
              type="button"
              onClick={toggleAvailability}
              disabled={availSaving}
              role="switch"
              aria-checked={isAvailable}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isAvailable ? 'bg-green-500' : 'bg-gray-300'} ${availSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Waiting Acceptance
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.waitingAcceptance}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Current Assigned Trips
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.currentAssignedTrips}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Completed Trips
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.completedTrips}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Rejected Trips
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.rejectedTrips}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium mb-2 text-gray-900">
              Trips Waiting Acceptance
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View and accept available trip requests
            </p>
            <Link 
              href="/dashboard/trips?filter=available" 
              className="inline-block bg-[#84CED3] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#70B8BD] transition-colors"
            >
              View Waiting Trips
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium mb-2 text-gray-900">
              My Current Trips
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage your assigned trips and trip history
            </p>
            <Link 
              href="/dashboard/trips" 
              className="inline-block bg-[#84CED3] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#70B8BD] transition-colors"
            >
              My Trips
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}