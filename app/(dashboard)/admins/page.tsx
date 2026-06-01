import { redirect } from "next/navigation";

export default async function AdminsPage() {
  redirect("/system-users");
}
