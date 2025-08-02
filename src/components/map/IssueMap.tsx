import React from 'react';
// Import the new types for issues and categories
import { IssueReport } from '@/integrations/supabase/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

// --- Main IssueMap Component ---
// Renamed from CrimeMap to IssueMap for clarity
const IssueMap = () => {
  // --- Refs and State ---
  const mapContainer = React.useRef<HTMLDivElement>(null);
  // Use a more specific type for the map ref if possible, or any for simplicity with Leaflet
  const map = React.useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState('all');

  // Renamed state variables from 'crime' to 'issue'
  const [issueMarkers, setIssueMarkers] = React.useState<any[]>([]);
  // Explicitly type the state with the new IssueReport type
  const [allIssues, setAllIssues] = React.useState<IssueReport[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');

  // --- Supabase Data Fetching ---
  /**
   * Fetches issue reports and their associated categories from Supabase.
   */
  const fetchIssues = async () => {
    try {
      // Updated query to use 'issue_reports' and 'issue_categories'
      const { data, error } = await supabase
        .from('issue_reports')
        .select(`
          *,
          issue_categories (
            name
          )
        `);

      if (error) {
        throw error;
      }

      if (data) {
        // Type assertion to ensure data matches our expected structure
        setAllIssues(data as any as IssueReport[]);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error fetching issue data:', error);
      // Updated error message
      setErrorMessage('Failed to fetch issue data. Please try again later.');
    }
  };

  // --- Leaflet Map Resource Loading ---
  // This utility function is well-written and doesn't need changes.
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

  // --- Map Initialization ---
  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;

    await loadLeafletResources();
    await fetchIssues(); // Fetch issues instead of crimes

    map.current = window.L.map(mapContainer.current).setView([24.5937, 78.9629], 4);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // The geolocate control is a great feature and is kept as is.
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
            map.current.eachLayer((layer: any) => {
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

  // --- Custom Marker Icon Creation ---
  // This function is generic and well-written.
  const createCustomIcon = (priority: string | null | undefined) => {
    const priorityColors: { [key: string]: string } = {
      'low': '#eab308',
      'medium': '#f97316',
      'high': '#f43f5e',
      'urgent': '#ef4444'
    };

    const color = priority ? priorityColors[priority] : '#6b7280';
    return window.L.divIcon({
      // Updated class name for better semantics
      className: 'custom-issue-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // --- Add/Update Issue Markers on Map ---
  const addIssueMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    issueMarkers.forEach(marker => map.current.removeLayer(marker));

    // Filter issues based on current state (priority and search query)
    const filteredIssues = allIssues.filter(issue => {
      const priorityMatch = selectedPriority === 'all' || issue.priority === selectedPriority;
      const searchMatch = !searchQuery ||
        (issue.title && issue.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        // Updated to use the correct nested object property
        (issue.issue_categories && (issue.issue_categories as any).name.toLowerCase().includes(searchQuery.toLowerCase()));
      return priorityMatch && searchMatch;
    });

    // Create and add new markers to the map
    const newMarkers = filteredIssues.map((issue) => {
      if (typeof issue.latitude !== 'number' || typeof issue.longitude !== 'number') {
        console.warn('Skipping issue with invalid coordinates:', issue);
        return null;
      }
      const marker = window.L.marker([issue.latitude, issue.longitude], {
        icon: createCustomIcon(issue.priority)
      }).addTo(map.current);
      
      // Updated popup content with new variable names and structure
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${issue.title}</h3>
            <span style="background-color: ${createCustomIcon(issue.priority).options.html.match(/background-color: (.*?);/)?.[1] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; text-transform: uppercase; font-weight: bold;">
              ${issue.priority || 'N/A'}
            </span>
          </div>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; font-style: italic;">
            Category: ${(issue.issue_categories as any).name}
          </p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #374151;">${issue.description}</p>
          <div style="font-size: 12px; color: #6b7280;">
            <div>📅 Reported: ${new Date(issue.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      return marker;
    }).filter(Boolean); // Remove any nulls from invalid coordinates

    setIssueMarkers(newMarkers as any[]);
  };

  // --- Search Handler ---
  // This attempts to geocode a location search. If it fails, it falls back to text filtering.
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      addIssueMarkers();
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
        // If no location found, just filter by text
        addIssueMarkers();
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMessage('Location search failed. Filtering by text instead.');
      addIssueMarkers();
    }
  };
  
  // --- Memoized Statistics ---
  // Calculate statistics only when dependencies change for better performance.
  const filteredStats = React.useMemo(() => {
    const filtered = allIssues.filter(issue => {
      const priorityMatch = selectedPriority === 'all' || issue.priority === selectedPriority;
      const searchMatch = !searchQuery ||
        (issue.title && issue.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (issue.issue_categories && (issue.issue_categories as any).name.toLowerCase().includes(searchQuery.toLowerCase()));
      return priorityMatch && searchMatch;
    });

    return {
      total: filtered.length,
      high: filtered.filter(i => i.priority === 'high').length,
      medium: filtered.filter(i => i.priority === 'medium').length,
      low: filtered.filter(i => i.priority === 'low').length,
      urgent: filtered.filter(i => i.priority === 'urgent').length,
    };
  }, [allIssues, selectedPriority, searchQuery]);


  // --- Effects ---
  React.useEffect(() => {
    initializeMap();
    // Cleanup function to remove the map instance when the component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  React.useEffect(() => {
    if (isMapLoaded) {
      addIssueMarkers();
    }
  }, [selectedPriority, searchQuery, allIssues, isMapLoaded]);

  // --- Render JSX ---
  const priorityColors: { [key: string]: string } = {
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
            {['all', 'urgent', 'high', 'medium', 'low'].map(priority => (
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
            {/* Updated loading text */}
            <p className="text-md text-gray-700">Loading Issue Map...</p>
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

      {/* Refactored statistics panel to use the memoized stats */}
      {isMapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] backdrop-blur-sm w-48">
          <h3 className="font-semibold text-sm mb-2">Filtered Statistics</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span>Total Displayed:</span>
              <span className="font-medium">{filteredStats.total}</span>
            </div>
             <div className="flex justify-between gap-4">
              <span>Urgent:</span>
              <span className="font-medium text-red-600">{filteredStats.urgent}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>High Priority:</span>
              <span className="font-medium text-rose-600">{filteredStats.high}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Medium Priority:</span>
              <span className="font-medium text-orange-600">{filteredStats.medium}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Low Priority:</span>
              <span className="font-medium text-yellow-600">{filteredStats.low}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueMap;
