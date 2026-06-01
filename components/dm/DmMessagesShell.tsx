"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Search, SquarePen } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
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
  peer: { id: string; name: string; email: string; avatar: string | null; createdAt: string };
};

export function DmMessagesShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const peerId = pathname.startsWith("/dm/") && pathname !== "/dm" ? (pathname.split("/")[2] ?? null) : null;
  const [q, setQ] = useState("");

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<ConversationRow[]> => {
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        throw new Error("Failed to load conversations");
      }
      return (await res.json()) as ConversationRow[];
    },
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.peer.name.toLowerCase().includes(s) || r.peer.email.toLowerCase().includes(s));
  }, [data, q]);

  const sidebar = (
    <aside
      className={cn(
        "dm-sidebar-panel",
        peerId ? "hidden md:flex" : "flex",
      )}
    >
      <div className="dm-sidebar-header">
        <div className="dm-sidebar-title-block">
          <p className="dm-sidebar-subtitle">
            {filtered.length} conversation{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/system-users" className="app-icon-btn h-9 w-9 shrink-0" aria-label="New message">
          <SquarePen className="h-[18px] w-[18px]" aria-hidden />
        </Link>
      </div>
      <div className="shrink-0 px-4 py-3">
        <div className="relative">
          <Search className="app-filter-search-icon" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations…"
            className="app-filter-input app-filter-input-with-icon w-full"
            aria-label="Search conversations"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-lg bg-navy-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600">Unable to load conversations.</p>
            <button
              type="button"
              className="app-btn app-btn-outline"
              disabled={isRefetching}
              onClick={() => void refetch()}
            >
              {isRefetching ? "Retrying…" : "Try again"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          q.trim() ? (
            <div className="p-6 text-center text-sm text-navy-500">No conversations match your search.</div>
          ) : (
            <EmptyState
              title="No conversations yet"
              description="Start a new thread from Staff Officers."
              action={
                <Link href="/system-users" className="app-btn app-btn-gold">
                  View Staff Officers
                </Link>
              }
            />
          )
        ) : (
          filtered.map((row) => {
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
            const active = peerId === row.peer.id;
            const unread = row.unread > 0;

            return (
              <Link
                key={row.conversationId}
                href={`/dm/${row.peer.id}`}
                className={cn(
                  "dm-conversation-item",
                  active && "dm-conversation-item--active",
                  unread && !active && "dm-conversation-item--unread",
                )}
              >
                <span className="dm-conversation-avatar">
                  {row.peer.avatar ? (
                    <Image src={row.peer.avatar} alt="" fill className="object-cover" sizes="44px" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn("dm-conversation-name truncate", unread && "dm-conversation-name--unread")}>
                      {row.peer.name}
                    </span>
                    <span className="dm-conversation-time">{formatDisplayDate(row.last.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="dm-conversation-preview flex-1">{preview}</span>
                    {unread ? <span className="dm-unread-dot" aria-label="Unread" /> : null}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );

  return (
    <div className="dm-shell-height flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[14px] border border-[#e9ecf3] bg-white md:flex-row">
      {sidebar}
      <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", !peerId ? "hidden md:flex" : "flex")}>
        {children}
      </div>
    </div>
  );
}
