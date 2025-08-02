import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const CrimeMap = () => {
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState('all');
  const [crimeMarkers, setCrimeMarkers] = React.useState([]);
  const [allCrimes, setAllCrimes] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState('');

  const fetchCrimes = async () => {
    try {
      const { data, error } = await supabase
        .from('crime_reports')
        .select(`
          *,
          crime_categories (
            name
          )
        `);

      if (error) {
        throw error;
      }

      if (data) {
        setAllCrimes(data);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error fetching crime data:', error);
      setErrorMessage('Failed to fetch crime data. Please try again later.');
    }
  };

  const loadLeafletResources = () => {
    return new Promise((resolve) => {
      if (window.L) {
        resolve(true);
        return;
      }
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve(true);
      document.head.appendChild(script);
    });
  };

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;

    await loadLeafletResources();
    await fetchCrimes();

    map.current = window.L.map(mapContainer.current).setView([24.5937, 78.9629], 4);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    const geolocateControl = window.L.control({ position: 'topright' });
    geolocateControl.onAdd = function () {
      const div = window.L.DomUtil.create('div', 'leaflet-bar leaflet-control bg-white p-2 rounded-md shadow-md cursor-pointer');
      div.innerHTML = '📍';
      div.title = 'Find my location';
      div.onclick = function (e) {
        e.stopPropagation();
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.current.setView([latitude, longitude], 15);
            map.current.eachLayer(layer => {
              if (layer.options.isUserLocation) map.current.removeLayer(layer);
            });
            window.L.marker([latitude, longitude], { isUserLocation: true })
              .addTo(map.current)
              .bindPopup('<b>You are here</b>')
              .openPopup();
          }, () => {
            setErrorMessage('Unable to get your location. Please check browser settings.');
          });
        } else {
          setErrorMessage('Geolocation is not supported by this browser.');
        }
      };
      return div;
    };
    geolocateControl.addTo(map.current);
    setIsMapLoaded(true);
  };

  const createCustomIcon = (priority) => {
    const priorityColors = {
      'low': '#eab308',
      'medium': '#f97316',
      'high': '#f43f5e',
      'urgent': '#ef4444'
    };

    const color = priorityColors[priority] || '#6b7280';
    return window.L.divIcon({
      className: 'custom-crime-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const addCrimeMarkers = () => {
    if (!map.current) return;

    crimeMarkers.forEach(marker => map.current.removeLayer(marker));

    const filteredCrimes = allCrimes.filter(crime => {
      const priorityMatch = selectedPriority === 'all' || crime.priority === selectedPriority;
      const searchMatch = !searchQuery ||
        (crime.title && crime.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (crime.description && crime.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (crime.crime_categories && crime.crime_categories.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return priorityMatch && searchMatch;
    });

    const newMarkers = filteredCrimes.map((crime) => {
      if (typeof crime.latitude !== 'number' || typeof crime.longitude !== 'number') {
        console.warn('Skipping crime with invalid coordinates:', crime);
        return null;
      }
      const marker = window.L.marker([crime.latitude, crime.longitude], {
        icon: createCustomIcon(crime.priority)
      }).addTo(map.current);
      
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${crime.title}</h3>
            <span style="background-color: ${createCustomIcon(crime.priority).options.html.match(/background-color: (.*?);/)[1]}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; text-transform: uppercase; font-weight: bold;">
              ${crime.priority}
            </span>
          </div>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; font-style: italic;">
            Category: ${crime.crime_categories.name}
          </p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #374151;">${crime.description}</p>
          <div style="font-size: 12px; color: #6b7280;">
            <div>📅 Reported: ${new Date(crime.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      return marker;
    }).filter(Boolean);

    setCrimeMarkers(newMarkers);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      addCrimeMarkers();
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        map.current.setView([parseFloat(lat), parseFloat(lon)], 14);
        setErrorMessage('');
      } else {
        addCrimeMarkers();
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMessage('Location search failed. Filtering by text instead.');
      addCrimeMarkers();
    }
  };

  React.useEffect(() => {
    initializeMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (isMapLoaded) {
      addCrimeMarkers();
    }
  }, [selectedPriority, searchQuery, allCrimes, isMapLoaded]);

  const priorityColors = {
    low: '#eab308',
    medium: '#f97316',
    high: '#f43f5e',
    urgent: '#ef4444'
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row gap-2">
        <div className="flex-1 max-w-lg">
          <div className="flex gap-1 bg-white rounded-lg shadow-lg overflow-hidden">
            <Input
              type="text"
              placeholder="Search location, title, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border-0 focus-visible:ring-0 text-base"
            />
            <Button onClick={handleSearch} variant="ghost" size="icon" className="px-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </Button>
          </div>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="bg-white shadow-lg">
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="absolute top-16 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg w-56">
          <h4 className="font-semibold text-sm mb-3">Filter by Priority</h4>
          <div className="space-y-2">
            {['all', 'high', 'medium', 'low'].map(priority => (
              <label key={priority} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={priority}
                  checked={selectedPriority === priority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                />
                <span className="capitalize">{priority === 'all' ? 'All Priorities' : `${priority}`}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div ref={mapContainer} className="absolute inset-0 z-0" />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-md text-gray-700">Loading Crime Map...</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[1000]" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {isMapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] backdrop-blur-sm">
          <h3 className="font-semibold text-sm mb-2">Priority Legend</h3>
          <div className="space-y-1 text-xs">
            {['urgent', 'high', 'medium', 'low'].map(priority => (
              <div key={priority} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: priorityColors[priority] }}
                ></div>
                <span className="capitalize">{priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] backdrop-blur-sm w-48">
          <h3 className="font-semibold text-sm mb-2">Filtered Statistics</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span>Total Displayed:</span>
              <span className="font-medium">{crimeMarkers.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>High Priority:</span>
              <span className="font-medium text-red-600">
                {allCrimes.filter(c => c.priority === 'high' && (selectedPriority === 'all' || selectedPriority === 'high')).length}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Medium Priority:</span>
              <span className="font-medium text-orange-600">
                {allCrimes.filter(c => c.priority === 'medium' && (selectedPriority === 'all' || selectedPriority === 'medium')).length}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Low Priority:</span>
              <span className="font-medium text-yellow-600">
                {allCrimes.filter(c => c.priority === 'low' && (selectedPriority === 'all' || selectedPriority === 'low')).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrimeMap;