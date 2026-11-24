CREATE TABLE `sticker_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`image_path` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`captured_at` text,
	`uploaded_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`confirmations_count` integer DEFAULT 0 NOT NULL,
	`manual_location` integer DEFAULT false NOT NULL,
	`note` text,
	`uploaded_by` text,
	CONSTRAINT "sticker_reports_status_check" CHECK("sticker_reports"."status" IN ('active', 'removed'))
);
