import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProfileCard } from "@/components/profile/AdminProfileCard";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [admin, totalMembers, totalAdmins] = await Promise.all([
    prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true, updatedAt: true },
    }),
    prisma.member.count(),
    prisma.admin.count(),
  ]);

  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="profile-page-wrap">
      <AdminProfileCard
        name={admin.name}
        email={admin.email}
        createdAt={admin.createdAt}
        updatedAt={admin.updatedAt}
        totalMembers={totalMembers}
        totalAdmins={totalAdmins}
      />
    </div>
  );
}
