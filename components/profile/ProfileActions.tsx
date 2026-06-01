"use client";

import { signOut } from "next-auth/react";

export function ProfileActions() {
  return (
    <div className="profile-actions">
      <button type="button" className="profile-btn-edit">
        Edit Profile
      </button>
      <button
        type="button"
        className="profile-btn-signout profile-btn-signout--danger"
        onClick={() => void signOut({ callbackUrl: "/login" })}
      >
        Sign Out
      </button>
    </div>
  );
}
