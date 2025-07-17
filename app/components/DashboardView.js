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
    totalEarnings: 0
  });
  const [hasCompletedCheckoff, setHasCompletedCheckoff] = useState(false);
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

        setStats({
          pendingTrips: pendingCount || 0,
          upcomingTrips: upcomingCount || 0,
          completedToday: completedTodayCount || 0,
          totalEarnings: profileData.total_earnings || 0
        });
        
        // Check if vehicle checkoff was completed today
        const todayDate = new Date().toISOString().split('T')[0];
        const { data: checkoff } = await supabase
          .from('vehicle_checkoffs')
          .select('id')
          .eq('driver_id', user.id)
          .eq('checkoff_date', todayDate)
          .single();
          
        setHasCompletedCheckoff(!!checkoff);

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
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="dashboard">
      <div className="space-y-6">
        {/* Vehicle Checkoff Reminder */}
        {!hasCompletedCheckoff && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Daily vehicle inspection not completed
                </p>
              </div>
              <Link
                href="/dashboard/vehicle-checkoff"
                className="text-sm font-medium text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300"
              >
                Complete Now →
              </Link>
            </div>
          </div>
        )}
        {/* Driver Status Card */}
        <div className="bg-white dark:bg-[#1C2C2F] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-primary dark:text-dark-primary">
                Driver Status
              </h2>
              <p className="text-primary/70 dark:text-dark-primary/70 mt-1">
                You are currently {profile?.is_available ? 'available' : 'offline'}
              </p>
            </div>
            <button
              onClick={toggleAvailability}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                profile?.is_available
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {profile?.is_available ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-primary/70 dark:text-dark-primary/70">
              Available Trips
            </h3>
            <p className="text-2xl font-bold text-primary dark:text-dark-primary mt-2">
              {stats.pendingTrips}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-primary/70 dark:text-dark-primary/70">
              Upcoming Trips
            </h3>
            <p className="text-2xl font-bold text-primary dark:text-dark-primary mt-2">
              {stats.upcomingTrips}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-primary/70 dark:text-dark-primary/70">
              Completed Today
            </h3>
            <p className="text-2xl font-bold text-primary dark:text-dark-primary mt-2">
              {stats.completedToday}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-primary/70 dark:text-dark-primary/70">
              Total Earnings
            </h3>
            <p className="text-2xl font-bold text-primary dark:text-dark-primary mt-2">
              ${stats.totalEarnings.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-primary dark:text-dark-primary">
              View Available Trips
            </h3>
            <p className="text-sm text-primary/80 dark:text-dark-primary/80 mb-4">
              See and accept new trip requests
            </p>
            <Link 
              href="/dashboard/trips?filter=available" 
              className="inline-block bg-[#84CED3] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#60BFC0] transition-colors"
            >
              View Trips
            </Link>
          </div>
          
          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-primary dark:text-dark-primary">
              My Assigned Trips
            </h3>
            <p className="text-sm text-primary/80 dark:text-dark-primary/80 mb-4">
              Manage your upcoming and active trips
            </p>
            <Link 
              href="/dashboard/trips?filter=assigned" 
              className="inline-block bg-[#84CED3] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#60BFC0] transition-colors"
            >
              My Trips
            </Link>
          </div>
          
          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-primary dark:text-dark-primary">
              Earnings History
            </h3>
            <p className="text-sm text-primary/80 dark:text-dark-primary/80 mb-4">
              View your earnings and trip history
            </p>
            <Link 
              href="/dashboard/earnings" 
              className="inline-block bg-[#84CED3] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#60BFC0] transition-colors"
            >
              View Earnings
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}