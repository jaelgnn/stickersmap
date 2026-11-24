import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { stickerReports, type StickerReport } from "@/db/schema";
import type {
  CreateStickerReportPayload,
  StickerReportDto,
  UpdateStickerVotePayload,
} from "@/lib/sticker-report";

function resolveImageUrl(imagePath: string): string {
  return imagePath;
}

export function toStickerReportDto(row: StickerReport): StickerReportDto {
  const isRemoved = row.status === "removed";

  return {
    id: row.id,
    image_path: resolveImageUrl(row.imagePath),
    lat: row.lat,
    lng: row.lng,
    captured_at: row.capturedAt,
    uploaded_at: row.uploadedAt,
    uploaded_by: row.uploadedBy,
    upvotes: row.confirmationsCount,
    downvotes: isRemoved ? 1 : 0,
    last_status: isRemoved
      ? "removed"
      : row.confirmationsCount > 0
        ? "seen"
        : null,
    last_status_at: null,
  };
}

export async function listStickerReports(): Promise<StickerReportDto[]> {
  const rows = await db
    .select()
    .from(stickerReports)
    .orderBy(desc(stickerReports.uploadedAt));

  return rows.map(toStickerReportDto);
}

export async function createStickerReport(
  payload: CreateStickerReportPayload,
): Promise<StickerReportDto> {
  const [created] = await db
    .insert(stickerReports)
    .values({
      imagePath: payload.imagePath,
      lat: payload.lat,
      lng: payload.lng,
      capturedAt: payload.capturedAt,
      uploadedBy: payload.uploadedBy,
    })
    .returning();

  if (!created) {
    throw new Error("Sticker report creation returned no row.");
  }

  return toStickerReportDto(created);
}

export async function updateStickerVote(
  payload: UpdateStickerVotePayload,
): Promise<StickerReportDto | null> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(stickerReports)
      .where(eq(stickerReports.id, payload.stickerId))
      .limit(1);

    if (!current) {
      return null;
    }

    let confirmationsCount = current.confirmationsCount;

    if (payload.currentChoice === "upvote") {
      confirmationsCount = Math.max(0, confirmationsCount - 1);
    }

    if (payload.nextChoice === "upvote") {
      confirmationsCount += 1;
    }

    const [updated] = await tx
      .update(stickerReports)
      .set({
        confirmationsCount,
        status: payload.nextChoice === "downvote" ? "removed" : "active",
      })
      .where(eq(stickerReports.id, payload.stickerId))
      .returning();

    return updated ? toStickerReportDto(updated) : null;
  });
}

export async function findStickerReportById(
  stickerId: string,
): Promise<StickerReport | null> {
  const [row] = await db
    .select()
    .from(stickerReports)
    .where(eq(stickerReports.id, stickerId))
    .limit(1);

  return row ?? null;
}

export async function deleteStickerReportById(
  stickerId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(stickerReports)
    .where(eq(stickerReports.id, stickerId))
    .returning({ id: stickerReports.id });

  return deleted.length > 0;
}
