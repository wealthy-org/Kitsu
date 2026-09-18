CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"actor_wallet" text,
	"detail" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_date" date NOT NULL,
	"seed" text NOT NULL,
	"segments" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"onchain_tx_hash" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_courses_course_date_unique" UNIQUE("course_date"),
	CONSTRAINT "daily_courses_status_check" CHECK ("daily_courses"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE TABLE "leaderboard_daily" (
	"course_date" date NOT NULL,
	"wallet_address" text NOT NULL,
	"best_score" numeric NOT NULL,
	"best_time_ms" integer NOT NULL,
	"rank" integer,
	CONSTRAINT "leaderboard_daily_course_date_wallet_address_pk" PRIMARY KEY("course_date","wallet_address")
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"course_date" date NOT NULL,
	"input_log" jsonb NOT NULL,
	"claimed_score" numeric NOT NULL,
	"claimed_time_ms" integer NOT NULL,
	"verified_score" numeric,
	"verified_time_ms" integer,
	"status" text DEFAULT 'submitted',
	"onchain_tx_hash" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "runs_status_check" CHECK ("runs"."status" in ('submitted', 'verified', 'rejected', 'relayed'))
);
--> statement-breakpoint
CREATE INDEX "audit_logs_event_created_idx" ON "audit_logs" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "leaderboard_daily_course_time_idx" ON "leaderboard_daily" USING btree ("course_date","best_time_ms");--> statement-breakpoint
CREATE INDEX "runs_wallet_course_created_idx" ON "runs" USING btree ("wallet_address","course_date","created_at");--> statement-breakpoint
CREATE INDEX "runs_status_created_idx" ON "runs" USING btree ("status","created_at");