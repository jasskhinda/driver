'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

        // Get trip statistics
        
        // Waiting Acceptance - trips available for this driver to accept
        const { count: waitingCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .is('driver_id', null);

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