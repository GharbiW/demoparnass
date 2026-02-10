
"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet-routing-machine";

interface LiveTripRoutingProps {
  start: LatLngExpression;
  end: LatLngExpression;
}

export const LiveTripRouting = ({ start, end }: LiveTripRoutingProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start),
        L.latLng(end)
      ],
      routeWhileDragging: false,
      show: false, // Do not show the itinerary text panel
      addWaypoints: false, // Do not allow adding new waypoints by clicking on the map
      lineOptions: {
        styles: [{ color: 'blue', opacity: 0.7, weight: 5, dashArray: '10, 10' }]
      },
      createMarker: () => null, // Do not create start/end markers
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end]);

  return null;
};
