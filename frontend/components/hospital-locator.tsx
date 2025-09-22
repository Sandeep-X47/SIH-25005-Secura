import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Compass, Loader2, Phone, Navigation, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import mapbox-gl
import mapboxgl from 'mapbox-gl';

// Using basic Mapbox markers - no custom styles needed

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

console.log('Mapbox token:', MAPBOX_TOKEN ? 'Loaded' : 'Missing');

// Interface for the hospital data structure from Mapbox API
interface Hospital {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  properties?: {
    address?: string;
  };
}

const HospitalLocator: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ longitude: number; latitude: number; city?: string; region?: string; country?: string } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserLocationAndHospitals = () => {
    if (!MAPBOX_TOKEN) {
        setError("Mapbox token is not configured. Please add VITE_MAPBOX_TOKEN to your .env file.");
        setLoading(false);
        return;
    }

      // Use geolocation API for accurate GPS coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude, accuracy } = position.coords;
            console.log('GPS location detected:', { longitude, latitude, accuracy });
            
            // Get city name using reverse geocoding
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`)
              .then(res => res.json())
              .then(data => {
                const place = data.features?.[0];
                const city = place?.context?.find((c: any) => c.id.startsWith('place'))?.text;
                const region = place?.context?.find((c: any) => c.id.startsWith('region'))?.text;
                const country = place?.context?.find((c: any) => c.id.startsWith('country'))?.text;
                
                setUserLocation({ 
                  longitude, 
                  latitude, 
                  city, 
                  region, 
                  country 
                });
                fetchHospitals(longitude, latitude);
              })
              .catch(() => {
                // If reverse geocoding fails, just use coordinates
                setUserLocation({ longitude, latitude });
                fetchHospitals(longitude, latitude);
              });
          },
          (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Could not access your location. ';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Please allow location access and refresh the page.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Location request timed out.';
                break;
              default:
                errorMessage += 'An unknown error occurred.';
                break;
            }
            
            setError(errorMessage);
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        setError('Geolocation is not supported by this browser. Please use a modern browser.');
        setLoading(false);
      }
    };

    fetchUserLocationAndHospitals();
  }, []);

  const fetchHospitals = async (longitude: number, latitude: number) => {
    try {
      console.log('Creating markers near:', { longitude, latitude });
      
      // Create simple markers around the user's location
      const mockHospitals: Hospital[] = [
        {
          id: 'marker-1',
          text: 'Vet Hospital',
          place_name: 'Veterinary Hospital, Main Street',
          center: [longitude + 0.01, latitude + 0.01] as [number, number],
          properties: { address: 'Main Street' }
        },
        {
          id: 'marker-2', 
          text: 'Animal Clinic',
          place_name: 'Animal Clinic, Oak Avenue',
          center: [longitude - 0.015, latitude + 0.02] as [number, number],
          properties: { address: 'Oak Avenue' }
        },
        {
          id: 'marker-3',
          text: 'Pet Care',
          place_name: 'Pet Care Center, Elm Street',
          center: [longitude + 0.02, latitude - 0.01] as [number, number],
          properties: { address: 'Elm Street' }
        },
        {
          id: 'marker-4',
          text: 'Emergency Vet',
          place_name: 'Emergency Veterinary, Medical District',
          center: [longitude - 0.02, latitude - 0.015] as [number, number],
          properties: { address: 'Medical District' }
        },
        {
          id: 'marker-5',
          text: 'Rural Vet',
          place_name: 'Rural Veterinary, Country Road',
          center: [longitude + 0.025, latitude + 0.025] as [number, number],
          properties: { address: 'Country Road' }
        },
        {
          id: 'marker-6',
          text: 'City Vet',
          place_name: 'City Veterinary, Downtown',
          center: [longitude - 0.01, latitude - 0.02] as [number, number],
          properties: { address: 'Downtown' }
        }
      ];
      
      setHospitals(mockHospitals);
      console.log('Created 6 markers around your location');
    } catch (err) {
      console.error('Error creating markers:', err);
      setError('Could not create markers. Please try again later.');
    } finally {
    setLoading(false);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) {
      console.log('Map container or token not available:', { 
        container: !!mapContainer.current, 
        token: !!MAPBOX_TOKEN 
      });
      return;
    }

    console.log('Initializing map with token:', MAPBOX_TOKEN.substring(0, 20) + '...');

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: userLocation ? [userLocation.longitude, userLocation.latitude] : [-74.5, 40],
        zoom: 11
      });

      newMap.on('load', () => {
        console.log('Map loaded successfully');
        setMap(newMap);
      });

      newMap.on('error', (e: any) => {
        console.error('Map error:', e);
        setError(`Map failed to load: ${e.error?.message || 'Unknown error'}`);
      });

      newMap.on('style.load', () => {
        console.log('Map style loaded');
      });

      // Add a timeout to detect if map doesn't load
      const timeout = setTimeout(() => {
        if (!map) {
          console.error('Map loading timeout');
          setError('Map is taking too long to load. Please refresh the page.');
        }
      }, 10000);

      return () => {
        clearTimeout(timeout);
        newMap.remove();
      };
    } catch (error) {
      console.error('Failed to load Mapbox GL:', error);
      setError(`Failed to initialize map: ${error}`);
    }
  }, [userLocation]);

  // Add markers when hospitals are loaded
  useEffect(() => {
    if (!map || !hospitals.length) return;

    console.log('Adding markers for hospitals:', hospitals); // Debug log

    try {
      // Clear existing markers first
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());

      console.log('Mapbox GL loaded, creating basic markers...'); // Debug log
      
      // Add user location marker (blue)
      if (userLocation) {
        const userMarker = new mapboxgl.Marker({ 
          color: '#3b82f6',
          scale: 1.2
        })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map);
      }

      // Add hospital markers (red) - basic markers only
      hospitals.forEach((hospital, index) => {
        console.log(`Creating basic marker for hospital ${index + 1}:`, hospital); // Debug log
        
        // Create basic red marker - no custom styling, no hover effects
        const marker = new mapboxgl.Marker({ 
          color: '#ef4444',
          scale: 1.0
        })
          .setLngLat(hospital.center)
          .addTo(map);

        console.log(`Basic marker created and added for hospital ${index + 1} at:`, hospital.center); // Debug log

        // Store reference for potential cleanup
        (marker as any).hospitalId = hospital.id;
      });

      // Fit map to show all markers
      if (hospitals.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Add user location to bounds
        if (userLocation) {
          bounds.extend([userLocation.longitude, userLocation.latitude]);
        }
        
        // Add all hospital locations to bounds
        hospitals.forEach(hospital => {
          bounds.extend(hospital.center);
        });
        
        // Fit map to bounds with padding
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Error creating markers:', error);
    }
  }, [map, hospitals, userLocation]);

  const flyToLocation = (longitude: number, latitude: number) => {
    if (map) {
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 1500
    });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Accessing Your Location</h3>
        <p className="text-gray-600 text-center max-w-md">
          Please allow location access to find nearby veterinary hospitals. 
          Your location data is not stored and is only used to show relevant results.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>• Make sure location services are enabled</p>
          <p>• Allow location access when prompted</p>
          <p>• This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Location Access Required</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Retry location access
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { longitude, latitude } = position.coords;
                    setUserLocation({ longitude, latitude });
                    fetchHospitals(longitude, latitude);
                  },
                  (error) => {
                    setError('Could not access your location. Please check your browser settings.');
                    setLoading(false);
                  }
                );
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Header */}
      {userLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Your Location</h3>
              <p className="text-sm text-blue-700">
                {userLocation.city && userLocation.region && userLocation.country 
                  ? `${userLocation.city}, ${userLocation.region}, ${userLocation.country}`
                  : `Coordinates: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-300px)]">
        <div className="lg:col-span-1 overflow-y-auto space-y-4 pr-2">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Veterinary Markers
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {hospitals.length} markers on the map
            </p>
          </div>
          
        {hospitals.length > 0 ? (
          hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-red-50 border border-red-200 p-3 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => flyToLocation(hospital.center[0], hospital.center[1])}
            >
              <h3 className="font-semibold text-red-800 flex items-center">
                <MapPin size={16} className="mr-2 text-red-600"/>
                {hospital.text}
              </h3>
              <p className="text-sm text-red-600 ml-6">
                {hospital.properties?.address}
              </p>
            </div>
          ))
        ) : (
            <p className="text-center text-gray-400 mt-8">No markers found.</p>
        )}
      </div>
        <div className="lg:col-span-3 rounded-lg overflow-hidden h-full relative">
          <div ref={mapContainer} className="w-full h-full" />
          {!map && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading map with markers...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while the map loads</p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      window.location.reload();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Retry Map Loading
                  </button>
                </div>
              </div>
            </div>
          )}
          {!map && loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading map with markers...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
              </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalLocator;