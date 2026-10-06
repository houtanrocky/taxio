"use client";

import { useEffect } from "react";

export function AdminToast({ message }: { message: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState({}, "", url);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, []);

  return <div className="admin-toast" role="status">{message}</div>;
}
