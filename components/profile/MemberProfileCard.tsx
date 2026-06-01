import Image from "next/image";
import type { Member, MemberStatus, Sex } from "@prisma/client";
import { APP_LOGO_SRC } from "@/lib/branding";
import { departmentAbbrev, formatDepartmentLabel } from "@/lib/departments";
import { statusConfig } from "@/lib/member-status";
import { dicebearInitialsUrl } from "@/lib/utils/dicebear";
import { calculateAge, formatDisplayDate, formatMemberName } from "@/lib/utils/format";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { MemberProfileActions } from "@/components/profile/MemberProfileActions";
import { ProfileInfoRow } from "@/components/profile/ProfileInfoRow";

const SEX_LABEL: Record<Sex, string> = { MALE: "Male", FEMALE: "Female" };

export function MemberProfileCard({ member }: { member: Member }) {
  const fullName = formatMemberName(member.firstName, member.lastName, member.otherNames);
  const avatarFallback = dicebearInitialsUrl(fullName);
  const deptLabel = formatDepartmentLabel(member.department);
  const deptAbbrev = departmentAbbrev(member.department);
  const status = member.status as MemberStatus;
  const statusMeta = statusConfig[status];

  return (
    <article className="profile-card">
      <div className="profile-hero-wrap">
        <div className="profile-hero" aria-hidden>
          <span className="profile-hero-shape profile-hero-shape-1" />
          <span className="profile-hero-shape profile-hero-shape-2" />
          <span className="profile-hero-shape profile-hero-shape-3" />
          <Image src={APP_LOGO_SRC} alt="" width={64} height={64} className="profile-hero-watermark" aria-hidden />
        </div>
        <div className="profile-avatar-wrap">
          {member.photo ? (
            <Image
              src={member.photo}
              alt=""
              width={80}
              height={80}
              className="profile-avatar object-cover"
              priority
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarFallback} alt="" className="profile-avatar" width={80} height={80} />
          )}
        </div>
      </div>

      <section className="profile-identity">
        <h1 className="profile-name">{fullName}</h1>
        <span className="profile-role-badge profile-role-badge--member">{member.rank}</span>
        <p className="profile-region">{deptLabel} · Eastern North Region</p>
      </section>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-value">{calculateAge(member.dob)}</div>
          <div className="profile-stat-label">Age</div>
        </div>
        <div className="profile-stat profile-stat-divider">
          <div className="profile-stat-value">{deptAbbrev}</div>
          <div className="profile-stat-label">Department</div>
        </div>
        <div className="profile-stat profile-stat-divider">
          <div className="profile-stat-value profile-stat-value--sm">{statusMeta.label}</div>
          <div className="profile-stat-label">Status</div>
        </div>
      </div>

      <div className="profile-info-list">
        <ProfileInfoRow label="Contact" value={member.contact} />
        <ProfileInfoRow label="Date of Birth" value={formatDisplayDate(member.dob)} />
        <ProfileInfoRow label="Sex" value={SEX_LABEL[member.sex]} />
        <ProfileInfoRow label="Rank" value={member.rank} />
        <ProfileInfoRow label="Department" value={deptLabel} />
        <ProfileInfoRow label="Division" value={member.division} />
        <ProfileInfoRow label="District" value={member.district} />
        <ProfileInfoRow label="Station" value={member.station} />
        <ProfileInfoRow label="Duty Status" valueNode={<MemberStatusBadge status={status} />} />
        <ProfileInfoRow label="Member Since" value={formatDisplayDate(member.createdAt)} />
        <ProfileInfoRow label="Last Updated" value={formatDisplayDate(member.updatedAt)} />
      </div>

      <MemberProfileActions memberId={member.id} />
    </article>
  );
}
