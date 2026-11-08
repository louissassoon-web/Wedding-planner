CREATE TABLE `wedding_guest_sites` (
	`plan_id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wedding_guest_sites_public_id_unique` ON `wedding_guest_sites` (`public_id`);--> statement-breakpoint
ALTER TABLE `wedding_invites` ADD `code_hash` text DEFAULT '' NOT NULL;