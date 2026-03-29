"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { fixLeafletIcons, getGlassPinIcon } from "@/lib/leaflet";

type Position = {
  lat: number;
  lng: number;
} | null;

type StickerReport = {
  id: string;
  image_path: string;
  lat: number;
  lng: number;
  captured_at: string | null;
};

const MONO_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const MONO_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const DEFAULT_MAP_CENTER: [number, number] = [46.004238, 8.960317];

function MapClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick: (position: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapCenterUpdater({ position }: { position: Position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 15, { animate: true });
    }
  }, [position, map]);
  return null;
}

type MapProps = {
  draftPosition: Position;
  reports: StickerReport[];
  isChoosingLocationManually: boolean;
  onMapClick: (position: { lat: number; lng: number }) => void;
  onReportClick: (report: StickerReport) => void;
};

export default function Map({
  draftPosition,
  reports,
  isChoosingLocationManually,
  onMapClick,
  onReportClick,
}: MapProps) {
  const glassPinIcon = getGlassPinIcon();

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  return (
    <MapContainer
      center={DEFAULT_MAP_CENTER}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      className="design-mono-map"
    >
      <TileLayer url={MONO_TILE_URL} attribution={MONO_TILE_ATTRIBUTION} />

      <MapCenterUpdater position={draftPosition} />

      <MapClickHandler
        enabled={isChoosingLocationManually}
        onMapClick={onMapClick}
      />

      {draftPosition && (
        <Marker
          position={[draftPosition.lat, draftPosition.lng]}
          icon={glassPinIcon || undefined}
        />
      )}

      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.lat, report.lng]}
          icon={glassPinIcon || undefined}
          eventHandlers={{
            click: () => onReportClick(report),
          }}
        />
      ))}

      <ZoomControl position="topright" />
    </MapContainer>
  );
}