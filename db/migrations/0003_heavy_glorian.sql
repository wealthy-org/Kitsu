CREATE TABLE "season_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_label" text NOT NULL,
	"wallet_address" text NOT NULL,
	"final_rank" integer NOT NULL,
	"reward_amount" numeric NOT NULL,
	"claimed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"pool" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "seasons_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE INDEX "season_rewards_label_rank_idx" ON "season_rewards" USING btree ("season_label","final_rank");