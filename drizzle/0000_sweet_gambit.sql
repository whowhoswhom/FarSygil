CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`strava_id` integer,
	`name` text,
	`sport_type` text,
	`start_date` text,
	`start_date_local` text,
	`timezone` text,
	`distance_meters` real,
	`moving_time_seconds` integer,
	`elapsed_time_seconds` integer,
	`total_elevation_gain` real,
	`average_speed` real,
	`max_speed` real,
	`average_heartrate` real,
	`max_heartrate` real,
	`average_cadence` real,
	`average_watts` real,
	`suffer_score` integer,
	`perceived_exertion` real,
	`start_latitude` real,
	`start_longitude` real,
	`map_polyline` text,
	`gear_id` text,
	`source` text DEFAULT 'strava' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_strava_id_unique` ON `activities` (`strava_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `activities_strava_id_idx` ON `activities` (`strava_id`);--> statement-breakpoint
CREATE TABLE `activity_raw_json` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`strava_id` integer NOT NULL,
	`payload_type` text NOT NULL,
	`raw_json` text NOT NULL,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_raw_json_strava_payload_idx` ON `activity_raw_json` (`strava_id`,`payload_type`);--> statement-breakpoint
CREATE TABLE `activity_splits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` integer NOT NULL,
	`split_index` integer NOT NULL,
	`distance_meters` real,
	`elapsed_time_seconds` integer,
	`moving_time_seconds` integer,
	`elevation_difference` real,
	`average_speed` real,
	`average_heartrate` real,
	`average_grade_adjusted_speed` real,
	`pace_zone` integer,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_splits_activity_split_idx` ON `activity_splits` (`activity_id`,`split_index`);--> statement-breakpoint
CREATE TABLE `activity_streams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` integer NOT NULL,
	`stream_type` text NOT NULL,
	`data` text NOT NULL,
	`series_type` text,
	`original_size` integer,
	`resolution` text,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_streams_activity_stream_type_idx` ON `activity_streams` (`activity_id`,`stream_type`);--> statement-breakpoint
CREATE TABLE `daily_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`total_distance_meters` real DEFAULT 0,
	`total_moving_time_seconds` integer DEFAULT 0,
	`total_elevation_gain` real DEFAULT 0,
	`activity_count` integer DEFAULT 0,
	`average_heartrate` real,
	`resting_heartrate` real,
	`hrv` real,
	`sleep_hours` real,
	`steps` integer,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_summaries_date_unique` ON `daily_summaries` (`date`);--> statement-breakpoint
CREATE TABLE `data_import_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`event_type` text NOT NULL,
	`message` text,
	`activities_added` integer DEFAULT 0,
	`activities_updated` integer DEFAULT 0,
	`errors_count` integer DEFAULT 0,
	`started_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `health_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`metric_type` text NOT NULL,
	`value` real,
	`unit` text,
	`source` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `health_metrics_date_metric_idx` ON `health_metrics` (`date`,`metric_type`);--> statement-breakpoint
CREATE TABLE `health_raw_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`imported_at` text DEFAULT (datetime('now')) NOT NULL,
	`record_count` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `manual_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`activity_id` integer,
	`note` text NOT NULL,
	`tags` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `strava_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`athlete_id` integer NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`scope` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `strava_tokens_athlete_id_unique` ON `strava_tokens` (`athlete_id`);--> statement-breakpoint
CREATE TABLE `training_load` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`acute_load` real,
	`chronic_load` real,
	`training_stress_balance` real,
	`daily_training_stress` real,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `training_load_date_unique` ON `training_load` (`date`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_key_unique` ON `user_settings` (`key`);