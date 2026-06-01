"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AdminAvatar } from "@/components/ui/AdminAvatar";

export function UserMenu() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="rounded-full transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          aria-label="Account menu"
        >
          <AdminAvatar name={user?.name} email={user?.email} image={user?.image} size="md" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[200] min-w-[220px] overflow-hidden rounded-xl border border-[#e9ecf3] bg-white p-0 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          sideOffset={8}
          align="end"
        >
          <div className="border-b border-[#f3f4f6] px-4 py-3">
            <div className="flex items-center gap-3">
              <AdminAvatar name={user?.name} email={user?.email} image={user?.image} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-navy-900">{user?.name}</div>
                <div className="truncate text-xs text-navy-400">{user?.email}</div>
              </div>
            </div>
          </div>
          <DropdownMenu.Item asChild className="cursor-pointer outline-none data-[highlighted]:bg-[#f9fafb]">
            <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151]">
              <User className="h-4 w-4 text-[#6b7280]" aria-hidden />
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="cursor-pointer outline-none data-[highlighted]:bg-[#f9fafb]">
            <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151]">
              <Settings className="h-4 w-4 text-[#6b7280]" aria-hidden />
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-0 h-px bg-[#f3f4f6]" />
          <DropdownMenu.Item
            className="dropdown-menu-item sign-out flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm outline-none data-[highlighted]:bg-red-50"
            onSelect={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
