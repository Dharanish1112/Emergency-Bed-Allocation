import { useEffect, useRef, useState } from 'react';

const GoogleMap = ({ origin, destination, showRoute = false, hospitals = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBFnHwX5H7yf3X9Lq8rK4nM5tP6oQ7wR9s&callback=initGoogleMap';
    script.async = true;
    script.defer = true;

    window.initGoogleMap = () => {
      setIsLoaded(true);
      initializeMap();
    };

    script.onerror = () => {
      setHasError(true);
    };

    document.head.appendChild(script);

    return () => {
      if (window.initGoogleMap) {
        delete window.initGoogleMap;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapOptions = {
      center: { lat: 10.7905, lng: 78.7047 }, // Trichy center
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      draggable: false,
      suppressMarkers: false
    });
    directionsRendererRef.current.setMap(mapInstanceRef.current);

    // Add hospital markers
    if (hospitals.length > 0 && !showRoute) {
      addHospitalMarkers();
    }
  };

  const addHospitalMarkers = () => {
    if (!mapInstanceRef.current) return;

    hospitals.forEach(hospital => {
      if (hospital.coordinates) {
        const marker = new window.google.maps.Marker({
          position: hospital.coordinates,
          map: mapInstanceRef.current,
          title: hospital.name,
          icon: {
            url: hospital.status === 'available' 
              ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
              : hospital.status === 'critical'
              ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
              : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h4 style="margin: 0 0 4px 0; font-weight: bold;">${hospital.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px;">${hospital.address}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">ETA: ${hospital.eta}</p>
              <p style="margin: 0; font-size: 12px;">Beds: ICU ${hospital.beds.icu}, Emergency ${hospital.beds.emergency}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });
      }
    });
  };

  useEffect(() => {
    if (isLoaded && origin && destination && showRoute) {
      displayRoute();
    }
  }, [isLoaded, origin, destination, showRoute]);

  useEffect(() => {
    if (isLoaded && hospitals.length > 0 && !showRoute) {
      addHospitalMarkers();
    }
  }, [isLoaded, hospitals, showRoute]);

  const displayRoute = () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    const request = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
        
        // Add markers for origin and destination
        if (mapInstanceRef.current) {
          // Clear existing markers if any
          if (window.currentMarkers) {
            window.currentMarkers.forEach(marker => marker.setMap(null));
          }
          window.currentMarkers = [];

          // Add origin marker
          const originMarker = new window.google.maps.Marker({
            position: origin,
            map: mapInstanceRef.current,
            title: 'Your Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
          });

          // Add destination marker
          const destMarker = new window.google.maps.Marker({
            position: destination,
            map: mapInstanceRef.current,
            title: 'Hospital',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });

          window.currentMarkers.push(originMarker, destMarker);
        }
      } else {
        console.error('Directions request failed due to ' + status);
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(pos);
            mapInstanceRef.current.setZoom(14);
            
            // Add current location marker
            new window.google.maps.Marker({
              position: pos,
              map: mapInstanceRef.current,
              title: 'Your Current Location',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              }
            });
          }
        },
        () => {
          console.error('Error: The Geolocation service failed.');
        }
      );
    } else {
      console.error('Error: Your browser doesn\'t support geolocation.');
    }
  };

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px] rounded-lg"
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center w-full h-full">
            <img 
              src="https://maps.locationiq.com/v2/staticmap?key=pk.7e4c5a2a5c2b4a4b8a5c5a2a5c2b4a4b&center=10.7905,78.7047&zoom=12&size=600x400&format=png&markers=10.7905,78.7047;10.8155,78.6496;10.7628,78.8143;10.8350,78.6857;10.7995,78.7543;10.7061,78.7850"
              alt="Trichy Hospitals Map"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-center justify-center h-full">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 text-sm font-medium mb-1">Map unavailable</p>
              <p className="text-gray-500 text-xs">Google Maps could not be loaded</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoaded && (
        <button
          onClick={getCurrentLocation}
          className="absolute top-4 right-4 bg-white shadow-md rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors z-10"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          My Location
        </button>
      )}
    </div>
  );
};

export default GoogleMap;
