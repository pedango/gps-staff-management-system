import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "@/components/members/MemberForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditMemberPage({ params }: PageProps) {
  const { id } = await params;
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    notFound();
  }
  return <MemberForm mode="edit" initial={member} />;
}
