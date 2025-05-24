CREATE TABLE "hues" (
	"id" serial PRIMARY KEY NOT NULL,
	"hue_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"up" boolean DEFAULT false,
	"brightness" integer DEFAULT 0,
	"color_mode" text DEFAULT 'xy',
	"model" text,
	CONSTRAINT "hues_hue_id_unique" UNIQUE("hue_id")
);
--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "huuo" integer DEFAULT 5;