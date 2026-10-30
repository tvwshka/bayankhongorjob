CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"district" text NOT NULL,
	"salary" text DEFAULT '' NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"phone" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
