import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RoadDamageReport, SeverityLevel } from '../types/damage';

interface RoadDamageMapProps {
  reports: RoadDamageReport[];
  selectedReportId?: string | null;
  onSelectReport: (report: RoadDamageReport) => void;
  onMapClickCoordinates?: (lat: number, lng: number) => void;
  isPinpointMode?: boolean;
  activeFilterSeverity?: SeverityLevel | 'All';
  vehicleLocation?: { lat: number; lng: number; heading?: number } | null;
  className?: string;
}

export const RoadDamageMap: React.FC<RoadDamageMapProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onMapClickCoordinates,
  isPinpointMode = false,
  activeFilterSeverity = 'All',
  vehicleLocation = null,
  className = 'w-full h-[540px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center San Francisco / Bay Area
    const initialLat = reports[0]?.lat || 37.7749;
    const initialLng = reports[0]?.lng || -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark-neutral cartographic tile layer from CartoDB or OSM
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickCoordinates) {
        onMapClickCoordinates(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when reports or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const filteredReports = reports.filter((r) => {
      if (activeFilterSeverity === 'All') return true;
      return r.overallSeverity === activeFilterSeverity;
    });

    filteredReports.forEach((report) => {
      const isSelected = report.id === selectedReportId;
      const isResolved = report.status === 'Resolved';

      let markerColor = '#dc2626'; // Critical
      if (isResolved) {
        markerColor = '#16a34a';
      } else if (report.overallSeverity === 'High') {
        markerColor = '#ea580c';
      } else if (report.overallSeverity === 'Medium') {
        markerColor = '#d97706';
      } else if (report.overallSeverity === 'Low') {
        markerColor = '#2563eb';
      }

      const iconHtml = `
        <div style="position: relative; cursor: pointer; transform: translate(-50%, -50%);">
          <div style="
            background: ${markerColor};
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: ${isSelected ? '14px' : '11px'};
            font-weight: bold;
            transition: all 0.2s ease;
          ">
            ${isResolved ? '✓' : report.hazardRating}
          </div>
          ${
            isSelected
              ? `<div style="
                  position: absolute;
                  top: -4px;
                  left: -4px;
                  right: -4px;
                  bottom: -4px;
                  border-radius: 50%;
                  border: 2px solid ${markerColor};
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  opacity: 0.7;
                "></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pothole-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([report.lat, report.lng], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif; color: #1e293b; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px;">${report.primaryDefectType}</span>
            <span style="
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              background: ${markerColor};
              color: white;
            ">${report.overallSeverity}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.3;">
            ${report.locationAddress}
          </div>
          <div style="display: flex; gap: 8px; font-size: 11px; margin-bottom: 8px;">
            <div><strong>Hazard:</strong> ${report.hazardRating}/10</div>
            <div><strong>Est. Repair:</strong> $${report.recommendedRepair.estimatedCostUsd}</div>
          </div>
          <button id="btn-inspect-${report.id}" style="
            width: 100%;
            background: #0f172a;
            color: #ffffff;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">View AI Inspection Details</button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${report.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectReport(report);
            map.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectReport(report);
      });

      marker.addTo(markersLayer);
    });

    // If a report is selected, gently pan to it
    if (selectedReportId) {
      const selected = reports.find((r) => r.id === selectedReportId);
      if (selected) {
        map.setView([selected.lat, selected.lng], 15, { animate: true });
      }
    }
  }, [reports, selectedReportId, activeFilterSeverity]);

  // Update vehicle tracker if present
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (vehicleLocation) {
      const vehicleHtml = `
        <div style="position: relative; transform: translate(-50%, -50%);">
          <div style="
            background: #0284c7;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.5);
          ">
            🚗
          </div>
          <div style="
            position: absolute;
            top: -6px;
            left: -6px;
            right: -6px;
            bottom: -6px;
            border-radius: 12px;
            border: 2px solid #38bdf8;
            opacity: 0.8;
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        className: 'vehicle-tracker-marker',
        html: vehicleHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = L.marker([vehicleLocation.lat, vehicleLocation.lng], {
          icon: vehicleIcon,
          zIndexOffset: 1000,
        }).addTo(map);
      } else {
        vehicleMarkerRef.current.setLatLng([vehicleLocation.lat, vehicleLocation.lng]);
      }

      // Pan to vehicle
      map.panTo([vehicleLocation.lat, vehicleLocation.lng], { animate: true });
    } else if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
  }, [vehicleLocation]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 ${className}`}>
      {isPinpointMode && (
        <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
          Click anywhere on the map to pin damage location
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
};
