import { Suspense } from "react";
import { MembersView } from "@/components/members/MembersView";
import { Skeleton } from "@/components/ui/skeleton";

function MembersFallback() {
  return (
    <div className="app-page">
      <Skeleton className="h-10 w-48 rounded-lg bg-navy-100" />
      <Skeleton className="h-20 w-full max-w-xl rounded-lg bg-navy-100" />
      <Skeleton className="h-36 w-full rounded-[14px] bg-navy-100" />
      <div className="app-card app-loading-rows">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg bg-navy-100" />
        ))}
      </div>
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<MembersFallback />}>
      <MembersView />
    </Suspense>
  );
}
