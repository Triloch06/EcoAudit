"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create a custom red icon for the highest waste area
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface HighestAreaData {
  latitude: number;
  longitude: number;
  total_weight: number;
  entry_count: number;
}

interface HighestWasteMapProps {
  data: HighestAreaData;
}

export default function HighestWasteMap({ data }: HighestWasteMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 w-full bg-slate-100 animate-pulse rounded-md"></div>;

  return (
    <div className="h-full w-full relative z-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
      <MapContainer 
        center={[data.latitude, data.longitude]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[data.latitude, data.longitude]} icon={redIcon}>
          <Popup>
            <div className="font-semibold text-rose-600">Highest Waste Area</div>
            <div className="text-sm">{data.total_weight.toFixed(2)} kg</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
