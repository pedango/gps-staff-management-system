"use client";

import Link from "next/link";
import { DeleteMemberButton } from "@/components/members/DeleteMemberButton";

export function MemberProfileActions({ memberId }: { memberId: string }) {
  return (
    <div className="profile-actions">
      <Link href={`/members/${memberId}/edit`} className="profile-btn-edit">
        Edit Profile
      </Link>
      <DeleteMemberButton memberId={memberId} variant="profile" />
    </div>
  );
}
