import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getCategories } from "../../../../lib/content-server";
import { deleteArticle, updateArticle } from "../../actions";
import { AdminArticleForm } from "../../../../components/AdminArticleForm";
import { DeleteArticleButton } from "../../../../components/DeleteArticleButton";
export const dynamic = "force-dynamic";
export default async function EditArticle({params}:{params:Promise<{id:string}>}){const {id}=await params;const article=await getArticleBySlug(id,true);if(!article)notFound();const categories=await getCategories();return <main className="admin-shell"><div className="container"><div className="kicker">ویرایش مقاله</div><h1>{article.title}</h1><AdminArticleForm action={updateArticle.bind(null,article.slug)} categories={categories} submitLabel="ذخیره تغییرات" initial={{title:article.title,slug:article.slug,categorySlug:article.category.slug,excerpt:article.excerpt,shortAnswer:article.shortAnswer,content:article.content,seoTitle:article.seoTitle??"",seoDescription:article.seoDescription??"",readingTime:article.readingTime,status:article.status}}/><div className="admin-actions"><Link className="button button-secondary" href="/admin/articles">بازگشت</Link><DeleteArticleButton action={deleteArticle.bind(null,article.slug)} /></div></div></main>}
