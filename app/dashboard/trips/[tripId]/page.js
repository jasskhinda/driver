import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import DashboardLayout from '@/app/components/DashboardLayout';
import TripDetailsClient from './TripDetailsClient';

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
    // TODO: Remove this temporary bypass for testing
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      // .eq('driver_id', session.user.id)  // Temporarily commented out for testing
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
        .select('id, full_name, first_name, last_name, email, phone_number')
        .eq('id', trip.user_id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        userProfile = data;
        console.log('User profile:', userProfile);
        
        // Note: Email might be null in profiles table
        // Consider updating profiles to sync email from auth.users
      }
    }
    
    // Get managed client if managed_client_id exists
    if (trip.managed_client_id) {
      try {
        const { data, error } = await supabase
          .from('facility_managed_clients')
          .select('id, first_name, last_name, email, phone_number, accessibility_needs, medical_requirements')
          .eq('id', trip.managed_client_id)
          .single();
        
        if (error) {
          console.error('Error fetching managed client from facility_managed_clients:', error);
          // No alternative table exists, so log the error
          console.error('Managed client not found in facility_managed_clients');
        } else {
          managedClient = data;
          console.log('Managed client (from facility_managed_clients):', managedClient);
        }
      } catch (err) {
        console.error('Error fetching managed client data:', err);
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
    
    // Helper functions moved to client component
    
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
          
          <TripDetailsClient 
            trip={JSON.parse(JSON.stringify(trip))}
            session={JSON.parse(JSON.stringify(session))}
            userProfile={userProfile ? JSON.parse(JSON.stringify(userProfile)) : null}
            managedClient={managedClient ? JSON.parse(JSON.stringify(managedClient)) : null}
            facility={facility ? JSON.parse(JSON.stringify(facility)) : null}
          />
        </div>
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error in trip details page:', error);
    redirect('/dashboard/trips?error=trip_details_error');
  }
}