CREATE TABLE `wedding_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wedding_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`kind` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`guest_ids` text DEFAULT '[]' NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL,
	`accepted_by` text,
	`created_at` text NOT NULL,
	`last_submitted` text
);
--> statement-breakpoint
CREATE TABLE `wedding_members` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` text NOT NULL
);
