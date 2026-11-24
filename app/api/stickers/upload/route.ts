import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export async function POST(request: Request) {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Body richiesta non valido." }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("stickers/")) {
          throw new Error("Percorso upload non valido.");
        }

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info("Sticker image uploaded:", blob.pathname);
      },
    });

    return Response.json(response);
  } catch (error) {
    console.error("Blob upload token error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload non riuscito." },
      { status: 400 },
    );
  }
}
