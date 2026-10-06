import { logoutAdmin } from "../app/admin/login/actions";
export function AdminLogout(){return <form action={logoutAdmin}><button className="button button-secondary" type="submit">خروج</button></form>}
