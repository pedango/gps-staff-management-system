import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MemberProfileCard } from "@/components/profile/MemberProfileCard";

type PageProps = { params: Promise<{ id: string }> };

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    notFound();
  }

  return (
    <div className="profile-page-wrap profile-page-wrap--stacked">
      <Link href="/members" className="profile-back-link">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Staffs
      </Link>
      <MemberProfileCard member={member} />
    </div>
  );
}
