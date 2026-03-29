import { createClient } from "@supabase/supabase-js";

type DeleteStickerPayload = {
  stickerId?: string;
  imagePath?: string;
  password?: string;
};

function jsonResponse(body: Record<string, string>, status: number) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_DELETE_PASSWORD || "Apedalate";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "Configurazione Supabase server mancante." },
      500
    );
  }

  let payload: DeleteStickerPayload;
  try {
    payload = (await request.json()) as DeleteStickerPayload;
  } catch {
    return jsonResponse({ error: "Body richiesta non valido." }, 400);
  }

  const stickerId = payload.stickerId?.trim();
  const imagePath = payload.imagePath?.trim();
  const password = payload.password;

  if (!stickerId || !imagePath || !password) {
    return jsonResponse({ error: "Dati mancanti per eliminazione." }, 400);
  }

  if (password !== adminPassword) {
    return jsonResponse({ error: "Password admin non valida." }, 401);
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: deletedRows, error: dbError } = await adminSupabase
    .from("sticker_reports")
    .delete()
    .eq("id", stickerId)
    .select("id");

  if (dbError) {
    return jsonResponse(
      { error: `Errore database durante eliminazione: ${dbError.message}` },
      500
    );
  }

  if (!deletedRows || deletedRows.length === 0) {
    return jsonResponse({ error: "Sticker non trovato o gia eliminato." }, 404);
  }

  const { error: storageError } = await adminSupabase.storage
    .from("stickers")
    .remove([imagePath]);

  if (storageError) {
    return jsonResponse(
      {
        error: "Sticker eliminato dal database, ma errore su storage.",
        storageError: storageError.message,
      },
      200
    );
  }

  return Response.json({ ok: "Sticker eliminato con successo." });
}
