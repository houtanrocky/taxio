"use client";

import { useActionState, useMemo, useState } from "react";
import type { ArticleActionState } from "../app/admin/actions";

type CategoryOption = { slug: string; name: string };
type InitialValues = { title?: string; slug?: string; categorySlug?: string; excerpt?: string; shortAnswer?: string; content?: string; seoTitle?: string; seoDescription?: string; readingTime?: number; status?: string };
type Action = (state: ArticleActionState, formData: FormData) => ArticleActionState | Promise<ArticleActionState>;

function normalizeSlug(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("fa").replace(/[يى]/g, "ی").replace(/[ك]/g, "ک").replace(/[ًٌٍَُِّْـ]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

export function AdminArticleForm({ action, categories, initial = {}, submitLabel = "ذخیره مقاله" }: { action: Action; categories: CategoryOption[]; initial?: InitialValues; submitLabel?: string }) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverState, formAction, pending] = useActionState(action, {});
  const normalizedPreview = useMemo(() => normalizeSlug(title), [title]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(normalizeSlug(value));
  }

  function validate(form: HTMLFormElement) {
    const data = new FormData(form);
    const next: Record<string, string> = {};
    const value = (key: string) => String(data.get(key) ?? "").trim();
    if (value("title").length < 5) next.title = "عنوان باید حداقل ۵ حرف داشته باشد.";
    if (!value("slug")) next.slug = "نشانی مقاله را وارد کنید.";
    if (value("excerpt").length < 20) next.excerpt = "خلاصه باید حداقل ۲۰ حرف داشته باشد.";
    if (value("content").length < 50) next.content = "محتوا برای انتشار باید حداقل ۵۰ حرف داشته باشد.";
    if (!value("categoryId")) next.categoryId = "یک دسته‌بندی انتخاب کنید.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return <form className="form-grid admin-editor" action={formAction} onSubmit={event => { if (!validate(event.currentTarget)) event.preventDefault(); }} noValidate>
    {Object.keys(errors).length > 0 && <div className="form-error" role="alert"><strong>لطفاً این موارد را اصلاح کنید:</strong><ul>{Object.values(errors).map(error => <li key={error}>{error}</li>)}</ul></div>}
    {serverState.error === "slug" && <div className="form-error" role="alert">این slug قبلاً استفاده شده است. یک نشانی متفاوت انتخاب کنید.</div>}
    <label>عنوان مقاله<input className="input" name="title" value={title} onChange={event => handleTitleChange(event.target.value)} aria-invalid={Boolean(errors.title)} autoFocus required/><small className="field-hint">عنوان واضح و پاسخ‌محور، شانس دیده‌شدن و خوانده‌شدن مقاله را بیشتر می‌کند.</small></label>
    <label>نشانی یکتا (slug)<input className="input" name="slug" value={slug} onChange={event => { setSlugEdited(true); setSlug(normalizeSlug(event.target.value)); }} aria-invalid={Boolean(errors.slug)} required/><small className="field-hint">{slugEdited ? "این نشانی با حذف فاصله‌ها و نویسه‌های نامعتبر نرمال می‌شود." : `پیشنهاد خودکار: ${normalizedPreview || "پس از نوشتن عنوان ساخته می‌شود"}`}</small></label>
    <label>دسته‌بندی<select className="select" name="categoryId" defaultValue={initial.categorySlug ?? ""} aria-invalid={Boolean(errors.categoryId)} required><option value="">انتخاب دسته‌بندی</option>{categories.map(category => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>
    <label>خلاصه مقاله<textarea className="textarea" name="excerpt" defaultValue={initial.excerpt} aria-invalid={Boolean(errors.excerpt)} required minLength={20}/><small className="field-hint">یک خلاصه ۱ تا ۲ جمله‌ای از پاسخ مقاله بنویسید.</small></label>
    <label>پاسخ کوتاه<textarea className="textarea" name="shortAnswer" defaultValue={initial.shortAnswer}/><small className="field-hint">اگر مقاله پاسخ مشخصی دارد، آن را در ابتدای کار کوتاه و روشن بنویسید.</small></label>
    <label>محتوای مقاله<textarea className="textarea" name="content" defaultValue={initial.content} aria-invalid={Boolean(errors.content)} required minLength={50} style={{minHeight:280}} placeholder="برای تیترها از ## و برای نکته مهم از > استفاده کنید."/><small className="field-hint">پاراگراف‌ها را با یک خط خالی جدا کنید. تیترهای ## و ### در صفحه مقاله به‌صورت ساختاریافته نمایش داده می‌شوند.</small></label>
    <details className="seo-details"><summary>تنظیمات SEO (اختیاری)</summary><div className="form-grid"><label>عنوان SEO<input className="input" name="seoTitle" defaultValue={initial.seoTitle}/><small className="field-hint">اگر خالی بماند، عنوان مقاله استفاده می‌شود.</small></label><label>توضیحات SEO<textarea className="textarea" name="seoDescription" defaultValue={initial.seoDescription}/><small className="field-hint">یک توضیح دقیق و کوتاه برای نتیجه جستجو بنویسید.</small></label></div></details>
    <div className="editor-row"><label>زمان مطالعه (دقیقه)<input className="input" name="readingTime" type="number" defaultValue={initial.readingTime ?? 5} min={1} max={180}/></label><label>وضعیت<select className="select" name="status" defaultValue={initial.status ?? "draft"}><option value="draft">پیش‌نویس</option><option value="published">انتشار</option></select></label></div>
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? "در حال ذخیره…" : submitLabel}</button>
  </form>;
}
