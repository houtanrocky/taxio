import { Search } from "lucide-react";
import { brand, categories } from "../lib/content";
export function Header() {
  return <header className="site-header"><div className="container nav-wrap"><a href="/" className="brand" aria-label="آروان، صفحه اصلی"><span className="brand-mark">آ</span><span><strong>{brand.persianName}</strong><small>Arevan · دانش تخصصی برای تصمیم‌های دقیق‌تر</small></span></a><nav aria-label="ناوبری اصلی"><a href="/">صفحه اصلی</a><a href="/articles">مقالات</a><a href={`/category/${categories[0].slug}`}>مالیات</a><a href={`/category/${categories[1].slug}`}>دادرسی مالیاتی</a><a href={`/category/${categories[4].slug}`}>حسابداری</a><a href={`/category/${categories[5].slug}`}>حسابرسی</a><a href="/about">درباره آروان</a></nav><a href="/search" className="icon-link" aria-label="جست‌وجو در آروان"><Search size={20}/><span className="search-label">جست‌وجو</span></a></div></header>;
}
