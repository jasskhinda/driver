import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import DashboardLayout from '@/app/components/DashboardLayout';

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
    
    return (
      <DashboardLayout user={session.user} activeTab="trips">
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center">
            {/* Coming Soon Icon */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-[#84CED3] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            
            {/* Coming Soon Text */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Navigation Coming Soon
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Real-time trip tracking and navigation features are currently in development.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Trip ID: <span className="font-mono text-[#84CED3]">{tripId}</span>
            </p>
            
            {/* Trip Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h3>
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Address</label>
                  <p className="text-sm text-gray-900">{trip.pickup_address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="text-sm text-gray-900">{trip.destination_address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    trip.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {trip.status === 'upcoming' ? 'Upcoming' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/trips"
                className="px-6 py-3 bg-[#84CED3] text-white rounded-lg hover:bg-[#70B8BD] font-medium transition-colors"
              >
                Back to Trips
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                Open in Google Maps
              </a>
            </div>
            
            {/* Features Coming Soon */}
            <div className="mt-12 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Coming Soon</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Real-time GPS</h4>
                  <p className="text-sm text-gray-600">Live location tracking and turn-by-turn navigation</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">ETA Updates</h4>
                  <p className="text-sm text-gray-600">Automatic arrival time estimates and updates</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Trip Completion</h4>
                  <p className="text-sm text-gray-600">Easy pickup and drop-off confirmation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error in track trip page:', error);
    redirect('/dashboard/trips?error=track_error');
  }
}