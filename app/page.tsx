"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  useMap,
  ZoomControl,
} from "react-leaflet";
import * as exifr from "exifr";
import { fixLeafletIcons, getGlassPinIcon } from "@/lib/leaflet";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";

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
const DEFAULT_MAP_CENTER: [number, number] = [46.004238, 8.960317]; // Liceo Lugano 1

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

      onMapClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

function MapCenterUpdater({ position }: { position: Position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 15, {
        animate: true,
      });
    }
  }, [position, map]);

  return null;
}

export default function HomePage() {
  const [draftPosition, setDraftPosition] = useState<Position>(null);
  const [reports, setReports] = useState<StickerReport[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<StickerReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [showNameForm, setShowNameForm] = useState(false);
  const [glassPinIcon, setGlassPinIcon] = useState<any>(null);

  useEffect(() => {
    fixLeafletIcons();
    setGlassPinIcon(getGlassPinIcon());
    loadReports();

    // Check if we're returning from the stickers list with a location
    if (typeof window !== "undefined") {
      const stickerLocation = sessionStorage.getItem("stickerLocation");
      if (stickerLocation) {
        try {
          const location = JSON.parse(stickerLocation);
          setDraftPosition({ lat: location.lat, lng: location.lng });
          sessionStorage.removeItem("stickerLocation"); // Clear after use
        } catch (err) {
          console.error("Error parsing sticker location:", err);
        }
      }
    }
  }, []);

  async function loadReports() {
    const { data, error } = await supabase
      .from("sticker_reports")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Errore caricamento report:", error);
      return;
    }

    setReports(data || []);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setSelected(null);
    setDraftPosition(null);
    setDate(null);

    try {
      const exif = await exifr.parse(f);
      console.log("EXIF:", exif);

      if (exif?.DateTimeOriginal) {
        setDate(exif.DateTimeOriginal.toISOString());
      }

      if (exif?.latitude && exif?.longitude) {
        setDraftPosition({
          lat: exif.latitude,
          lng: exif.longitude,
        });
      } else {
        alert("Nessun GPS trovato. Clicca sulla mappa per scegliere la posizione.");
      }
    } catch (err) {
      console.error("Errore EXIF:", err);
      alert("Impossibile leggere i metadati. Clicca sulla mappa per scegliere la posizione.");
    }

    e.target.value = "";
  }

  async function save() {
    if (!file || !draftPosition) {
      alert("Manca foto o posizione.");
      return;
    }

    if (!username.trim()) {
      setShowNameForm(true);
      return;
    }

    setIsSaving(true);

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("stickers")
        .upload(name, file);

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        alert(`Errore upload: ${uploadError.message}`);
        setIsSaving(false);
        return;
      }

      const { error: dbError } = await supabase.from("sticker_reports").insert({
        image_path: name,
        lat: draftPosition.lat,
        lng: draftPosition.lng,
        captured_at: date,
        uploaded_by: username.trim(),
      });

      if (dbError) {
        console.error("DB ERROR:", dbError);
        alert(`Errore database: ${dbError.message}`);
        setIsSaving(false);
        return;
      }

      alert("Salvato!");

      setFile(null);
      setDate(null);
      setDraftPosition(null);
      setUsername("");
      setShowNameForm(false);

      await loadReports();
    } finally {
      setIsSaving(false);
    }
  }

  function getUrl(path: string) {
    return supabase.storage.from("stickers").getPublicUrl(path).data.publicUrl;
  }

  const isChoosingLocationManually = !!file && !draftPosition;
  const showSaveButton = !!file;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Logo */}
      <div className="absolute top-4 left-6 z-[2000]">
        <Link href="/" title="Home page">
          <Logo />
        </Link>
      </div>

      <div className="flex justify-start items-center h-screen w-screen pt-4">
        <div className="ml-6 mr-6 w-[calc(100vw-3rem)] h-3/4 rounded-2xl overflow-hidden shadow-2xl relative">
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
            onMapClick={setDraftPosition}
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
              click: () => {
                setSelected(report);
              },
            }}
          />
        ))}
        <ZoomControl position="topright" />
      </MapContainer>

      {!file && (
        <div className="absolute bottom-6 left-1/2 z-[3000] -translate-x-1/2">
          <label className="flex cursor-pointer items-center justify-center rounded-full border border-white/65 bg-white/35 px-6 py-3 text-slate-900 shadow-[0_12px_26px_rgba(0,0,0,0.2)] backdrop-blur-md transition hover:bg-white/50 active:scale-95">
            Carica foto
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      )}
        </div>
      </div>

      {/* Name Form Modal */}
      {showNameForm && file && (
        <>
          <div className="fixed inset-0 z-[3000] bg-black/50" onClick={() => setShowNameForm(false)} />
          <div className="fixed inset-0 z-[3001] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Chi sei? 👤</h2>
              <p className="text-gray-600 mb-4">
                Inserisci il tuo nome per tracciare chi ha messo lo sticker
              </p>
              <input
                type="text"
                placeholder="Il tuo nome..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && username.trim()) {
                    setShowNameForm(false);
                    save();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNameForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    if (username.trim()) {
                      setShowNameForm(false);
                      save();
                    }
                  }}
                  disabled={!username.trim()}
                  className="flex-1 px-4 py-3 bg-blue-400 text-white rounded-lg font-semibold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continua
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {file && (
        <div className="fixed inset-x-0 bottom-0 z-[3000] animate-in slide-in-from-bottom duration-300 rounded-t-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Drag handle */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />

          {/* Image Preview */}
          <div className="mb-4 rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-full h-auto max-h-[50vh] object-contain"
            />
          </div>

          {/* File Info */}
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Nome File</p>
              <p className="font-semibold text-gray-900">{file.name}</p>
            </div>

            {date && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Data Cattura</p>
                <p className="text-gray-700">{new Date(date).toLocaleString()}</p>
              </div>
            )}

            {draftPosition && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Coordinate</p>
                <p className="text-gray-700">
                  {draftPosition.lat.toFixed(5)}, {draftPosition.lng.toFixed(5)}
                </p>
              </div>
            )}

            {!draftPosition && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-900">
                  📍 Clicca sulla mappa per selezionare la posizione
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={!draftPosition || isSaving}
              className="flex-1 rounded-2xl bg-green-600 py-4 text-white font-semibold shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
            >
              {isSaving ? "Salvataggio..." : "✓ Salva"}
            </button>

            <button
              onClick={() => {
                setFile(null);
                setDate(null);
                setDraftPosition(null);
              }}
              className="flex-1 rounded-2xl bg-red-600 py-4 text-white font-semibold shadow-lg transition active:scale-95 hover:bg-red-700"
            >
              ✕ Annulla
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-[4000] rounded-t-3xl bg-white p-4 shadow-2xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />

          <img
            src={getUrl(selected.image_path)}
            alt="Sticker"
            className="max-h-[40vh] w-full rounded-2xl object-cover"
          />

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Data:</strong>{" "}
              {selected.captured_at
                ? new Date(selected.captured_at).toLocaleString()
                : "Non disponibile"}
            </p>

            <p>
              <strong>Coordinate:</strong>{" "}
              {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-2xl bg-green-600 py-3 text-white shadow">
              Confermo
            </button>

            <button className="flex-1 rounded-2xl bg-red-600 py-3 text-white shadow">
              Rimosso
            </button>
          </div>

          <button
            onClick={() => setSelected(null)}
            className="mt-3 w-full rounded-2xl bg-gray-100 py-3 text-sm text-gray-700"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Menu Button - Link to Stickers List Page */}
      <Link
        href="/stickers"
        className="fixed top-6 right-6 z-[3500] flex items-center justify-center rounded-full bg-white w-12 h-12 shadow-lg hover:bg-gray-50 transition active:scale-95"
        title="View all stickers"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Link>

      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-[4000] rounded-t-3xl bg-white p-4 shadow-2xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />

          <img
            src={getUrl(selected.image_path)}
            alt="Sticker"
            className="max-h-[40vh] w-full rounded-2xl object-cover"
          />

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Data:</strong>{" "}
              {selected.captured_at
                ? new Date(selected.captured_at).toLocaleString()
                : "Non disponibile"}
            </p>

            <p>
              <strong>Coordinate:</strong>{" "}
              {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
            </p>
          </div>

          <button
            onClick={() => setSelected(null)}
            className="mt-3 w-full rounded-2xl bg-gray-100 py-3 text-sm text-gray-700"
          >
            Chiudi
          </button>
        </div>
      )}
    </main>
  );
}
