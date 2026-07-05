import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberProfileCard } from "@/components/profile/MemberProfileCard";
import { BackLink } from "@/components/ui/BackLink";

type PageProps = { params: Promise<{ id: string }> };

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    notFound();
  }

  return (
    <div className="profile-page-wrap profile-page-wrap--stacked">
      <BackLink href="/members">Back to Staffs</BackLink>
      <MemberProfileCard member={member} />
    </div>
  );
}
