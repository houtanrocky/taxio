"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { articles, categories, experts } from "../../db/schema";
import { db } from "../../db";

const articleInput = z.object({
  title: z.string().trim().min(5, "عنوان مقاله کوتاه است."),
  slug: z.string().trim().regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "Slug باید از واژه‌ها و خط تیره تشکیل شود."),
  categoryId: z.string().trim().min(1, "دسته‌بندی را انتخاب کنید."),
  excerpt: z.string().trim().min(20, "خلاصه مقاله کوتاه است."),
  shortAnswer: z.string().trim().optional(),
  content: z.string().trim().min(50, "محتوای مقاله کوتاه است."),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  status: z.enum(["draft", "published"]),
  readingTime: z.coerce.number().int().min(1).max(180).default(5),
});

function readArticleForm(formData: FormData) {
  const field = (name: string) => {
    const direct = formData.get(name);
    if (direct !== null) return direct;
    const prefixed = [...formData.keys()].find(key => key.endsWith(`_${name}`));
    return prefixed ? formData.get(prefixed) : null;
  };
  return articleInput.parse({ title: field("title"), slug: field("slug"), categoryId: field("categoryId"), excerpt: field("excerpt"), shortAnswer: field("shortAnswer") || undefined, content: field("content"), seoTitle: field("seoTitle") || undefined, seoDescription: field("seoDescription") || undefined, status: field("status") || "draft", readingTime: field("readingTime") || 5 });
}

async function resolveCategoryId(value: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const [category] = await db!.select({ id: categories.id }).from(categories).where(isUuid ? eq(categories.id, value) : eq(categories.slug, value)).limit(1);
  if (!category) throw new Error("Category not found.");
  return category.id;
}

function revalidateContent(slug?: string) {
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/search");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
  if (slug) revalidatePath(`/articles/${slug}`);
  revalidatePath("/category/[slug]", "page");
}

function isDuplicateSlug(error: unknown) {
  const candidate = error as { code?: string; constraint?: string; message?: string };
  const text = candidate?.message ?? String(error);
  return candidate?.code === "23505" || candidate?.constraint === "articles_slug_key" || text.includes("articles_slug_key");
}

export type ArticleActionState = { error?: "slug" | "save" };

export async function createArticle(_state: ArticleActionState, formData: FormData): Promise<ArticleActionState> {
  if (!db) throw new Error("DATABASE_URL is required to publish articles.");
  const input = readArticleForm(formData);
  const [author] = await db.select({ id: experts.id }).from(experts).where(eq(experts.slug, "arevan-editorial")).limit(1);
  if (!author) throw new Error("Seed the Arevan editorial author before publishing.");
  const now = new Date();
  try {
    await db.insert(articles).values({ title: input.title, slug: input.slug, categoryId: await resolveCategoryId(input.categoryId), authorId: author.id, excerpt: input.excerpt, shortAnswer: input.shortAnswer ?? null, content: input.content, seoTitle: input.seoTitle || input.title, seoDescription: input.seoDescription || input.excerpt, status: input.status, readingTime: input.readingTime, publishedAt: input.status === "published" ? now : null, updatedAt: now });
  } catch (error) {
    if (isDuplicateSlug(error)) return { error: "slug" };
    throw error;
  }
  revalidateContent(input.slug);
  redirect(`/admin/articles/${encodeURIComponent(input.slug)}`);
}

export async function updateArticle(slug: string, _state: ArticleActionState, formData: FormData): Promise<ArticleActionState> {
  if (!db) throw new Error("DATABASE_URL is required to update articles.");
  const input = readArticleForm(formData);
  const now = new Date();
  const existing = await db.select({ id: articles.id, publishedAt: articles.publishedAt }).from(articles).where(eq(articles.slug, slug)).limit(1);
  if (!existing[0]) throw new Error("Article not found.");
  try {
    await db.update(articles).set({ title: input.title, slug: input.slug, categoryId: await resolveCategoryId(input.categoryId), excerpt: input.excerpt, shortAnswer: input.shortAnswer ?? null, content: input.content, seoTitle: input.seoTitle || input.title, seoDescription: input.seoDescription || input.excerpt, status: input.status, readingTime: input.readingTime, publishedAt: input.status === "published" ? existing[0].publishedAt ?? now : null, updatedAt: now }).where(eq(articles.id, existing[0].id));
  } catch (error) {
    if (isDuplicateSlug(error)) return { error: "slug" };
    throw error;
  }
  revalidateContent(slug);
  if (input.slug !== slug) revalidateContent(input.slug);
  redirect(`/admin/articles/${encodeURIComponent(input.slug)}`);
}

export async function publishArticle(id: string) {
  if (!db) throw new Error("DATABASE_URL is required to publish articles.");
  await db.update(articles).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(and(eq(articles.id, id), eq(articles.status, "draft")));
  revalidateContent();
}
