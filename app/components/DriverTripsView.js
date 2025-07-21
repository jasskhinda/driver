'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DriverTripsView({ user, trips: initialTrips = [] }) {
  const [currentTrips, setCurrentTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [rejectedTrips, setRejectedTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    loadTrips();
  }, [user.id]);

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      // Get current assigned trips (awaiting acceptance, upcoming and in_progress) - simple query first
      const { data: current, error: currentError } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['awaiting_driver_acceptance', 'upcoming', 'in_progress'])
        .order('pickup_time', { ascending: true });

      if (currentError) throw currentError;
      
      // Enrich with related data
      const enrichedCurrent = await Promise.all(
        (current || []).map(async (trip) => {
          const enrichedTrip = { ...trip };
          
          // Get user profile if user_id exists
          if (trip.user_id) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('id, full_name, first_name, last_name, email')
              .eq('id', trip.user_id)
              .single();
            enrichedTrip.user_profile = userProfile;
          }
          
          // Get managed client if managed_client_id exists
          if (trip.managed_client_id) {
            const { data: managedClient } = await supabase
              .from('facility_managed_clients')
              .select('id, first_name, last_name, email, phone, special_needs')
              .eq('id', trip.managed_client_id)
              .single();
            enrichedTrip.managed_client = managedClient;
          }
          
          // Get facility if facility_id exists
          if (trip.facility_id) {
            const { data: facility } = await supabase
              .from('facilities')
              .select('id, name, contact_phone, contact_email, address')
              .eq('id', trip.facility_id)
              .single();
            enrichedTrip.facility = facility;
          }
          
          return enrichedTrip;
        })
      );
      
      setCurrentTrips(enrichedCurrent);

      // Get completed trips
      const { data: completed, error: completedError } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .order('pickup_time', { ascending: false })
        .limit(10);

      if (completedError) throw completedError;
      
      // Enrich completed trips
      const enrichedCompleted = await Promise.all(
        (completed || []).map(async (trip) => {
          const enrichedTrip = { ...trip };
          
          if (trip.user_id) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('id, full_name, first_name, last_name, email')
              .eq('id', trip.user_id)
              .single();
            enrichedTrip.user_profile = userProfile;
          }
          
          if (trip.managed_client_id) {
            const { data: managedClient } = await supabase
              .from('facility_managed_clients')
              .select('id, first_name, last_name, email, phone, special_needs')
              .eq('id', trip.managed_client_id)
              .single();
            enrichedTrip.managed_client = managedClient;
          }
          
          if (trip.facility_id) {
            const { data: facility } = await supabase
              .from('facilities')
              .select('id, name, contact_phone, contact_email, address')
              .eq('id', trip.facility_id)
              .single();
            enrichedTrip.facility = facility;
          }
          
          return enrichedTrip;
        })
      );
      
      setCompletedTrips(enrichedCompleted);

      // Get rejected trips - check both driver_id and rejected_by_driver_id
      const { data: rejected, error: rejectedError } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'rejected')
        .or(`driver_id.eq.${user.id},rejected_by_driver_id.eq.${user.id}`)
        .order('pickup_time', { ascending: false })
        .limit(10);

      if (rejectedError) throw rejectedError;
      
      // Enrich rejected trips
      const enrichedRejected = await Promise.all(
        (rejected || []).map(async (trip) => {
          const enrichedTrip = { ...trip };
          
          if (trip.user_id) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('id, full_name, first_name, last_name, email')
              .eq('id', trip.user_id)
              .single();
            enrichedTrip.user_profile = userProfile;
          }
          
          if (trip.managed_client_id) {
            const { data: managedClient } = await supabase
              .from('facility_managed_clients')
              .select('id, first_name, last_name, email, phone, special_needs')
              .eq('id', trip.managed_client_id)
              .single();
            enrichedTrip.managed_client = managedClient;
          }
          
          if (trip.facility_id) {
            const { data: facility } = await supabase
              .from('facilities')
              .select('id, name, contact_phone, contact_email, address')
              .eq('id', trip.facility_id)
              .single();
            enrichedTrip.facility = facility;
          }
          
          return enrichedTrip;
        })
      );
      
      setRejectedTrips(enrichedRejected);

    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTrip = async (tripId) => {
    try {
      const { error } = await supabase.rpc('accept_trip', {
        trip_id: tripId,
        driver_id: user.id
      });

      if (error) throw error;

      // Reload trips
      await loadTrips();
      
      // Show success message
      alert('Trip accepted successfully!');
    } catch (error) {
      console.error('Error accepting trip:', error);
      alert('Failed to accept trip. Please try again.');
    }
  };

  const rejectTrip = async (tripId) => {
    try {
      const { error } = await supabase.rpc('reject_trip', {
        trip_id: tripId,
        driver_id: user.id
      });

      if (error) throw error;

      // Reload trips
      await loadTrips();
      
      // Show success message
      alert('Trip rejected successfully!');
    } catch (error) {
      console.error('Error rejecting trip:', error);
      alert('Failed to reject trip. Please try again.');
    }
  };

  const startTrip = async (tripId) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'in_progress',
          actual_pickup_time: new Date().toISOString()
        })
        .eq('id', tripId);

      if (error) throw error;

      // Navigate to tracking page
      router.push(`/dashboard/track/${tripId}`);
    } catch (error) {
      console.error('Error starting trip:', error);
      alert('Failed to start trip. Please try again.');
    }
  };

  const completeTrip = async (tripId) => {
    try {
      console.log('Attempting to complete trip:', tripId);
      
      const { data, error } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          actual_dropoff_time: new Date().toISOString()
        })
        .eq('id', tripId)
        .eq('driver_id', user.id) // Ensure driver owns this trip
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No trip found or you do not have permission to complete this trip');
      }

      console.log('Trip completed successfully:', data);
      
      // Reload trips
      await loadTrips();
      
      // Show success message
      alert('Trip completed successfully!');
    } catch (error) {
      console.error('Error completing trip:', error);
      alert(`Failed to complete trip: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const openTripDetails = (trip) => {
    router.push(`/dashboard/trips/${trip.id}`);
  };

  const getClientName = (trip) => {
    if (trip.managed_client) {
      return trip.managed_client.first_name && trip.managed_client.last_name
        ? `${trip.managed_client.first_name} ${trip.managed_client.last_name}`
        : trip.managed_client.email || 'Managed Client';
    }
    if (trip.user_profile) {
      return trip.user_profile.full_name || 
        (trip.user_profile.first_name && trip.user_profile.last_name 
          ? `${trip.user_profile.first_name} ${trip.user_profile.last_name}` 
          : trip.user_profile.email || 'Individual Client');
    }
    return 'Unknown Client';
  };

  const getClientPhone = (trip) => {
    if (trip.managed_client?.phone) return trip.managed_client.phone;
    return 'Not provided';
  };

  const getClientEmail = (trip) => {
    if (trip.managed_client?.email) return trip.managed_client.email;
    if (trip.user_profile?.email) return trip.user_profile.email;
    return 'Not provided';
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'upcoming':
        return 'bg-[#84CED3]/20 text-[#3B5B63]';
      case 'awaiting_driver_acceptance':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const TripCard = ({ trip, showActions = true }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(trip.status)}`}>
            {trip.status === 'pending' ? 'Pending' :
             trip.status === 'upcoming' ? 'Upcoming' : 
             trip.status === 'awaiting_driver_acceptance' ? 'Waiting Driver Acceptance' :
             trip.status === 'in_progress' ? 'In Progress' : 
             trip.status === 'completed' ? 'Completed' : 'Rejected'}
          </span>
          <p className="mt-2 text-sm text-gray-600">
            Pickup: {formatDate(trip.pickup_time)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Pickup Location</p>
          <p className="text-sm text-gray-600">{trip.pickup_address}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Destination</p>
          <p className="text-sm text-gray-600">{trip.destination_address}</p>
        </div>
        
        {trip.special_requirements && (
          <div>
            <p className="text-sm font-medium text-gray-900">Special Requirements</p>
            <p className="text-sm text-gray-600">{trip.special_requirements}</p>
          </div>
        )}

        <div className="flex gap-4 text-sm text-gray-500">
          {trip.wheelchair_type && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Wheelchair accessible
            </span>
          )}
          {trip.is_round_trip && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Round trip
            </span>
          )}
          {trip.distance && (
            <span>{trip.distance} miles</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        {/* Always show Details button */}
        <button
          onClick={() => openTripDetails(trip)}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Details
        </button>
        
        {/* Show action buttons only for current trips */}
        {showActions && (
          <>
            {trip.status === 'awaiting_driver_acceptance' && (
              <>
                <button
                  onClick={() => rejectTrip(trip.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={() => acceptTrip(trip.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                >
                  Accept Trip
                </button>
              </>
            )}
            
            {trip.status === 'upcoming' && (
              <>
                <button
                  onClick={() => rejectTrip(trip.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={() => startTrip(trip.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                >
                  Start Trip
                </button>
              </>
            )}
            
            {trip.status === 'in_progress' && (
              <>
                <Link
                  href={`/dashboard/track/${trip.id}`}
                  className="px-4 py-2 bg-[#84CED3] text-white rounded-md hover:bg-[#70B8BD] font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Navigate
                </Link>
                <button
                  onClick={() => completeTrip(trip.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                >
                  Complete Trip
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Trips</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#84CED3]"></div>
          </div>
        ) : (
          <>
            {/* Current Assigned Trips Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Assigned Trips ({currentTrips.length})
              </h3>
              
              {currentTrips.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No assigned trips</h4>
                  <p className="mt-1 text-sm text-gray-500">You don&apos;t have any current assigned trips.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Trips Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Completed Trips ({completedTrips.length})
              </h3>
              
              {completedTrips.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No completed trips</h4>
                  <p className="mt-1 text-sm text-gray-500">You haven&apos;t completed any trips yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} showActions={false} />
                  ))}
                </div>
              )}
            </div>

            {/* Rejected Trips Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rejected Trips ({rejectedTrips.length})
              </h3>
              
              {rejectedTrips.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No rejected trips</h4>
                  <p className="mt-1 text-sm text-gray-500">You haven&apos;t rejected any trips.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} showActions={false} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}