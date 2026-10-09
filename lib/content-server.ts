import { and, desc, eq, ilike, or } from "drizzle-orm";
import { articles as articleTable, categories as categoryTable, experts } from "../db/schema";
import { db } from "../db";
import { articles as fallbackArticles, categories as fallbackCategories, brand, type Article, type Category } from "./content";

export const databaseConfigured = Boolean(db);

export type ArticleRecord = Article & { id?: string; status?: string; seoTitle?: string | null; seoDescription?: string | null; canonicalUrl?: string | null; publishedAtIso?: string; updatedAtIso?: string; featured?: boolean };

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toCategory(row: { name: string; slug: string; description: string | null }): Category {
  return { name: row.name, slug: row.slug, description: row.description ?? "" };
}

function mapArticle(row: typeof articleTable.$inferSelect, category: Category): ArticleRecord {
  return { id: row.id, title: row.title, slug: row.slug, excerpt: row.excerpt, shortAnswer: row.shortAnswer ?? "", content: row.content, category, publishedAt: formatDate(row.publishedAt), updatedAt: formatDate(row.updatedAt), publishedAtIso: toIso(row.publishedAt), updatedAtIso: toIso(row.updatedAt), readingTime: row.readingTime ?? 5, visits: row.visits, ratingTotal: row.ratingTotal, ratingCount: row.ratingCount, featured: row.featured, status: row.status, seoTitle: row.seoTitle, seoDescription: row.seoDescription, canonicalUrl: row.canonicalUrl };
}

function uniqueBySlug(items: ArticleRecord[]) {
  return [...new Map(items.map(item => [item.slug, item])).values()];
}

export async function getCategories(): Promise<Category[]> {
  if (!db) return fallbackCategories;
  const rows = await db.select().from(categoryTable);
  return rows.map(toCategory);
}

export async function getPublishedArticles(): Promise<ArticleRecord[]> {
  if (!db) return fallbackArticles;
  const rows = await db.select({ article: articleTable, category: categoryTable }).from(articleTable).leftJoin(categoryTable, eq(articleTable.categoryId, categoryTable.id)).where(eq(articleTable.status, "published")).orderBy(desc(articleTable.publishedAt));
  return uniqueBySlug(rows.map(({ article, category }) => mapArticle(article, category ? toCategory(category) : { name: "عمومی", slug: "general", description: "" })));
}

export async function getArticleBySlug(slug: string, includeDraft = false): Promise<ArticleRecord | undefined> {
  if (!db) return fallbackArticles.find(article => article.slug === slug);
  const predicates = [eq(articleTable.slug, slug)];
  if (!includeDraft) predicates.push(eq(articleTable.status, "published"));
  const [row] = await db.select({ article: articleTable, category: categoryTable }).from(articleTable).leftJoin(categoryTable, eq(articleTable.categoryId, categoryTable.id)).where(and(...predicates)).limit(1);
  return row ? mapArticle(row.article, row.category ? toCategory(row.category) : { name: "عمومی", slug: "general", description: "" }) : undefined;
}

export async function searchPublishedArticles(query: string): Promise<ArticleRecord[]> {
  const normalized = query.trim();
  if (!db) return fallbackArticles.filter(article => `${article.title} ${article.excerpt} ${article.category.name} ${article.content}`.toLocaleLowerCase("fa").includes(normalized.toLocaleLowerCase("fa")));
  if (!normalized) return getPublishedArticles();
  const pattern = `%${normalized}%`;
  const rows = await db.select({ article: articleTable, category: categoryTable }).from(articleTable).leftJoin(categoryTable, eq(articleTable.categoryId, categoryTable.id)).where(and(eq(articleTable.status, "published"), or(ilike(articleTable.title, pattern), ilike(articleTable.excerpt, pattern), ilike(articleTable.content, pattern), ilike(categoryTable.name, pattern)))).orderBy(desc(articleTable.publishedAt));
  return uniqueBySlug(rows.map(({ article, category }) => mapArticle(article, category ? toCategory(category) : { name: "عمومی", slug: "general", description: "" })));
}

export async function getArticlesByCategory(slug: string): Promise<{ category?: Category; articles: ArticleRecord[] }> {
  if (!db) { const category = fallbackCategories.find(item => item.slug === slug); return { category, articles: fallbackArticles.filter(article => article.category.slug === slug) }; }
  try {
    const [categoryRow] = await db.select().from(categoryTable).where(eq(categoryTable.slug, slug)).limit(1);
    if (!categoryRow) return { articles: [] };
    const rows = await db.select({ article: articleTable, category: categoryTable }).from(articleTable).leftJoin(categoryTable, eq(articleTable.categoryId, categoryRow.id)).where(and(eq(articleTable.categoryId, categoryRow.id), eq(articleTable.status, "published"))).orderBy(desc(articleTable.publishedAt));
    return { category: toCategory(categoryRow), articles: uniqueBySlug(rows.map(({ article, category }) => mapArticle(article, category ? toCategory(category) : toCategory(categoryRow)))) };
  } catch (error) {
    console.error("Failed to load category", slug, error);
    const category = fallbackCategories.find(item => item.slug === slug);
    return { category, articles: fallbackArticles.filter(article => article.category.slug === slug) };
  }
}

export async function getAuthors() {
  if (!db) return [{ id: "fallback", fullName: brand.author, slug: brand.authorSlug }];
  return db.select({ id: experts.id, fullName: experts.fullName, slug: experts.slug }).from(experts);
}

export async function getAdminArticles(): Promise<ArticleRecord[]> {
  if (!db) return fallbackArticles.map(article => ({ ...article, status: "published" }));
  const rows = await db.select({ article: articleTable, category: categoryTable }).from(articleTable).leftJoin(categoryTable, eq(articleTable.categoryId, categoryTable.id)).orderBy(desc(articleTable.updatedAt));
  return uniqueBySlug(rows.map(({ article, category }) => mapArticle(article, category ? toCategory(category) : { name: "عمومی", slug: "general", description: "" })));
}
