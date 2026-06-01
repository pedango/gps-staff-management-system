"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteMemberButton({
  memberId,
  variant = "hero",
}: {
  memberId: string;
  variant?: "hero" | "profile";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const btnClass =
    variant === "profile"
      ? "profile-btn-signout profile-btn-signout--danger w-full"
      : "rounded-xl bg-white/10 px-4 py-2 font-semibold text-white/70 hover:bg-red-500/20 hover:text-red-300";

  return (
    <>
      {variant === "profile" ? (
        <button type="button" className={btnClass} onClick={() => setOpen(true)}>
          Delete Record
        </button>
      ) : (
        <Button type="button" className={btnClass} onClick={() => setOpen(true)}>
          Delete
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm Deletion"
        description="This action cannot be undone. The personnel record will be permanently removed from the system."
        confirmLabel="Delete Record"
        onConfirm={async () => {
          const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
          if (!res.ok) {
            toast.error("Could not delete record");
            return;
          }
          toast.success("Member deleted");
          router.push("/members");
          router.refresh();
        }}
        tone="danger"
      />
    </>
  );
}
