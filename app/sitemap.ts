import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles } from "../lib/content-server";
export const revalidate = 300;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const base=process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000";const [articles,categories]=await Promise.all([getPublishedArticles(),getCategories()]);return [{url:base,lastModified:new Date()},{url:`${base}/about`},{url:`${base}/articles`},{url:`${base}/contact`},...articles.map(article=>({url:`${base}/articles/${article.slug}`,...(article.updatedAtIso?{lastModified:article.updatedAtIso}:{})})),...categories.map(category=>({url:`${base}/category/${category.slug}`}))]; }
