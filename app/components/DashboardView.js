'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from './DashboardLayout';

export default function DashboardView({ user }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    pendingTrips: 0,
    upcomingTrips: 0,
    completedToday: 0,
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Pending trips (available for pickup)
        const { count: pendingCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .is('driver_id', null);

        // Upcoming trips assigned to this driver
        const { count: upcomingCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .eq('status', 'upcoming');

        // Completed trips today
        const { count: completedTodayCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .eq('status', 'completed')
          .gte('actual_dropoff_time', today.toISOString());

        // Rejected trips by this driver
        const { count: rejectedCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id)
          .eq('status', 'rejected');

        setStats({
          pendingTrips: pendingCount || 0,
          upcomingTrips: upcomingCount || 0,
          completedToday: completedTodayCount || 0,
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

  const toggleAvailability = async () => {
    try {
      const newAvailability = !profile.is_available;
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: newAvailability })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, is_available: newAvailability });
    } catch (error) {
      console.error('Error updating availability:', error);
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
        {/* Driver Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Driver Status
              </h2>
              <p className="text-gray-600 mt-1">
                You are currently {profile?.is_available ? 'available' : 'offline'}
              </p>
            </div>
            <button
              onClick={toggleAvailability}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                profile?.is_available
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#84CED3] hover:bg-[#70B8BD] text-white'
              }`}
            >
              {profile?.is_available ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Available Trips
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.pendingTrips}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Upcoming Trips
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.upcomingTrips}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">
              Completed Today
            </h3>
            <p className="text-3xl font-bold text-[#84CED3] mt-2">
              {stats.completedToday}
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
              View Available Trips
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              See and accept new trip requests
            </p>
            <Link 
              href="/dashboard/trips?filter=available" 
              className="inline-block bg-[#84CED3] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#70B8BD] transition-colors"
            >
              View Trips
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium mb-2 text-gray-900">
              My Assigned Trips
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage your current, completed, and rejected trips
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