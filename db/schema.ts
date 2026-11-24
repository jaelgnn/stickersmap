import { sql } from "drizzle-orm";
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const stickerReportStatuses = ["active", "removed"] as const;
export type StickerReportStatus = (typeof stickerReportStatuses)[number];

export const stickerReports = sqliteTable(
  "sticker_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    imagePath: text("image_path").notNull(),

    lat: real("lat").notNull(),
    lng: real("lng").notNull(),

    capturedAt: text("captured_at"),

    uploadedAt: text("uploaded_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),

    status: text("status", { enum: stickerReportStatuses })
      .notNull()
      .default("active"),

    confirmationsCount: integer("confirmations_count")
      .notNull()
      .default(0),

    manualLocation: integer("manual_location", { mode: "boolean" })
      .notNull()
      .default(false),

    note: text("note"),
    uploadedBy: text("uploaded_by"),
  },
  (table) => [
    check(
      "sticker_reports_status_check",
      sql`${table.status} IN ('active', 'removed')`,
    ),
  ],
);

export type StickerReport = typeof stickerReports.$inferSelect;
export type NewStickerReport = typeof stickerReports.$inferInsert;
