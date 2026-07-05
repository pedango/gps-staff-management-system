import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminsGrid } from "@/components/dm/DmDirectory";

export const metadata: Metadata = {
  title: "Senior Police Officers — Ghana Police Service",
};

export default async function SystemUsersPage() {
  const session = await auth();
  const selfId = session?.user?.id ?? "";

  const self = selfId
    ? await prisma.admin.findUnique({
        where: { id: selfId },
        select: { name: true },
      })
    : null;

  return <AdminsGrid selfId={selfId} selfName={self?.name ?? session?.user?.name ?? "Admin"} />;
}
