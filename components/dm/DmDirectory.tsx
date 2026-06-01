"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare, Shield } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils/format";
import type { AdminPublic } from "@/types/admin";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { LABEL_STAFF_OFFICERS } from "@/lib/ui-labels";
import { UI_INFO_BANNER } from "@/lib/ui-classes";
import { TYPE_MONO } from "@/lib/typography";
import { cn } from "@/lib/utils/cn";

type ConversationRow = {
  last: {
    id: string;
    text: string | null;
    createdAt: string;
    fileUrl: string | null;
    fileName: string | null;
    voiceUrl: string | null;
  };
  unread: number;
  conversationId: string;
  peer: AdminPublic;
};

export function AdminsGrid({ selfId }: { selfId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["admins"],
    queryFn: async (): Promise<AdminPublic[]> => {
      const res = await fetch("/api/admins");
      if (!res.ok) {
        throw new Error("Failed to load admins");
      }
      return (await res.json()) as AdminPublic[];
    },
  });

  return (
    <div className="app-page">
      <p className="mb-5 text-sm text-navy-400">
        <span className="font-semibold text-navy-700">{data ? data.length : 0}</span>{" "}
        {LABEL_STAFF_OFFICERS.toLowerCase()}
        {data && data.length === 1 ? "" : "s"} · Eastern North Region
      </p>

      {isPending ? (
        <div className="app-admin-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-[14px] bg-navy-100" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="app-error-banner" role="alert">
          Unable to load system users. Refresh the page or try again later.
        </div>
      ) : data.length === 0 ? (
        <div className="app-card">
          <EmptyState
            title={`No ${LABEL_STAFF_OFFICERS.toLowerCase()}`}
            description={`No other ${LABEL_STAFF_OFFICERS.toLowerCase()} are registered yet.`}
          />
        </div>
      ) : (
        <>
          <div className={cn(UI_INFO_BANNER, "app-info-banner--accent")}>
            Authorised {LABEL_STAFF_OFFICERS.toLowerCase()} for the Eastern North Region. Message any colleague to
            coordinate personnel operations.
          </div>
          <ul className="app-admin-grid list-none p-0">
            {data.map((admin) => {
              const isSelf = admin.id === selfId;
              return (
                <li key={admin.id}>
                  <article className={cn("app-admin-card", isSelf && "app-admin-card--self")}>
                    {isSelf ? <span className="app-admin-card-you">You</span> : null}
                    <div className="app-admin-card-body">
                      <AdminAvatar
                        name={admin.name}
                        email={admin.email}
                        image={admin.avatar}
                        size="lg"
                        className={cn(isSelf && "ring-2 ring-gold-500")}
                      />
                      <div className="app-admin-card-meta min-w-0">
                        <h3 className="truncate">{admin.name}</h3>
                        <span className="app-admin-role-chip">
                          <Shield className="h-3 w-3" aria-hidden />
                          Staff Officer
                        </span>
                        <p className="app-admin-card-email truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {admin.email}
                        </p>
                        <p className="app-admin-card-joined">Joined {formatDisplayDate(admin.createdAt)}</p>
                      </div>
                    </div>
                    <div className="app-admin-card-action w-full sm:w-auto">
                      {isSelf ? (
                        <span className="app-btn app-btn-outline w-full cursor-default opacity-60 sm:w-auto">Your Account</span>
                      ) : (
                        <Link href={`/dm/${admin.id}`} className="app-btn app-btn-gold w-full sm:w-auto">
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          Send Message
                        </Link>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function DmInbox({ selfId: _selfId }: { selfId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<ConversationRow[]> => {
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        throw new Error("Failed to load conversations");
      }
      return (await res.json()) as ConversationRow[];
    },
  });

  if (isPending) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg bg-navy-100" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="p-4 text-sm text-red-600">Unable to load conversations.</p>;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Start a message from the Staff Officers page."
        action={
          <Link href="/system-users" className="app-btn app-btn-gold">
            View system users
          </Link>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-navy-50">
      {data.map((row) => {
        const preview =
          row.last.text ??
          (row.last.fileUrl ? (row.last.fileName ?? "Attachment") : null) ??
          (row.last.voiceUrl ? "Voice message" : "Message");
        const initials =
          row.peer.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || row.peer.email.slice(0, 2).toUpperCase();

        return (
          <li key={row.conversationId}>
            <Link href={`/dm/${row.peer.id}`} className="dm-conversation-item">
              <span className="dm-conversation-avatar relative">
                {row.peer.avatar ? (
                  <Image src={row.peer.avatar} alt="" fill className="object-cover" sizes="44px" />
                ) : (
                  initials
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="dm-conversation-name truncate">{row.peer.name}</span>
                  {row.unread > 0 ? <span className="dm-unread-badge">{row.unread}</span> : null}
                </span>
                <span className="dm-conversation-preview block">{preview}</span>
                <span className={cn(TYPE_MONO, "mt-1 block text-navy-400")}>{formatDisplayDate(row.last.createdAt)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
