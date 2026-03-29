"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
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

function InitialUserLocationCenter({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!enabled || hasAttempted.current || !navigator.geolocation) return;
    hasAttempted.current = true;

    let isCancelled = false;
    map.whenReady(() => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (isCancelled) return;
          const targetZoom = Math.max(map.getZoom(), 16);
          map.setView([coords.latitude, coords.longitude], targetZoom, {
            animate: false,
          });
        },
        () => {
          // Keep default center (Lugano) when location is unavailable or denied.
        },
        {
          // Default centering prefers speed/reliability over pinpoint accuracy.
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 300000,
        },
      );
    });

    return () => {
      isCancelled = true;
    };
  }, [enabled, map]);

  return null;
}

function RecenterControl() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const [isIconUnavailable, setIsIconUnavailable] = useState(false);

  function handleRecenter() {
    if (isLocating || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const targetZoom = Math.max(map.getZoom(), 16);
        map.setView([coords.latitude, coords.longitude], targetZoom, {
          animate: true,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  return (
    <div className="leaflet-top leaflet-left">
      <div className="leaflet-control leaflet-control-recenter-wrap">
        <button
          type="button"
          className="leaflet-control-recenter"
          onClick={handleRecenter}
          disabled={isLocating}
          aria-label="Ricentra sulla mia posizione"
          title="Ricentra sulla mia posizione"
        >
          {!isIconUnavailable ? (
            <img
              src="/icons8-near-me-ios11-120.png"
              alt=""
              aria-hidden="true"
              className="h-11 w-11 mx-auto object-contain opacity-80"
              onError={() => setIsIconUnavailable(true)}
            />
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 3l13 8-5.5 1.5L11 20l-2-7L5 3z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
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

      <InitialUserLocationCenter enabled={!draftPosition} />
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

      <RecenterControl />
      <ZoomControl position="topright" />
    </MapContainer>
  );
}
