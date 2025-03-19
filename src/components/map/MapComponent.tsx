'use client'

import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Selection } from '@/types/selections';

interface MapComponentProps {
  isOpen: boolean;
  onClose: () => void;
  selections: Selection[];
  hotelData?: {
    properties: Array<{
      name: string;
      gps_coordinates?: {
        latitude: number;
        longitude: number;
      };
      hotel_class?: string;
      rate_per_night?: {
        lowest: string;
      };
    }>;
  };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapComponent: React.FC<MapComponentProps> = ({ isOpen, onClose, selections, hotelData }) => {  
  const modalRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (isOpen && mapContainer.current && !map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN || '';
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-100, 40],
        zoom: 2
      });

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        if (hotelData?.properties) {
          addMarkers();
        }
      });
    }
  }, [isOpen]);

  // Function to add markers
  const addMarkers = () => {
    if (!map.current || !hotelData?.properties) return;
        
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    hotelData.properties.forEach(hotel => {
      if (hotel.gps_coordinates) {
        const { latitude, longitude } = hotel.gps_coordinates;

        const marker = new mapboxgl.Marker()
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <strong>${hotel.name}</strong>
                  ${hotel.hotel_class ? `<br>${hotel.hotel_class}` : ''}
                  ${hotel.rate_per_night ? `<br>From ${hotel.rate_per_night.lowest}` : ''}
                </div>
              `)
          )
          .addTo(map.current!);

        markers.current.push(marker);
        bounds.extend([longitude, latitude]);
      }
    });

    if (markers.current.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  };

  // Add markers when hotel data changes
  useEffect(() => {
    if (map.current && hotelData?.properties) {
      addMarkers();
    }
  }, [hotelData]);

  // Cleanup
  useEffect(() => {
    return () => {
      markers.current.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div 
          ref={mapContainer} 
          className="w-full h-full rounded-lg"
        />
      </div>
    </div>
  );
};

export default React.memo(MapComponent); 