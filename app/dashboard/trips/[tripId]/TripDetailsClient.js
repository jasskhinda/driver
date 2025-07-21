'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TripDetailsClient({ trip, session, userProfile, managedClient, facility }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const acceptTrip = async (tripId) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('accept_trip', {
        trip_id: tripId,
        driver_id: session.user.id
      });

      if (error) throw error;
      
      alert('Trip accepted successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error accepting trip:', error);
      alert('Failed to accept trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rejectTrip = async (tripId) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('reject_trip', {
        trip_id: tripId,
        driver_id: session.user.id
      });

      if (error) throw error;
      
      alert('Trip rejected successfully!');
      router.push('/dashboard/trips');
    } catch (error) {
      console.error('Error rejecting trip:', error);
      alert('Failed to reject trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTrip = async (tripId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'in_progress',
          actual_pickup_time: new Date().toISOString()
        })
        .eq('id', tripId);

      if (error) throw error;

      router.push(`/dashboard/track/${tripId}`);
    } catch (error) {
      console.error('Error starting trip:', error);
      alert('Failed to start trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeTrip = async (tripId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          actual_dropoff_time: new Date().toISOString()
        })
        .eq('id', tripId)
        .eq('driver_id', session.user.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No trip found or you do not have permission to complete this trip');
      }

      alert('Trip completed successfully!');
      router.push('/dashboard/trips');
    } catch (error) {
      console.error('Error completing trip:', error);
      alert(`Failed to complete trip: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_driver_acceptance':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getClientName = () => {
    if (managedClient) {
      const name = managedClient.first_name && managedClient.last_name
        ? `${managedClient.first_name} ${managedClient.last_name}`
        : managedClient.email || 'Managed Client';
      return name;
    }
    if (userProfile) {
      const name = userProfile.full_name || 
        (userProfile.first_name && userProfile.last_name 
          ? `${userProfile.first_name} ${userProfile.last_name}` 
          : userProfile.email || 'Individual Client');
      return name;
    }
    
    if (trip.client_name) return trip.client_name;
    if (trip.client_first_name && trip.client_last_name) {
      return `${trip.client_first_name} ${trip.client_last_name}`;
    }
    if (trip.client_email) return trip.client_email;
    
    return 'Unknown Client';
  };
  
  const getClientPhone = () => {
    if (managedClient?.phone) return managedClient.phone;
    if (userProfile?.phone_number) return userProfile.phone_number;
    return 'Not provided';
  };
  
  const getClientEmail = () => {
    if (managedClient?.email) return managedClient.email;
    if (userProfile?.email) return userProfile.email;
    return 'Not provided';
  };

  return (
    <>
      {/* Trip Status */}
      <div className="mb-8">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass(trip.status)}`}>
          {trip.status === 'pending' ? 'Pending Assignment' :
           trip.status === 'upcoming' ? 'Upcoming Trip' : 
           trip.status === 'awaiting_driver_acceptance' ? 'Waiting Driver Acceptance' :
           trip.status === 'in_progress' ? 'Trip In Progress' : 
           trip.status === 'completed' ? 'Trip Completed' : 
           trip.status === 'rejected' ? 'Trip Rejected' : 'Unknown Status'}
        </span>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Trip Information */}
        <div className="xl:col-span-2 space-y-8">
          {/* Trip Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Information</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Pickup Time</label>
                  <p className="text-lg text-gray-900">{formatDate(trip.pickup_time)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      trip.is_round_trip ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {trip.is_round_trip ? 'Round Trip' : 'One Way'}
                    </span>
                    {trip.wheelchair_type && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Wheelchair Accessible
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900">{trip.pickup_address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.pickup_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900">{trip.destination_address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>
              
              {trip.distance && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                  <p className="text-lg text-gray-900">{trip.distance} miles</p>
                </div>
              )}
              
              {trip.special_requirements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-900">{trip.special_requirements}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Trip Created</p>
                  <p className="text-sm text-gray-600">{formatDate(trip.created_at)}</p>
                </div>
              </div>
              
              {trip.actual_pickup_time && (
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Actual Pickup</p>
                    <p className="text-sm text-gray-600">{formatDate(trip.actual_pickup_time)}</p>
                  </div>
                </div>
              )}
              
              {trip.actual_dropoff_time && (
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Trip Completed</p>
                    <p className="text-sm text-gray-600">{formatDate(trip.actual_dropoff_time)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Contact Information */}
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Client Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Name</label>
                <p className="text-blue-900 font-medium">{getClientName()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Phone</label>
                <p className="text-blue-900">
                  {getClientPhone() !== 'Not provided' ? (
                    <a href={`tel:${getClientPhone()}`} className="hover:underline">
                      {getClientPhone()}
                    </a>
                  ) : (
                    <span className="text-blue-700">Not provided</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                <p className="text-blue-900">
                  {getClientEmail() !== 'Not provided' ? (
                    <a href={`mailto:${getClientEmail()}`} className="hover:underline break-all">
                      {getClientEmail()}
                    </a>
                  ) : (
                    <span className="text-blue-700">Not provided</span>
                  )}
                </p>
              </div>
              {managedClient?.special_needs && (
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Special Needs</label>
                  <p className="text-blue-900">{managedClient.special_needs}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Facility Information */}
          {facility && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Facility Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Facility Name</label>
                  <p className="text-green-900 font-medium">{facility.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Contact Phone</label>
                  <p className="text-green-900">
                    {facility.contact_phone ? (
                      <a href={`tel:${facility.contact_phone}`} className="hover:underline">
                        {facility.contact_phone}
                      </a>
                    ) : (
                      <span className="text-green-700">Not provided</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Contact Email</label>
                  <p className="text-green-900">
                    {facility.contact_email ? (
                      <a href={`mailto:${facility.contact_email}`} className="hover:underline break-all">
                        {facility.contact_email}
                      </a>
                    ) : (
                      <span className="text-green-700">Not provided</span>
                    )}
                  </p>
                </div>
                {facility.address && (
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Facility Address</label>
                    <p className="text-green-900">{facility.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Driver Information */}
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Driver Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">Driver</label>
                <p className="text-yellow-900 font-medium">{session.user?.user_metadata?.full_name || session.user?.email || 'You'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">Contact</label>
                <p className="text-yellow-900">{session.user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {trip.status === 'awaiting_driver_acceptance' && (
              <>
                <button
                  onClick={() => acceptTrip(trip.id)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-center disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Accept Trip'}
                </button>
                <button
                  onClick={() => rejectTrip(trip.id)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-center disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Reject Trip'}
                </button>
              </>
            )}
            
            {trip.status === 'upcoming' && (
              <>
                <button
                  onClick={() => startTrip(trip.id)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-center disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Start Trip'}
                </button>
                <button
                  onClick={() => rejectTrip(trip.id)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-center disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Reject Trip'}
                </button>
              </>
            )}
            
            {trip.status === 'in_progress' && (
              <>
                <Link
                  href={`/dashboard/track/${trip.id}`}
                  className="w-full px-4 py-3 bg-[#84CED3] text-white rounded-lg hover:bg-[#70B8BD] font-medium text-center block flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Navigate to Destination
                </Link>
                <button
                  onClick={() => completeTrip(trip.id)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-center disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Trip'}
                </button>
              </>
            )}
            
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-center block"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </>
  );
}