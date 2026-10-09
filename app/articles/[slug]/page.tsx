// app/articles/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles as fallbackArticles, brand } from "../../../lib/content";
import { databaseConfigured, getArticleBySlug, getPublishedArticles } from "../../../lib/content-server";
import { ArticleCard } from "../../../components/ArticleCard";

/**
 * Parses inline markdown into React nodes.
 * Supports: ***bold+italic***, **bold**, *italic*, [text](url)
 * Handles nesting correctly by processing the longest markers first and recursing.
 */
function renderInline(text: string): React.ReactNode[] {
  // Tokenize: match ***...*** first, then **...**, then *...*, then [...]()
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns: { re: RegExp; render: (m: string) => React.ReactNode }[] = [
    {
      re: /^\*\*\*(.+?)\*\*\*/s,
      render: m => (
        <strong key={key++}>
          <em>{renderInline(m)}</em>
        </strong>
      ),
    },
    {
      re: /^\*\*(.+?)\*\*/s,
      render: m => <strong key={key++}>{renderInline(m)}</strong>,
    },
    {
      re: /^\*(.+?)\*/s,
      render: m => <em key={key++}>{renderInline(m)}</em>,
    },
    {
      re: /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/,
      render: () => null, // handled separately below because it needs the match groups
    },
  ];

  while (remaining.length > 0) {
    // Try inline link first (needs capture groups)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a href={linkMatch[2]} key={key++} target="_blank" rel="noreferrer">
          {renderInline(linkMatch[1])}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Try formatting markers
    let matched = false;
    for (const { re, render } of patterns) {
      if (!render) continue;
      const m = remaining.match(re);
      if (m && m[1] !== undefined) {
        tokens.push(render(m[1]));
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // No marker at position 0: consume text up to the next marker or end
    const nextMarker = remaining.slice(1).search(/(\*\*\*|\*\*|\*|\[)/);
    if (nextMarker === -1) {
      tokens.push(remaining);
      break;
    }
    tokens.push(remaining.slice(0, nextMarker + 1));
    remaining = remaining.slice(nextMarker + 1);
  }

  return tokens;
}

function normalizeArticleMarkdown(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\s+(?=#{2,3}\s)/g, "\n\n")
    .replace(/\s+(?=>\s)/g, "\n\n")
    .replace(/\s+(?=-\s)/g, "\n\n")
    .split("\n")
    .map(line => line.replace(/^(##\s+)+/, "## ").replace(/^(###\s+)+/, "### "))
    .join("\n");
}

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return article
    ? {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      alternates: { canonical: article.canonicalUrl || `/articles/${article.slug}` },
      openGraph: {
        type: "article",
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        modifiedTime: article.updatedAt,
      },
    }
    : { title: "مقاله پیدا نشد" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const blocks = normalizeArticleMarkdown(article.content).split("\n\n");
  const headings = blocks
    .filter(block => block.startsWith("## ") || block.startsWith("### "))
    .map(block => block.replace(/^#{2,3} /, ""));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: { "@type": "Organization", name: brand.author },
    publisher: { "@type": "Organization", name: "آروان | Arevan" },
    ...(article.updatedAtIso ? { dateModified: article.updatedAtIso } : {}),
    ...(article.publishedAtIso ? { datePublished: article.publishedAtIso } : {}),
  };

  const related = (await getPublishedArticles()).filter(item => item.slug !== article.slug).slice(0, 2);
  const relatedArticles = related.length || databaseConfigured ? related : fallbackArticles.filter(item => item.slug !== article.slug).slice(0, 2);

  return (
    <main>
      <div className="container article-layout">
        <article className="article-main">
          <nav className="breadcrumbs" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link>
            <span>←</span>
            <Link href="/articles">مقالات</Link>
            <span>←</span>
            <Link href={`/category/${article.category.slug}`}>{article.category.name}</Link>
          </nav>
          <div className="eyebrow">{article.category.name}</div>
          <h1>{article.title}</h1>
          <p className="article-summary">{article.excerpt}</p>
          <div className="article-meta">
            <span>تهیه و تدوین: {brand.author}</span>
            <span>انتشار: {article.publishedAt}</span>
            <span>به‌روزرسانی: {article.updatedAt}</span>
            <span>{article.readingTime} دقیقه مطالعه</span>
          </div>
          <div className="answer">
            <strong>خلاصه:</strong> {article.shortAnswer}
          </div>
          {headings.length > 2 && (
            <nav className="mobile-toc" aria-label="فهرست مطالب">
              <strong>در این مقاله</strong>
              {headings.map((heading, index) => (
                <a href={`#section-${index}`} key={heading}>
                  {heading}
                </a>
              ))}
            </nav>
          )}
          <div className="prose">
            {blocks.map((block, index) => {
              if (block.startsWith("## ") || block.startsWith("### ")) {
                const heading = block.replace(/^#{2,3} /, "");
                const headingIndex = headings.indexOf(heading);
                return block.startsWith("## ") ? (
                  <h2 id={`section-${headingIndex}`} key={index}>
                    {renderInline(heading)}
                  </h2>
                ) : (
                  <h3 id={`section-${headingIndex}`} key={index}>
                    {renderInline(heading)}
                  </h3>
                );
              }
              if (block.startsWith("> ")) return <blockquote key={index}>{renderInline(block.slice(2))}</blockquote>;
              if (block.startsWith("- "))
                return (
                  <ul key={index}>
                    {block.split("\n").map((line, i) => (
                      <li key={i}>{renderInline(line.replace(/^- /, ""))}</li>
                    ))}
                  </ul>
                );
              if (/^\d+\.\s/.test(block))
                return (
                  <ol key={index}>
                    {block.split("\n").map((line, i) => (
                      <li key={i}>{renderInline(line.replace(/^\d+\.\s/, ""))}</li>
                    ))}
                  </ol>
                );
              return <p key={index}>{renderInline(block)}</p>;
            })}
          </div>
          <div className="author-box">
            <span className="eyebrow">ناشر محتوا</span>
            <h3>{brand.author}</h3>
            <p>{brand.authorBio}</p>
          </div>
        </article>
        <aside className="toc">
          <h3>در این مقاله</h3>
          {headings.map((heading, index) => (
            <a href={`#section-${index}`} key={heading}>
              {heading}
            </a>
          ))}
        </aside>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      </div>
      <section className="section latest-band">
        <div className="container">
          <h2>مطالب مرتبط</h2>
          <div className="article-grid">
            {relatedArticles.map(item => (
              <ArticleCard article={item} key={item.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
