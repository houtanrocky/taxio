import Link from "next/link";
import type { Article } from "../lib/content";
export function ArticleCard({ article }: { article: Article }) { return <article className="article-card"><div className="eyebrow">{article.category.name} <span>·</span> {article.readingTime} دقیقه مطالعه</div><h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><div className="card-meta"><span>{article.updatedAt} · {article.visits.toLocaleString("fa-IR")} بازدید</span><Link href={`/articles/${article.slug}`}>ادامه مطلب ←</Link></div></article> } `r`
