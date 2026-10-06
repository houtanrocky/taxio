CREATE TABLE IF NOT EXISTS "experts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "full_name" text NOT NULL,
  "professional_title" text NOT NULL,
  "short_bio" text NOT NULL,
  "biography" text NOT NULL,
  "image_url" text,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text
);
CREATE TABLE IF NOT EXISTS "articles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "excerpt" text NOT NULL,
  "short_answer" text,
  "content" text NOT NULL,
  "category_id" uuid REFERENCES "categories"("id"),
  "author_id" uuid REFERENCES "experts"("id"),
  "status" text NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "reading_time" integer,
  "seo_title" text,
  "seo_description" text,
  "canonical_url" text,
  "featured_image" text,
  "featured" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "contact_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "contact" text NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
