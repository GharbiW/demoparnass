
"use client"

import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet"
import { Icon, LatLngExpression } from "leaflet"
import { Truck } from "lucide-react"
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveTripRouting } from "./live-trip-routing";


const startPoint: LatLngExpression = [45.75, 4.85]; // Lyon
const endPoint: LatLngExpression = [47.32, 5.04];  // Dijon

const actualRoute: LatLngExpression[] = [
    [45.75, 4.85], // Lyon
    [46.22, 4.81], // Mâcon area (slight deviation)
    [46.5, 4.9],   // Deviation
    [47.00, 5.00], // Rejoining
];

const livePosition: LatLngExpression = [47.00, 5.00];

export function LiveTripMap() {
    
  const truckIcon = new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(renderToStaticMarkup(
        <Truck className="text-primary" size={32} strokeWidth={2} />
    ))}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <MapContainer center={[46.5, 4.9]} zoom={8} scrollWheelZoom={false} style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LiveTripRouting start={startPoint} end={endPoint} />
      <Polyline pathOptions={{ color: 'green' }} positions={actualRoute}>
         <Tooltip sticky>Itinéraire Réel</Tooltip>
      </Polyline>
      <Marker position={livePosition} icon={truckIcon}>
        <Tooltip>Position Actuelle</Tooltip>
      </Marker>
    </MapContainer>
  )
}
