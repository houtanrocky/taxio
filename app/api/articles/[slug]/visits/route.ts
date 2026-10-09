import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../../../db";
import { articles } from "../../../../../db/schema";
import { articles as fallbackArticles } from "../../../../../lib/content";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { slug } = await params;
  if (!db) {
    const article = fallbackArticles.find(item => item.slug === slug);
    return article
      ? Response.json({ visits: article.visits }, { headers: { "Cache-Control": "no-store" } })
      : Response.json({ error: "Article not found" }, { status: 404 });
  }

  // A single SQL update avoids losing visits from concurrent readers.
  const [article] = await db.update(articles)
    .set({ visits: sql`${articles.visits} + 1` })
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .returning();

  return article
    ? Response.json({ visits: article.visits }, { headers: { "Cache-Control": "no-store" } })
    : Response.json({ error: "Article not found" }, { status: 404 });
}
