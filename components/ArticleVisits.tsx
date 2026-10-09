"use client";

import { useEffect, useRef, useState } from "react";

export function ArticleVisits({ slug, initialVisits }: { slug: string; initialVisits: number }) {
  const [visits, setVisits] = useState(initialVisits);
  const recorded = useRef(false);

  useEffect(() => {
    // Count actual page mounts, not server renders or prefetched links.
    if (recorded.current) return;
    recorded.current = true;
    fetch(`/api/articles/${encodeURIComponent(slug)}/visits`, { method: "POST" })
      .then(async response => {
        if (!response.ok) return;
        const data = await response.json();
        if (Number.isSafeInteger(data.visits) && data.visits >= 0) setVisits(data.visits);
      })
      .catch(() => { /* Keep the initial count if tracking is unavailable. */ });
  }, [slug]);

  return <span className="article-visits"><strong>تعداد بازدید ها:</strong> {visits.toLocaleString("fa-IR")}</span>;
}
