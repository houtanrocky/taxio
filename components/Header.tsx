import Link from "next/link";
import { Search } from "lucide-react";
import { brand, categories } from "../lib/content";
export function Header() {
  return <header className="site-header"><div className="container nav-wrap"><Link href="/" className="brand" aria-label="آروان، صفحه اصلی"><span className="brand-mark">آ</span><span><strong>{brand.persianName}</strong><small>Arevan · دانش تخصصی برای تصمیم‌های دقیق‌تر</small></span></Link><nav aria-label="ناوبری اصلی"><Link href="/">صفحه اصلی</Link><Link href="/articles">مقالات</Link><Link href={`/category/${categories[0].slug}`}>مالیات</Link><Link href={`/category/${categories[1].slug}`}>دادرسی مالیاتی</Link><Link href={`/category/${categories[4].slug}`}>حسابداری</Link><Link href={`/category/${categories[5].slug}`}>حسابرسی</Link><Link href="/about">درباره آروان</Link></nav><Link href="/search" className="icon-link" aria-label="جست‌وجو در آروان"><Search size={20}/><span className="search-label">جست‌وجو</span></Link></div></header>;
}
