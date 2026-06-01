import Image from "next/image";
import { isToday, format } from "date-fns";
import { APP_LOGO_SRC } from "@/lib/branding";
import { dicebearInitialsUrl } from "@/lib/utils/dicebear";
import { formatDisplayDate } from "@/lib/utils/format";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ProfileInfoRow } from "@/components/profile/ProfileInfoRow";

export type AdminProfileCardProps = {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  totalMembers: number;
  totalAdmins: number;
};

function formatLastActivity(d: Date): string {
  if (isToday(d)) {
    return `Today, ${format(d, "hh:mm a")}`;
  }
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function AdminProfileCard({ name, email, createdAt, updatedAt, totalMembers, totalAdmins }: AdminProfileCardProps) {
  const avatarSrc = dicebearInitialsUrl(name);

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt="" className="profile-avatar" width={80} height={80} />
        </div>
      </div>

      <section className="profile-identity">
        <h1 className="profile-name">{name}</h1>
        <span className="profile-role-badge">SYSTEM ADMINISTRATOR</span>
        <p className="profile-region">Eastern North Region</p>
      </section>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-value">{totalMembers.toLocaleString()}</div>
          <div className="profile-stat-label">Staffs</div>
        </div>
        <div className="profile-stat profile-stat-divider">
          <div className="profile-stat-value">{totalAdmins.toLocaleString()}</div>
          <div className="profile-stat-label">Admins</div>
        </div>
        <div className="profile-stat profile-stat-divider">
          <div className="profile-stat-value">EN Region</div>
          <div className="profile-stat-label">Region</div>
        </div>
      </div>

      <div className="profile-info-list">
        <ProfileInfoRow label="Email" value={email} />
        <ProfileInfoRow label="Date Joined" value={formatDisplayDate(createdAt)} />
        <ProfileInfoRow label="Last Login" value={formatLastActivity(updatedAt)} />
        <ProfileInfoRow label="Access Level" value="Full Administrator" />
        <ProfileInfoRow
          label="Status"
          valueNode={
            <span className="profile-status-active">
              <span className="profile-status-dot" aria-hidden />
              Active
            </span>
          }
        />
      </div>

      <ProfileActions />
    </article>
  );
}
