import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DriverTracker from '@/app/components/DriverTracker';

export const dynamic = 'force-dynamic';

export default async function TrackTrip({ params }) {
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
    
    // Verify trip is in appropriate status for tracking
    if (!['upcoming', 'in_progress'].includes(trip.status)) {
      redirect(`/dashboard/trips?error=invalid_trip_status&id=${tripId}`);
    }
    
    return <DriverTracker trip={trip} user={session.user} />;
  } catch (error) {
    console.error('Error in track trip page:', error);
    redirect('/dashboard/trips?error=track_error');
  }
}