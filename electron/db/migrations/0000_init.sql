CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`colour` text DEFAULT '#737373' NOT NULL,
	`icon` text DEFAULT 'Home' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_category_id` text,
	`colour` text DEFAULT '#737373' NOT NULL,
	`icon` text DEFAULT 'Tag' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_category_id`);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalised_name` text NOT NULL,
	`domain` text,
	`default_entity_id` text,
	`default_category_id` text,
	`icon` text,
	`colour` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `suppliers_normalised_idx` ON `suppliers` (`normalised_name`);
--> statement-breakpoint
CREATE INDEX `suppliers_domain_idx` ON `suppliers` (`domain`);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_id` text,
	`entity_id` text NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`amount_cents` integer NOT NULL,
	`amount_enc` text,
	`currency` text DEFAULT 'AUD' NOT NULL,
	`due_date` text,
	`issue_date` text,
	`received_date` text,
	`scheduled_payment_date` text,
	`paid_date` text,
	`payment_type` text DEFAULT 'unknown' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`confidence_score` real DEFAULT 1 NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`source_email_id` text,
	`source_attachment_id` text,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurrence_pattern` text,
	`bpay_biller_code` text,
	`bpay_reference` text,
	`gst_amount_cents` integer,
	`notes_enc` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE INDEX `bills_due_idx` ON `bills` (`due_date`);
--> statement-breakpoint
CREATE INDEX `bills_status_due_idx` ON `bills` (`payment_status`,`due_date`);
--> statement-breakpoint
CREATE INDEX `bills_entity_idx` ON `bills` (`entity_id`);
--> statement-breakpoint
CREATE INDEX `bills_category_idx` ON `bills` (`category_id`);
--> statement-breakpoint
CREATE INDEX `bills_supplier_idx` ON `bills` (`supplier_id`);
--> statement-breakpoint
CREATE TABLE `email_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`gmail_message_id` text NOT NULL,
	`gmail_thread_id` text,
	`subject_enc` text,
	`from_email` text,
	`from_name` text,
	`received_at` text NOT NULL,
	`snippet_enc` text,
	`classification` text NOT NULL,
	`confidence_score` real DEFAULT 0 NOT NULL,
	`has_attachment` integer DEFAULT false NOT NULL,
	`source_url` text,
	`processed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_sources_gmail_message_id_unique` ON `email_sources` (`gmail_message_id`);
--> statement-breakpoint
CREATE INDEX `email_sources_processed_idx` ON `email_sources` (`processed_at`);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`email_source_id` text NOT NULL,
	`gmail_attachment_id` text,
	`filename` text NOT NULL,
	`mime_type` text,
	`extracted_text_enc` text,
	`local_path` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_date` text NOT NULL,
	`amount_cents` integer,
	`notes` text,
	`source_email_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `payment_events_bill_date_idx` ON `payment_events` (`bill_id`,`event_date`);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`condition_type` text NOT NULL,
	`condition_value` text NOT NULL,
	`action_type` text NOT NULL,
	`action_value` text NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`severity` text NOT NULL,
	`related_bill_id` text,
	`related_supplier_id` text,
	`related_category_id` text,
	`related_entity_id` text,
	`generated_at` text NOT NULL,
	`dismissed_at` text
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_cursor` (
	`source` text PRIMARY KEY NOT NULL,
	`cursor_value` text,
	`last_run_at` text,
	`last_success_at` text,
	`last_error` text
);
