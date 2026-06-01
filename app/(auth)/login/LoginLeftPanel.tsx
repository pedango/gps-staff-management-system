import { Shield } from "lucide-react";
import Image from "next/image";
import { AppLogo } from "@/components/brand/AppLogo";
import { LOGIN_HERO_ALT, LOGIN_HERO_SRC } from "@/lib/branding";
import { APP_BRAND } from "@/lib/ui-labels";

export function LoginLeftPanel() {
  return (
    <aside className="login-left" aria-label={`${APP_BRAND} login`}>
      <Image
        src={LOGIN_HERO_SRC}
        alt={LOGIN_HERO_ALT}
        fill
        priority
        sizes="50vw"
        className="login-hero-img object-cover object-center"
      />
      <div className="login-left-overlay" aria-hidden />

      <div className="login-left-inner">
        <div className="login-brand-row">
          <AppLogo size="lg" showRing={false} className="login-brand-logo" />
          <div className="login-brand-copy">
            <p className="login-brand-org">Ghana Police Service</p>
            <p className="login-brand-system">Staffs Management System</p>
          </div>
        </div>

        <div className="login-left-spacer">
          <div className="login-left-hero-cluster">
            <h1 className="login-hero-headline">
              Secure Access
              <br />
              to Police
              <br />
              Staffs
              <br />
              Records
            </h1>

            <div className="secure-records-card" role="note" aria-label="Secure Records">
              <div className="secure-records-card-accent" aria-hidden />
              <div className="secure-records-card-icon-wrap" aria-hidden>
                <Shield className="secure-records-card-icon" strokeWidth={2} />
              </div>
              <div className="secure-records-card-body">
                <p className="secure-records-card-title">Secure Records</p>
                <p className="secure-records-card-subtitle">
                  Protected by{" "}
                  <span className="secure-records-card-highlight">Enterprise-Grade ECC</span> Encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="left-status-bar">
        <span className="login-status-dot" aria-hidden />
        <span>All systems operational · Eastern North Region</span>
      </div>
    </aside>
  );
}
