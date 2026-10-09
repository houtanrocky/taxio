"use client";

import { useState } from "react";

export function ArticleRating({ slug, total, count }: { slug: string; total: number; count: number }) {
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [average, setAverage] = useState(count ? total / count : 0);
  const [votes, setVotes] = useState(count);

  async function submit(value: number) {
    if (rating) return;
    setRating(value);
    const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/rating`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating: value }),
    });
    if (!response.ok) { setRating(null); return; }
    const data = await response.json();
    setAverage(data.average); setVotes(data.count);
  }

  const activeStars = hovered ?? rating ?? 0;
  const toPersian = (value: string | number) => String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]).replace(".", "٫");
  return <div className="article-rating" aria-label="امتیازدهی به مقاله">
    <div className="rating-heading"><strong>امتیاز کاربران</strong><span dir="rtl">میانگین: {average ? toPersian(average.toFixed(1)) : "—"} از ۵ · {toPersian(votes.toLocaleString("en-US"))} رأی</span></div>
    <div className="rating-stars" onMouseLeave={() => setHovered(null)}>{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" className={value <= activeStars ? "selected" : ""} onMouseEnter={() => setHovered(value)} onClick={() => submit(value)} disabled={Boolean(rating)} aria-label={`${toPersian(value)} ستاره`}>★</button>)}</div>
    <small>{rating ? "از امتیاز شما سپاسگزاریم." : "برای ثبت نظر، یک تا پنج ستاره انتخاب کنید"}</small>
  </div>;
}
