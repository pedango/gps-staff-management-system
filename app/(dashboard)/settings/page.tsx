import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSettingsForm } from "@/components/settings/AdminSettingsForm";
import { getSystemConfig } from "@/lib/services/system-config";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const config = await getSystemConfig();

  return <AdminSettingsForm initialConfig={config} />;
}
