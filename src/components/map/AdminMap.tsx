import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Report {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  is_flagged: boolean;
  flag_count: number;
  crime_categories: {
    name: string;
    color: string;
  };
  created_at: string;
}

const AdminMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportMarkers, setReportMarkers] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('crime_reports')
        .select(`
          id,
          title,
          description,
          latitude,
          longitude,
          status,
          is_flagged,
          flag_count,
          created_at,
          crime_categories (
            name,
            color
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
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

  const createCustomIcon = (report: Report) => {
    const color = report.is_flagged ? '#ef4444' : report.crime_categories?.color || '#3b82f6';
    return window.L.divIcon({
      className: 'custom-admin-marker',
      html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;

    await loadLeafletResources();

    map.current = window.L.map(mapContainer.current).setView([40.7128, -74.0060], 10);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    setIsMapLoaded(true);
  };

  const addReportMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    reportMarkers.forEach(marker => map.current.removeLayer(marker));

    const newMarkers = reports.map((report) => {
      if (typeof report.latitude !== 'number' || typeof report.longitude !== 'number') {
        return null;
      }

      const marker = window.L.marker([report.latitude, report.longitude], {
        icon: createCustomIcon(report)
      }).addTo(map.current);

      marker.on('click', () => {
        setSelectedReport(report);
      });

      return marker;
    }).filter(Boolean);

    setReportMarkers(newMarkers);

    // Fit map to show all markers if there are any
    if (newMarkers.length > 0) {
      const group = new window.L.featureGroup(newMarkers);
      map.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  useEffect(() => {
    initializeMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isMapLoaded && reports.length > 0) {
      addReportMarkers();
    }
  }, [isMapLoaded, reports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning border-warning/30';
      case 'addressed': return 'bg-info/20 text-info border-info/30';
      case 'resolved': return 'bg-success/20 text-success border-success/30';
      case 'closed': return 'bg-muted/20 text-muted-foreground border-muted/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Crime Reports Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative">
          <div ref={mapContainer} className="w-full h-[340px] rounded-b-lg" />
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-b-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedReport ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">{selectedReport.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {selectedReport.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedReport.crime_categories?.color }}
                    />
                    <span className="text-xs font-medium">
                      {selectedReport.crime_categories?.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-xs">
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {selectedReport.is_flagged && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Flags</span>
                    <Badge variant="destructive" className="text-xs">
                      {selectedReport.flag_count}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <MapPin className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Click on a marker to view report details
              </p>
              <p className="text-xs text-muted-foreground">
                {reports.length} reports found
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMap;