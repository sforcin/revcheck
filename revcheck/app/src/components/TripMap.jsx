import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { EVENT_INFO } from "../lib/analysis.js";
import { mph } from "../lib/units.js";

// Zooms the map to the route when a trip loads, and to an event when one is picked.
function Camera({ path, focus }) {
  const map = useMap();
  useEffect(() => {
    if (path.length) map.fitBounds(path, { padding: [24, 24] });
  }, [path, map]);
  useEffect(() => {
    if (focus) map.flyTo(focus, 17, { duration: 0.6 });
  }, [focus, map]);
  return null;
}

export default function TripMap({ samples, events, selected, onSelect }) {
  const path = useMemo(() => samples.map((s) => [s.lat, s.lon]), [samples]);
  const focus = selected != null ? [events[selected].lat, events[selected].lon] : null;

  return (
    <div className="card map-card">
      <MapContainer className="map" center={path[0]} zoom={14} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={path} pathOptions={{ color: "#52514e", weight: 4, opacity: 0.8 }} />
        {events.map((e, i) => (
          <CircleMarker
            key={i}
            center={[e.lat, e.lon]}
            radius={selected === i ? 11 : e.severity === "harsh" ? 8 : 6}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: EVENT_INFO[e.type].color,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(i) }}
          >
            <Tooltip>
              {EVENT_INFO[e.type].label} ({e.severity}) · {e.peak_g.toFixed(2)} g at{" "}
              {Math.round(mph(e.speed_mps))} mph
            </Tooltip>
          </CircleMarker>
        ))}
        <Camera path={path} focus={focus} />
      </MapContainer>
    </div>
  );
}
