"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MessageCircle } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type ConversationRow = {
  unread: number;
  conversationId: string;
  peer: { id: string; name: string; email: string; avatar: string | null };
  last: { text: string | null; createdAt: string; fileUrl: string | null; fileName: string | null; voiceUrl: string | null };
};

export function NotificationsMenu() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<ConversationRow[]> => {
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        throw new Error("Failed to load conversations");
      }
      return (await res.json()) as ConversationRow[];
    },
    staleTime: 15_000,
  });

  const unreadRows = useMemo(() => (data ?? []).filter((r) => r.unread > 0), [data]);
  const unreadTotal = useMemo(() => unreadRows.reduce((sum, r) => sum + r.unread, 0), [unreadRows]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#e5e7eb] bg-transparent text-[#374151] transition-all duration-150 hover:bg-[#f9fafb] active:scale-95",
            unreadTotal > 0 && "border-gold-400/60 bg-gold-50/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
          )}
          aria-label={unreadTotal > 0 ? `Notifications, ${unreadTotal} unread` : "Notifications"}
          aria-haspopup="dialog"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadTotal > 0 ? (
            <span className="type-overline absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-600 px-1 font-bold leading-none text-navy-950 ring-2 ring-white normal-case tracking-normal">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,20rem)] p-0 shadow-lg" sideOffset={8}>
        <div className="border-b border-navy-100 px-4 py-3">
          <p className="text-sm font-bold text-navy-900">Notifications</p>
          <p className="text-xs text-navy-500">Unread messages</p>
        </div>
        <div className="max-h-[min(60vh,22rem)] overflow-y-auto">
          {isPending ? (
            <p className="px-4 py-6 text-center text-sm text-navy-500">Loading…</p>
          ) : isError ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-red-600">Could not load notifications.</p>
              <Button
                type="button"
                className="mt-3 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-800 hover:bg-navy-50"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          ) : unreadRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MessageCircle className="h-10 w-10 text-navy-200" strokeWidth={1.25} />
              <p className="text-sm font-semibold text-navy-700">You&apos;re all caught up</p>
              <p className="text-xs text-navy-500">No unread direct messages.</p>
              <Button asChild className="mt-2 rounded-lg bg-navy-800 px-3 py-1.5 text-xs text-white hover:bg-navy-700">
                <Link href="/dm">Open messages</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-navy-50">
              {unreadRows.map((row) => {
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
                    <Link
                      href={`/dm/${row.peer.id}`}
                      className="flex gap-3 px-3 py-3 transition-colors hover:bg-navy-50"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-navy-100">
                        {row.peer.avatar ? <Image src={row.peer.avatar} alt="" fill className="object-cover" sizes="40px" /> : null}
                        {!row.peer.avatar ? (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-navy-700">
                            {initials}
                          </div>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-bold text-navy-900">{row.peer.name}</span>
                          <span className="type-caption shrink-0 rounded-full bg-gold-600 px-1.5 py-0.5 font-bold text-navy-950">
                            {row.unread}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-navy-500">{preview}</p>
                        <p className={cn("type-mono mt-1 text-navy-400")}>{formatDisplayDate(row.last.createdAt)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
