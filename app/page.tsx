"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Logo = dynamic(() => import("@/components/Logo").then(m => m.Logo), {
  ssr: false,
});

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl" />
  ),
});

type Position = { lat: number; lng: number } | null;

type StickerReport = {
  id: string;
  image_path: string;
  lat: number;
  lng: number;
  captured_at: string | null;
  uploaded_at?: string | null;
  upvotes?: number;
  downvotes?: number;
  last_status?: "seen" | "removed" | null;
  last_status_at?: string | null;
};

type VoteChoice = "upvote" | "downvote" | null;
type StickerStatus = "seen" | "removed";

export default function HomePageClient() {
  const [supabase, setSupabase] = useState<any>(null);
  const [draftPosition, setDraftPosition] = useState<Position>(null);
  const [reports, setReports] = useState<StickerReport[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<StickerReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [showNameForm, setShowNameForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sessionVotes, setSessionVotes] = useState<Record<string, VoteChoice>>(
    {}
  );

  useEffect(() => {
    const init = async () => {
      const { supabase: sb } = await import("@/lib/supabase");
      setSupabase(sb);

      const { data, error } = await sb
        .from("sticker_reports")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (!error) setReports(data || []);

      const stickerLocation = sessionStorage.getItem("stickerLocation");
      if (stickerLocation) {
        try {
          const location = JSON.parse(stickerLocation);
          setDraftPosition({ lat: location.lat, lng: location.lng });
          sessionStorage.removeItem("stickerLocation");
        } catch (err) {
          console.error("Error parsing sticker location:", err);
        }
      }
    };
    init();
  }, []);

  async function loadReports() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("sticker_reports")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (!error) setReports(data || []);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setSelected(null);
    setDraftPosition(null);
    setDate(null);
    setPreviewUrl(URL.createObjectURL(f));

    try {
      const exifr = await import("exifr");
      const exif = await exifr.parse(f);
      if (exif?.DateTimeOriginal) setDate(exif.DateTimeOriginal.toISOString());
      if (exif?.latitude && exif?.longitude) {
        setDraftPosition({ lat: exif.latitude, lng: exif.longitude });
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
    if (!supabase || !file || !draftPosition) {
      alert("Manca foto o posizione.");
      return;
    }

    if (!username.trim()) {
      setShowNameForm(true);
      return;
    }

    const fallbackCapturedAt = date ?? new Date().toISOString();

    setIsSaving(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("stickers")
        .upload(name, file);

      if (uploadError) {
        alert(`Errore upload: ${uploadError.message}`);
        return;
      }

      const { error: dbError } = await supabase.from("sticker_reports").insert({
        image_path: name,
        lat: draftPosition.lat,
        lng: draftPosition.lng,
        captured_at: fallbackCapturedAt,
        uploaded_by: username.trim(),
      });

      if (dbError) {
        alert(`Errore database: ${dbError.message}`);
        return;
      }

      alert("Salvato!");
      setFile(null);
      setDate(null);
      setDraftPosition(null);
      setUsername("");
      setShowNameForm(false);
      setPreviewUrl(null);
      await loadReports();
    } finally {
      setIsSaving(false);
    }
  }

  function getUrl(path: string) {
    if (!supabase) return "";
    return supabase.storage.from("stickers").getPublicUrl(path).data.publicUrl;
  }

  function getStickerDate(sticker: StickerReport) {
    return sticker.captured_at || sticker.uploaded_at || null;
  }

  async function handleVote(
    stickerId: string,
    voteType: "upvote" | "downvote"
  ) {
    if (!supabase || !selected || selected.id !== stickerId) return;

    try {
      const currentChoice = sessionVotes[stickerId] ?? null;
      const nextChoice: VoteChoice =
        currentChoice === voteType ? null : voteType;
      const nowIso = new Date().toISOString();
      const nextStatus: StickerStatus | null =
        nextChoice === "upvote"
          ? "seen"
          : nextChoice === "downvote"
          ? "removed"
          : null;

      let upvotes = selected.upvotes || 0;
      let downvotes = selected.downvotes || 0;

      if (currentChoice === "upvote") upvotes = Math.max(0, upvotes - 1);
      if (currentChoice === "downvote") downvotes = Math.max(0, downvotes - 1);

      if (nextChoice === "upvote") upvotes += 1;
      if (nextChoice === "downvote") downvotes += 1;

      const updatedSticker: StickerReport = {
        ...selected,
        upvotes,
        downvotes,
        last_status: nextStatus ?? selected.last_status ?? null,
        last_status_at: nextStatus ? nowIso : selected.last_status_at ?? null,
      };

      setSessionVotes((prev) => ({
        ...prev,
        [stickerId]: nextChoice,
      }));

      setSelected(updatedSticker);
      setReports((prev) =>
        prev.map((s) => (s.id === stickerId ? updatedSticker : s))
      );

      if (nextStatus) {
        const { error: updateError } = await supabase
          .from("sticker_reports")
          .update({
            last_status: nextStatus,
            last_status_at: nowIso,
          })
          .eq("id", stickerId);

        if (updateError) {
          console.error("Status update error:", updateError);
        }
      }
    } catch (err) {
      console.error("Vote error:", err);
    }
  }

  const isChoosingLocationManually = !!file && !draftPosition;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white">
      <div className="absolute top-4 left-6 z-[2000]">
        <Link href="/" title="Home page">
          <Logo />
        </Link>
      </div>

      <div className="flex justify-start items-center h-screen w-screen pt-4">
        <div className="ml-6 mr-6 mt-[calc(6.25vh-1rem)] h-[calc(87.5vh-2rem)] w-[calc(100vw-3rem)] rounded-2xl overflow-hidden shadow-2xl relative">
          <Map
            draftPosition={draftPosition}
            reports={reports}
            isChoosingLocationManually={isChoosingLocationManually}
            onMapClick={setDraftPosition}
            onReportClick={setSelected}
          />

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

      {showNameForm && file && (
        <>
          <div className="fixed inset-0 z-[3000] bg-black/50" onClick={() => setShowNameForm(false)} />
          <div className="fixed inset-0 z-[3001] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Chi sei? 👤</h2>
              <p className="text-gray-600 mb-4">Inserisci il tuo nome per tracciare chi ha messo lo sticker</p>
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
                <button onClick={() => setShowNameForm(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition">
                  Annulla
                </button>
                <button
                  onClick={() => { if (username.trim()) { setShowNameForm(false); save(); } }}
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
        <div className="fixed inset-x-0 bottom-0 z-[3000] animate-in slide-in-from-bottom duration-300 rounded-t-3xl bg-white shadow-2xl">
          {isChoosingLocationManually ? (
            <div className="p-4">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-900">
                  Clicca sulla mappa per selezionare la posizione.
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setDate(null);
                  setDraftPosition(null);
                  setPreviewUrl(null);
                }}
                className="mt-3 w-full rounded-2xl bg-red-600 py-3 text-white font-semibold shadow-lg transition active:scale-95 hover:bg-red-700"
              >
                Annulla
              </button>
            </div>
          ) : (
            <div className="max-h-[90vh] overflow-y-auto p-6">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />
              <div className="mb-4 rounded-2xl overflow-hidden bg-gray-100">
                <img src={previewUrl || ""} alt="Preview" className="w-full h-auto max-h-[50vh] object-contain" />
              </div>
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
                    <p className="text-gray-700">{draftPosition.lat.toFixed(5)}, {draftPosition.lng.toFixed(5)}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={save}
                  disabled={!draftPosition || isSaving}
                  className="flex-1 rounded-2xl bg-green-600 py-4 text-white font-semibold shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                >
                  {isSaving ? "Salvataggio..." : "Salva"}
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setDate(null);
                    setDraftPosition(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 rounded-2xl bg-red-600 py-4 text-white font-semibold shadow-lg transition active:scale-95 hover:bg-red-700"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-[4000] rounded-t-3xl bg-white p-4 shadow-2xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
          <img src={getUrl(selected.image_path)} alt="Sticker" className="max-h-[40vh] w-full rounded-2xl object-cover" />
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Data:</strong> {getStickerDate(selected) ? new Date(getStickerDate(selected) as string).toLocaleString() : "Non disponibile"}</p>
            <p><strong>Coordinate:</strong> {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
          </div>
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              E ancora li?
            </p>
            <p className="text-xs text-gray-600 mb-4">
              Conferma se lo sticker e ancora visibile nel luogo o se e stato rimosso
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleVote(selected.id, "upvote")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur-md transition active:scale-95 ${
                  sessionVotes[selected.id] === "upvote"
                    ? "border-green-200/45 bg-green-600/58 text-white ring-2 ring-green-200/45"
                    : "border-green-300/42 bg-green-500/34 text-green-950 hover:bg-green-500/44"
                }`}
              >
                <span>Si, visto ({selected.upvotes || 0})</span>
              </button>
              <button
                onClick={() => handleVote(selected.id, "downvote")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur-md transition active:scale-95 ${
                  sessionVotes[selected.id] === "downvote"
                    ? "border-red-200/45 bg-red-600/58 text-white ring-2 ring-red-200/45"
                    : "border-red-300/42 bg-red-500/34 text-red-950 hover:bg-red-500/44"
                }`}
              >
                <span>No, rimosso ({selected.downvotes || 0})</span>
              </button>
            </div>
          </div>
          <button onClick={() => setSelected(null)} className="mt-3 w-full rounded-2xl bg-gray-100 py-3 text-sm text-gray-700">
            Chiudi
          </button>
        </div>
      )}

      <Link
        href="/stickers"
        className="fixed top-6 right-6 z-[3500] flex items-center justify-center rounded-full bg-white w-12 h-12 shadow-lg hover:bg-gray-50 transition active:scale-95"
        title="View all stickers"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Link>
    </main>
  );
}
