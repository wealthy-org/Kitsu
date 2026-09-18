CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
