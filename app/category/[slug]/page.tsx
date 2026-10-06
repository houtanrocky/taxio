import { notFound } from "next/navigation";
import { categories, articles as fallbackArticles } from "../../../lib/content";
import { databaseConfigured, getArticlesByCategory, getCategories } from "../../../lib/content-server";
import { ArticleCard } from "../../../components/ArticleCard";
export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams(){ return (await getCategories()).map(category=>({slug:category.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const result=await getArticlesByCategory(slug);return result.category?{title:result.category.name,description:result.category.description}:{title:"دسته‌بندی پیدا نشد"};}
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const result=await getArticlesByCategory(slug);const category=result.category??(databaseConfigured?undefined:categories.find(item=>item.slug===slug));if(!category)notFound();const list=result.articles.length||databaseConfigured?result.articles:fallbackArticles.filter(article=>article.category.slug===slug);return <main><section className="page-intro"><div className="container"><div className="kicker">دسته‌بندی مقالات</div><h1>{category.name}</h1><p className="section-lead">{category.description}</p></div></section><section className="section"><div className="container">{list.length?<div className="article-grid">{list.map(article=><ArticleCard article={article} key={article.slug}/>)}</div>:<div className="empty">هنوز مقاله‌ای در این دسته منتشر نشده است.</div>}</div></section></main>}
