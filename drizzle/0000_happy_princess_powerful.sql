CREATE TABLE `admin_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `casts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`role` text NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`x_url` text DEFAULT '' NOT NULL,
	`favorite` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`is_pickup` integer DEFAULT false NOT NULL,
	`pickup_order` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_casts_category` ON `casts` (`category`);--> statement-breakpoint
CREATE INDEX `idx_casts_pickup_order` ON `casts` (`is_pickup`,`pickup_order`);--> statement-breakpoint
CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`thumbnail_url` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_news_published_date` ON `news` (`published`,`date`);