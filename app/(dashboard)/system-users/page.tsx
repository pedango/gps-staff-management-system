import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AdminsGrid } from "@/components/dm/DmDirectory";

export const metadata: Metadata = {
  title: "Staff Officers — Ghana Police Service",
};

export default async function SystemUsersPage() {
  const session = await auth();
  const selfId = session?.user?.id ?? "";

  return <AdminsGrid selfId={selfId} />;
}
