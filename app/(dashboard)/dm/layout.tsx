import type { ReactNode } from "react";
import { DmMessagesShell } from "@/components/dm/DmMessagesShell";

export default function DmLayout({ children }: { children: ReactNode }) {
  return <DmMessagesShell>{children}</DmMessagesShell>;
}
