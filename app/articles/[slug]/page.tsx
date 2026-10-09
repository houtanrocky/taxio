// app/articles/[slug]/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles as fallbackArticles, brand } from "../../../lib/content";
import { databaseConfigured, getArticleBySlug, getPublishedArticles } from "../../../lib/content-server";
import { ArticleCard } from "../../../components/ArticleCard";

/**
 * Parses inline markdown into React nodes.
 * Supports: ***bold+italic***, **bold**, *italic*, [text](url)
 * Uses [^] instead of the `s` (dotAll) flag for ES2017 compatibility.
 */
function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const inlineLink = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/;
  const boldItalic = /^\*\*\*([^]+?)\*\*\*/;
  const bold = /^\*\*([^]+?)\*\*/;
  const italic = /^\*([^*]+?)\*/;
  const nextMarker = /[*[]/;

  while (remaining.length > 0) {
    const link = inlineLink.exec(remaining);
    if (link) {
      tokens.push(
        <a href={link[2]} key={key++} target="_blank" rel="noreferrer">
          {renderInline(link[1])}
        </a>
      );
      remaining = remaining.slice(link[0].length);
      continue;
    }

    const tri = boldItalic.exec(remaining);
    if (tri) {
      tokens.push(
        <strong key={key++}>
          <em>{renderInline(tri[1])}</em>
        </strong>
      );
      remaining = remaining.slice(tri[0].length);
      continue;
    }

    const bi = bold.exec(remaining);
    if (bi) {
      tokens.push(<strong key={key++}>{renderInline(bi[1])}</strong>);
      remaining = remaining.slice(bi[0].length);
      continue;
    }

    const it = italic.exec(remaining);
    if (it) {
      tokens.push(<em key={key++}>{renderInline(it[1])}</em>);
      remaining = remaining.slice(it[0].length);
      continue;
    }

    const rest = remaining.slice(1);
    const idx = rest.search(nextMarker);
    if (idx === -1) {
      tokens.push(remaining);
      break;
    }
    tokens.push(remaining.slice(0, idx + 1));
    remaining = remaining.slice(idx + 1);
  }

  return tokens;
}

function normalizeArticleMarkdown(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+(#{2,4}\s)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(>\s)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(-\s)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(---+)/g, "$1\n\n$2")
    .split("\n")
    .map(line =>
      line
        .replace(/^(##\s+)+/, "## ")
        .replace(/^(###\s+)+/, "### ")
        .replace(/^(####\s+)+/, "#### ")
    )
    .join("\n");
}

/**
 * Renders a markdown block as a bullet or ordered list.
 * Returns null when the block is not a list so callers can fall through.
 * Not a React component — called as a function so it doesn't require a key.
 */
function renderListBlock(block: string, keyPrefix: string): React.ReactNode {
  const lines = block.split("\n").filter(Boolean);
  if (lines.every(line => /^-\s/.test(line))) {
    return (
      <ul key={`${keyPrefix}-ul`}>
        {lines.map((line, i) => {
          const text = line.replace(/^-\s/, "");
          return <li key={`${keyPrefix}-ul-${i}-${text.slice(0, 20)}`}>{renderInline(text)}</li>;
        })}
      </ul>
    );
  }
  if (lines.every(line => /^\d+\.\s/.test(line))) {
    return (
      <ol key={`${keyPrefix}-ol`}>
        {lines.map((line, i) => {
          const text = line.replace(/^\d+\.\s/, "");
          return <li key={`${keyPrefix}-ol-${i}-${text.slice(0, 20)}`}>{renderInline(text)}</li>;
        })}
      </ol>
    );
  }
  return null;
}

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "مقاله پیدا نشد" };
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: article.canonicalUrl || `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      modifiedTime: article.updatedAt,
    },
  };
}

export default async function ArticlePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const blocks = normalizeArticleMarkdown(article.content).split("\n\n");
  const headings = blocks
    .filter(block => /^#{2,4} /.test(block))
    .map(block => block.replace(/^#{2,4} /, ""));

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
  const relatedArticles =
    related.length || databaseConfigured
      ? related
      : fallbackArticles.filter(item => item.slug !== article.slug).slice(0, 2);

  return (
    <main>
      <div className="container article-layout">
        <article className="article-main">
          <nav className="breadcrumbs" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link>
            <span>/</span>
            <Link href="/articles">مقالات</Link>
            <span>/</span>
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
              {headings.map((heading, i) => (
                <a href={`#section-${i}`} key={`mobile-toc-${i}-${heading}`}>
                  {heading}
                </a>
              ))}
            </nav>
          )}
          <div className="prose">
            {blocks.map((block, index) => {
              const keyPrefix = `block-${index}`;

              if (block === "---") {
                return <hr key={`hr-${index}`} />;
              }

              if (/^#{2,4} /.test(block)) {
                const heading = block.replace(/^#{2,4} /, "");
                const headingIndex = headings.indexOf(heading);
                const headingKey = `heading-${headingIndex}-${heading.slice(0, 24)}`;
                if (block.startsWith("#### ")) {
                  return (
                    <h4 id={`section-${headingIndex}`} key={headingKey}>
                      {renderInline(heading)}
                    </h4>
                  );
                }
                return block.startsWith("## ") ? (
                  <h2 id={`section-${headingIndex}`} key={headingKey}>
                    {renderInline(heading)}
                  </h2>
                ) : (
                  <h3 id={`section-${headingIndex}`} key={headingKey}>
                    {renderInline(heading)}
                  </h3>
                );
              }
              if (block.startsWith("> ")) {
                const quote = block.slice(2);
                return <blockquote key={`quote-${index}-${quote.slice(0, 20)}`}>{renderInline(quote)}</blockquote>;
              }
              if (block.startsWith("- ") || /^\d+\.\s/.test(block)) {
                const list = renderListBlock(block, keyPrefix);
                if (list) return list;
              }
              return <p key={`p-${index}-${block.slice(0, 20)}`}>{renderInline(block)}</p>;
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
          {headings.map((heading, i) => (
            <a href={`#section-${i}`} key={`toc-${i}-${heading}`}>
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
