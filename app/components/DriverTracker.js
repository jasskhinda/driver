'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from './DashboardLayout';
import TripCompletionForm from './TripCompletionForm';

export default function DriverTracker({ trip, user }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentStep, setCurrentStep] = useState('pickup'); // 'pickup' or 'dropoff'
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const watchIdRef = useRef(null);
  
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
  
  // Load the Google Maps script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google) {
        setMapLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);
  
  // Initialize the map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    
    // Default center (will be updated with driver location)
    const defaultCenter = { lat: 37.7749, lng: -122.4194 };
    
    // Create map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    
    mapInstanceRef.current = mapInstance;
    
    // Initialize directions service and renderer
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#84CED3',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });
    
    // Start tracking location
    startLocationTracking();
  }, [mapLoaded, startLocationTracking]);
  
  // Function to start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        updateMapLocation(location);
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      { enableHighAccuracy: true }
    );
    
    // Watch position for updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        updateMapLocation(location);
        
        // Update driver location in database
        updateDriverLocationInDB(location);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  // Update map with current location
  const updateMapLocation = (location) => {
    if (!mapInstanceRef.current) return;
    
    // Update or create driver marker
    if (markerRef.current) {
      markerRef.current.setPosition(location);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });
    }
    
    // Center map on driver location
    mapInstanceRef.current.setCenter(location);
  };
  
  // Update driver location in database
  const updateDriverLocationInDB = async (location) => {
    try {
      await supabase
        .from('trips')
        .update({ 
          driver_location: {
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', trip.id);
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };
  
  // Start navigation
  const startNavigation = () => {
    if (!currentLocation) {
      alert('Waiting for GPS location...');
      return;
    }
    
    setIsTracking(true);
    
    const destination = currentStep === 'pickup' 
      ? trip.pickup_address 
      : trip.destination_address;
    
    // Calculate route
    directionsServiceRef.current.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
          alert('Could not calculate route. Please try again.');
        }
      }
    );
  };
  
  // Mark arrival at pickup
  const markPickupArrival = async () => {
    try {
      await supabase
        .from('trips')
        .update({ 
          status: 'in_progress',
          actual_pickup_time: new Date().toISOString()
        })
        .eq('id', trip.id);
      
      setCurrentStep('dropoff');
      alert('Pickup confirmed! Navigate to destination.');
    } catch (error) {
      console.error('Error marking pickup:', error);
      alert('Failed to confirm pickup. Please try again.');
    }
  };
  
  // Show completion form
  const showTripCompletion = () => {
    setShowCompletionForm(true);
  };
  
  // Handle trip completion
  const handleTripComplete = (completed = true) => {
    if (!completed) {
      setShowCompletionForm(false);
      return;
    }
    
    // Stop location tracking
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    router.push('/dashboard/trips?completed=true');
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Navigation - {currentStep === 'pickup' ? 'To Pickup' : 'To Destination'}
          </h1>
          <Link 
            href="/dashboard/trips" 
            className="text-[#84CED3] hover:text-[#84CED3]/80"
          >
            Back to Trips
          </Link>
        </div>
        
        {/* Trip Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Pickup</p>
              <p className="text-sm text-gray-600">{trip.pickup_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Destination</p>
              <p className="text-sm text-gray-600">{trip.destination_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pickup Time</p>
              <p className="text-sm text-gray-600">{formatDate(trip.pickup_time)}</p>
            </div>
            {trip.special_requirements && (
              <div>
                <p className="text-sm font-medium text-gray-900">Special Requirements</p>
                <p className="text-sm text-gray-600">{trip.special_requirements}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Map */}
        <div>
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border border-gray-200 shadow-inner mb-4"
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-gray-600">Loading map...</p>
              </div>
            )}
          </div>
          
          {/* Navigation Controls */}
          <div className="space-y-4">
            {!isTracking && (
              <button
                onClick={startNavigation}
                className="w-full px-4 py-3 bg-[#84CED3] text-white rounded-lg hover:bg-[#70B8BD] font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Start Navigation to {currentStep === 'pickup' ? 'Pickup' : 'Destination'}
              </button>
            )}
            
            {isTracking && currentStep === 'pickup' && (
              <button
                onClick={markPickupArrival}
                className="w-full px-4 py-3 bg-[#84CED3] text-white rounded-lg hover:bg-[#70B8BD] font-medium"
              >
                Arrived at Pickup Location
              </button>
            )}
            
            {isTracking && currentStep === 'dropoff' && !showCompletionForm && (
              <button
                onClick={showTripCompletion}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Arrived at Destination
              </button>
            )}
            
            {/* Current Location Display */}
            {currentLocation && (
              <div className="text-sm text-gray-600">
                Current Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </div>
            )}
          </div>
          
          {/* Trip Completion Form */}
          {showCompletionForm && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
              <TripCompletionForm 
                trip={trip} 
                onComplete={handleTripComplete}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}