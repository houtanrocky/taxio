ALTER TABLE "articles" ADD COLUMN "visits" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "visits" SET DEFAULT (150 + floor(random() * 51))::integer;
