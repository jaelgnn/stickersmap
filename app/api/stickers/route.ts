import { del } from "@vercel/blob";

import {
  createStickerReport,
  listStickerReports,
  updateStickerVote,
} from "@/db/queries/sticker-reports";
import type {
  CreateStickerReportPayload,
  UpdateStickerVotePayload,
  VoteChoice,
} from "@/lib/sticker-report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function isVoteChoice(value: unknown): value is VoteChoice {
  return value === null || value === "upvote" || value === "downvote";
}

export async function GET() {
  try {
    const reports = await listStickerReports();
    return Response.json(reports, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Sticker list error:", error);
    return jsonError("Impossibile caricare gli sticker.", 500);
  }
}

export async function POST(request: Request) {
  let payload: Partial<CreateStickerReportPayload>;

  try {
    payload = (await request.json()) as Partial<CreateStickerReportPayload>;
  } catch {
    return jsonError("Body richiesta non valido.", 400);
  }

  const imagePath = payload.imagePath?.trim();
  const capturedAt = payload.capturedAt?.trim();
  const uploadedBy = payload.uploadedBy?.trim();

  if (
    !imagePath ||
    !isBlobUrl(imagePath) ||
    !isFiniteCoordinate(payload.lat) ||
    !isFiniteCoordinate(payload.lng) ||
    payload.lat < -90 ||
    payload.lat > 90 ||
    payload.lng < -180 ||
    payload.lng > 180 ||
    !capturedAt ||
    Number.isNaN(Date.parse(capturedAt)) ||
    !uploadedBy
  ) {
    return jsonError("Dati sticker non validi.", 400);
  }

  try {
    const report = await createStickerReport({
      imagePath,
      lat: payload.lat,
      lng: payload.lng,
      capturedAt,
      uploadedBy,
    });

    return Response.json(report, { status: 201 });
  } catch (error) {
    console.error("Sticker creation error:", error);

    try {
      await del(imagePath);
    } catch (cleanupError) {
      console.error("Blob cleanup error:", cleanupError);
    }

    return jsonError("Impossibile salvare lo sticker.", 500);
  }
}

export async function PATCH(request: Request) {
  let payload: Partial<UpdateStickerVotePayload>;

  try {
    payload = (await request.json()) as Partial<UpdateStickerVotePayload>;
  } catch {
    return jsonError("Body richiesta non valido.", 400);
  }

  const stickerId = payload.stickerId?.trim();

  if (
    !stickerId ||
    !isVoteChoice(payload.currentChoice) ||
    !isVoteChoice(payload.nextChoice)
  ) {
    return jsonError("Dati aggiornamento non validi.", 400);
  }

  try {
    const updated = await updateStickerVote({
      stickerId,
      currentChoice: payload.currentChoice,
      nextChoice: payload.nextChoice,
    });

    if (!updated) {
      return jsonError("Sticker non trovato.", 404);
    }

    return Response.json(updated);
  } catch (error) {
    console.error("Sticker vote update error:", error);
    return jsonError("Impossibile aggiornare lo sticker.", 500);
  }
}
