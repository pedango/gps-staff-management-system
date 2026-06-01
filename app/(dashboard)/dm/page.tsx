import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DmPage() {
  return (
    <div className="dm-panel-empty flex-1">
      <EmptyState
        icon={<MessageSquare className="h-16 w-16" strokeWidth={1.25} />}
        title="Select a conversation"
        description="Choose a thread from the list, or start a new secure message with a regional administrator."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/system-users" className="app-btn app-btn-gold">
              <Users className="h-4 w-4" aria-hidden />
              Staff Officers
            </Link>
          </div>
        }
      />
    </div>
  );
}
