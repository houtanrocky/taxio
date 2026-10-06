import Link from "next/link";
import { createArticle } from "../../actions";
import { getCategories } from "../../../../lib/content-server";
import { AdminArticleForm } from "../../../../components/AdminArticleForm";
export const dynamic = "force-dynamic";
export default async function NewArticle(){const categories=await getCategories();return <main className="admin-shell"><div className="container"><div className="kicker">مدیریت مقالات</div><h1>مقاله جدید</h1><p className="section-lead">مقاله را به‌صورت پیش‌نویس ذخیره کنید یا مستقیماً منتشر کنید.</p><AdminArticleForm action={createArticle} categories={categories} /><Link className="button button-secondary" href="/admin/articles" style={{marginTop:12}}>انصراف</Link></div></main>}
