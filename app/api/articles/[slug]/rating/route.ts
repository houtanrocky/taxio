import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../../../db";
import { articles } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const body = await request.json().catch(() => null) as { rating?: unknown } | null;
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "Rating must be 1-5" }, { status: 400 });
  if (!db) return Response.json({ average: rating, count: 1 });
  const { slug } = await params;
  const [row] = await db.update(articles).set({ ratingTotal: sql`${articles.ratingTotal} + ${rating}`, ratingCount: sql`${articles.ratingCount} + 1` }).where(and(eq(articles.slug, slug), eq(articles.status, "published"))).returning();
  return row ? Response.json({ average: row.ratingTotal / row.ratingCount, count: row.ratingCount }) : Response.json({ error: "Article not found" }, { status: 404 });
}
