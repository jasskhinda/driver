'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadEarnings() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        setUser(session.user);

        // Get driver profile for total earnings
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_earnings')
          .eq('id', session.user.id)
          .single();

        // Calculate date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get completed trips for this driver
        const { data: trips } = await supabase
          .from('trips')
          .select('id, pickup_time, pickup_address, destination_address, price, actual_dropoff_time')
          .eq('driver_id', session.user.id)
          .eq('status', 'completed')
          .order('actual_dropoff_time', { ascending: false });

        if (trips) {
          // Calculate earnings
          let todayEarnings = 0;
          let weekEarnings = 0;
          let monthEarnings = 0;

          trips.forEach(trip => {
            if (trip.price && trip.actual_dropoff_time) {
              const tripDate = new Date(trip.actual_dropoff_time);
              
              if (tripDate >= today) {
                todayEarnings += trip.price;
              }
              if (tripDate >= weekStart) {
                weekEarnings += trip.price;
              }
              if (tripDate >= monthStart) {
                monthEarnings += trip.price;
              }
            }
          });

          setEarnings({
            today: todayEarnings,
            week: weekEarnings,
            month: monthEarnings,
            total: profile?.total_earnings || 0
          });

          // Set recent trips (last 10)
          setRecentTrips(trips.slice(0, 10));
        }

      } catch (error) {
        console.error('Error loading earnings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEarnings();
  }, [supabase]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCFD0]"></div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="earnings">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#2E4F54] dark:text-[#E0F4F5]">Earnings</h1>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#3F5E63]">
            <h3 className="text-sm font-medium text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Today</h3>
            <p className="text-2xl font-bold text-[#2E4F54] dark:text-[#E0F4F5] mt-2">
              ${earnings.today.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#3F5E63]">
            <h3 className="text-sm font-medium text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">This Week</h3>
            <p className="text-2xl font-bold text-[#2E4F54] dark:text-[#E0F4F5] mt-2">
              ${earnings.week.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#3F5E63]">
            <h3 className="text-sm font-medium text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">This Month</h3>
            <p className="text-2xl font-bold text-[#2E4F54] dark:text-[#E0F4F5] mt-2">
              ${earnings.month.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C2C2F] p-6 rounded-lg border border-[#DDE5E7] dark:border-[#3F5E63]">
            <h3 className="text-sm font-medium text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Total Earnings</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
              ${earnings.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="bg-white dark:bg-[#1C2C2F] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6">
          <h2 className="text-lg font-semibold text-[#2E4F54] dark:text-[#E0F4F5] mb-4">Recent Trips</h2>
          
          {recentTrips.length === 0 ? (
            <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 text-center py-8">
              No completed trips yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#DDE5E7] dark:border-[#3F5E63]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                      Route
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                      Earnings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((trip) => (
                    <tr key={trip.id} className="border-b border-[#DDE5E7] dark:border-[#3F5E63] last:border-0">
                      <td className="py-3 px-4 text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">
                        {formatDate(trip.actual_dropoff_time)}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">
                        <div>
                          <p className="font-medium">{trip.pickup_address}</p>
                          <p className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">→ {trip.destination_address}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
                        ${trip.price?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}