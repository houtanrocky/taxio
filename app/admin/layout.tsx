import type { Metadata } from "next";
import { AdminLogout } from "../../components/AdminLogout";
export const metadata: Metadata = { title: "مدیریت آروان", robots: { index: false, follow: false, nocache: true } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <><div className="admin-toolbar"><div className="container"><span>آروان · پنل مدیریت</span><AdminLogout/></div></div>{children}</>; }
