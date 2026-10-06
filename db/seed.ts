import { categories, experts, articles } from "./schema";
import { db } from "./index";

async function main() {
  if (!db) throw new Error("DATABASE_URL is required. Put it in .env.local or the shell environment.");

  const [editorialAuthor] = await db.insert(experts).values({
    slug: "arevan-editorial",
    fullName: "تحریریه آروان",
    professionalTitle: "هویت انتشاراتی آروان",
    shortBio: "هویت انتشاراتی آروان برای تهیه و تدوین محتوای تخصصی و آموزشی.",
    biography: "آروان محتوای روشن و کاربردی درباره مالیات، دادرسی مالیاتی، حسابداری و حسابرسی منتشر می‌کند. این شناسه، نام انتشاراتی مطالب است.",
  }).returning();

  const seededCategories = await db.insert(categories).values([
    { name: "مالیات", slug: "maliat" },
    { name: "دادرسی مالیاتی", slug: "daderesi-maliati" },
    { name: "قوانین و مقررات مالیاتی", slug: "ghavanin" },
    { name: "سامانه مودیان", slug: "samane-moadian" },
    { name: "حسابداری", slug: "hesabdari" },
    { name: "حسابرسی", slug: "hesabrasi" },
    { name: "آموزش و تحلیل", slug: "amoozesh" },
  ]).returning();

  const samples = [
    { title: "اعتراض به برگ تشخیص مالیات چگونه انجام می‌شود؟", slug: "e-eteraz-be-barg-tashkhis", category: 1 },
    { title: "سامانه مودیان چیست؟", slug: "samane-moadian-guide", category: 3 },
    { title: "حسابرسی مالیاتی چیست؟", slug: "hesabrasi-maliati", category: 5 },
    { title: "تفاوت حسابرسی و رسیدگی مالیاتی چیست؟", slug: "tafavot-hesabrasi-residgi", category: 5 },
  ];
  await db.insert(articles).values(samples.map((sample, index) => ({
    title: sample.title,
    slug: sample.slug,
    excerpt: "این مقاله نمونه برای نمایش ساختار محتوای آروان است و پیش از انتشار باید با منابع معتبر و بررسی تخصصی تکمیل شود.",
    shortAnswer: "پاسخ کوتاه پس از بازبینی محتوایی در این بخش قرار می‌گیرد.",
    content: "## محتوای نمونه\n\nاین متن آموزشی نمونه است. جزئیات قانونی، مهلت‌ها و نرخ‌ها عمداً درج نشده‌اند تا پیش از انتشار بررسی و تکمیل شوند.\n\n### از کجا شروع کنیم؟\n\nموضوع خود را دقیق تعریف کنید، اسناد مرتبط را مرتب کنید و برای تصمیم‌گیری به منابع معتبر مراجعه کنید.",
    categoryId: seededCategories[sample.category].id,
    authorId: editorialAuthor.id,
    status: "published",
    publishedAt: new Date(),
    readingTime: 4,
    featured: index < 2,
  })));
  console.log(`Seeded Arevan editorial identity, ${seededCategories.length} categories and ${samples.length} articles.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
