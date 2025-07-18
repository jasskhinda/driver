import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import DashboardLayout from '@/app/components/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function DriverTripDetailsPage({ params }) {
  try {
    const { tripId } = params;
    
    // Create server component client
    const supabase = createServerComponentClient({ cookies });
    
    // Get and refresh session if needed
    const { data: { session } } = await supabase.auth.getSession();
    
    // Redirect to login if there's no session
    if (!session) {
      redirect('/login');
    }
    
    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profile?.role !== 'driver') {
      redirect('/dashboard');
    }
    
    // Fetch trip data - driver should only access their assigned trips
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('driver_id', session.user.id)
      .single();
    
    if (error || !trip) {
      console.error('Error fetching trip:', error);
      redirect('/dashboard/trips?error=trip_not_found');
    }
    
    console.log('Full trip data:', trip);
    
    // Fetch related data
    let userProfile = null;
    let managedClient = null;
    let facility = null;
    
    console.log('Trip data:', { 
      user_id: trip.user_id, 
      managed_client_id: trip.managed_client_id, 
      facility_id: trip.facility_id 
    });
    
    // Get user profile if user_id exists
    if (trip.user_id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email, phone')
        .eq('id', trip.user_id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        userProfile = data;
        console.log('User profile:', userProfile);
      }
    }
    
    // Get managed client if managed_client_id exists
    if (trip.managed_client_id) {
      const { data, error } = await supabase
        .from('facility_managed_clients')
        .select('id, first_name, last_name, email, phone, special_needs')
        .eq('id', trip.managed_client_id)
        .single();
      
      if (error) {
        console.error('Error fetching managed client:', error);
      } else {
        managedClient = data;
        console.log('Managed client:', managedClient);
      }
    }
    
    // Get facility if facility_id exists
    if (trip.facility_id) {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, contact_phone, contact_email, address')
        .eq('id', trip.facility_id)
        .single();
      
      if (error) {
        console.error('Error fetching facility:', error);
      } else {
        facility = data;
        console.log('Facility:', facility);
      }
    }
    
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
      console.log('Getting client name:', { 
        managedClient, 
        userProfile, 
        tripUserId: trip.user_id,
        tripManagedClientId: trip.managed_client_id,
        tripFacilityId: trip.facility_id 
      });
      
      if (managedClient) {
        const name = managedClient.first_name && managedClient.last_name
          ? `${managedClient.first_name} ${managedClient.last_name}`
          : managedClient.email || 'Managed Client';
        console.log('Using managed client name:', name);
        return name;
      }
      if (userProfile) {
        const name = userProfile.full_name || 
          (userProfile.first_name && userProfile.last_name 
            ? `${userProfile.first_name} ${userProfile.last_name}` 
            : userProfile.email || 'Individual Client');
        console.log('Using user profile name:', name);
        return name;
      }
      
      // Try to get client information from the trip data itself
      if (trip.client_name) {
        console.log('Using trip client_name:', trip.client_name);
        return trip.client_name;
      }
      if (trip.client_first_name && trip.client_last_name) {
        const name = `${trip.client_first_name} ${trip.client_last_name}`;
        console.log('Using trip client first/last name:', name);
        return name;
      }
      if (trip.client_email) {
        console.log('Using trip client_email:', trip.client_email);
        return trip.client_email;
      }
      
      console.log('No client information found, returning Unknown Client');
      return 'Unknown Client';
    };
    
    const getClientPhone = () => {
      if (managedClient?.phone) return managedClient.phone;
      if (userProfile?.phone) return userProfile.phone;
      if (trip.client_phone) return trip.client_phone;
      return 'Not provided';
    };
    
    const getClientEmail = () => {
      if (managedClient?.email) return managedClient.email;
      if (userProfile?.email) return userProfile.email;
      if (trip.client_email) return trip.client_email;
      return 'Not provided';
    };
    
    return (
      <DashboardLayout user={session.user} activeTab="trips">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trip Details</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Trip ID: <span className="font-mono text-[#84CED3]">{tripId}</span>
                </p>
              </div>
              <Link
                href="/dashboard/trips"
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Trips
              </Link>
            </div>
          </div>
          
          {/* Trip Status */}
          <div className="mb-8">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass(trip.status)}`}>
              {trip.status === 'pending' ? 'Pending Assignment' :
               trip.status === 'upcoming' ? 'Upcoming Trip' : 
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
                {trip.status === 'upcoming' && (
                  <>
                    <form action="/dashboard/trips" method="POST" className="w-full">
                      <input type="hidden" name="action" value="start_trip" />
                      <input type="hidden" name="trip_id" value={trip.id} />
                      <button
                        type="submit"
                        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-center"
                      >
                        Start Trip
                      </button>
                    </form>
                    <form action="/dashboard/trips" method="POST" className="w-full">
                      <input type="hidden" name="action" value="reject_trip" />
                      <input type="hidden" name="trip_id" value={trip.id} />
                      <button
                        type="submit"
                        className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-center"
                      >
                        Reject Trip
                      </button>
                    </form>
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
                    <form action="/dashboard/trips" method="POST" className="w-full">
                      <input type="hidden" name="action" value="complete_trip" />
                      <input type="hidden" name="trip_id" value={trip.id} />
                      <button
                        type="submit"
                        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-center"
                      >
                        Complete Trip
                      </button>
                    </form>
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
        </div>
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error in trip details page:', error);
    redirect('/dashboard/trips?error=trip_details_error');
  }
}