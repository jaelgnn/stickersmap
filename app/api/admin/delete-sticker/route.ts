import { del } from "@vercel/blob";

import {
  deleteStickerReportById,
  findStickerReportById,
} from "@/db/queries/sticker-reports";

type DeleteStickerPayload = {
  stickerId?: string;
  password?: string;
};

function jsonResponse(body: Record<string, string>, status: number) {
  return Response.json(body, { status });
}

function isVercelBlobUrl(value: string): boolean {
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

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_DELETE_PASSWORD;

  if (!adminPassword) {
    return jsonResponse(
      { error: "Configurazione password admin mancante." },
      500,
    );
  }

  let payload: DeleteStickerPayload;
  try {
    payload = (await request.json()) as DeleteStickerPayload;
  } catch {
    return jsonResponse({ error: "Body richiesta non valido." }, 400);
  }

  const stickerId = payload.stickerId?.trim();
  const password = payload.password;

  if (!stickerId || !password) {
    return jsonResponse({ error: "Dati mancanti per eliminazione." }, 400);
  }

  if (password !== adminPassword) {
    return jsonResponse({ error: "Password admin non valida." }, 401);
  }

  try {
    const sticker = await findStickerReportById(stickerId);

    if (!sticker) {
      return jsonResponse({ error: "Sticker non trovato o gia eliminato." }, 404);
    }

    const deleted = await deleteStickerReportById(stickerId);

    if (!deleted) {
      return jsonResponse({ error: "Sticker non trovato o gia eliminato." }, 404);
    }

    if (isVercelBlobUrl(sticker.imagePath)) {
      try {
        await del(sticker.imagePath);
      } catch (storageError) {
        console.error("Blob delete error:", storageError);
        return Response.json(
          {
            error: "Sticker eliminato dal database, ma errore su storage.",
            storageError:
              storageError instanceof Error
                ? storageError.message
                : "Errore storage sconosciuto.",
          },
          { status: 200 },
        );
      }
    }

    return Response.json({ ok: "Sticker eliminato con successo." });
  } catch (error) {
    console.error("Sticker delete error:", error);
    return jsonResponse({ error: "Errore durante eliminazione." }, 500);
  }
}
