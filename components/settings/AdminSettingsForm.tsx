"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/ui/AppPageHeader";
import { PageActionOutline } from "@/components/ui/PageActions";
import type { SystemConfigDto } from "@/lib/services/system-config";
import type { SystemConfigInput } from "@/lib/validations/system-config.schema";
import { UI_INPUT, UI_LABEL } from "@/lib/ui-classes";
import { cn } from "@/lib/utils/cn";

export function AdminSettingsForm({ initialConfig }: { initialConfig: SystemConfigDto }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SystemConfigInput>({
    regionName: initialConfig.regionName,
    orgName: initialConfig.orgName,
    systemTitle: initialConfig.systemTitle,
    membersPageSize: initialConfig.membersPageSize,
    enableDirectMessaging: initialConfig.enableDirectMessaging,
    requireMemberPhoto: initialConfig.requireMemberPhoto,
    maintenanceMode: initialConfig.maintenanceMode,
  });

  const { data: config = initialConfig } = useQuery({
    queryKey: ["system-config"],
    queryFn: async (): Promise<SystemConfigDto> => {
      const res = await fetch("/api/settings", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load settings");
      return (await res.json()) as SystemConfigDto;
    },
    initialData: initialConfig,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: SystemConfigInput): Promise<SystemConfigDto> => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof err.error === "string" ? err.error : "Could not save settings");
      }
      return (await res.json()) as SystemConfigDto;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["system-config"], saved);
      toast.success("System settings saved");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  function update<K extends keyof SystemConfigInput>(key: K, value: SystemConfigInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  return (
    <div className="app-page settings-page">
      <AppPageHeader
        subtitle="Configure regional branding and basic behaviour for GPS — PMS (Eastern North)."
        meta={config.updatedAt ? `Last saved ${new Date(config.updatedAt).toLocaleString()}` : undefined}
        actions={
          <PageActionOutline href="/profile">View profile</PageActionOutline>
        }
      />

      <form onSubmit={onSubmit} className="settings-form">
        <section className="app-card settings-section">
          <h2 className="settings-section-title">Regional &amp; branding</h2>
          <p className="settings-section-desc">Displayed on the dashboard welcome strip and login context.</p>
          <div className="settings-fields">
            <div className="settings-field">
              <label htmlFor="regionName" className={UI_LABEL}>
                Region name
              </label>
              <input
                id="regionName"
                className={UI_INPUT}
                value={form.regionName}
                onChange={(e) => update("regionName", e.target.value)}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="orgName" className={UI_LABEL}>
                Organisation
              </label>
              <input
                id="orgName"
                className={UI_INPUT}
                value={form.orgName}
                onChange={(e) => update("orgName", e.target.value)}
                required
              />
            </div>
            <div className="settings-field settings-field--full">
              <label htmlFor="systemTitle" className={UI_LABEL}>
                System title
              </label>
              <input
                id="systemTitle"
                className={UI_INPUT}
                value={form.systemTitle}
                onChange={(e) => update("systemTitle", e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        <section className="app-card settings-section">
          <h2 className="settings-section-title">Personnel directory</h2>
          <p className="settings-section-desc">Controls how members are listed and registered.</p>
          <div className="settings-fields">
            <div className="settings-field">
              <label htmlFor="membersPageSize" className={UI_LABEL}>
                Members per page
              </label>
              <input
                id="membersPageSize"
                type="number"
                min={10}
                max={100}
                className={UI_INPUT}
                value={form.membersPageSize}
                onChange={(e) => update("membersPageSize", Number.parseInt(e.target.value, 10) || 20)}
              />
            </div>
            <SettingsToggle
              id="requireMemberPhoto"
              label="Require photo on registration"
              description="New member forms must include a passport photo before save."
              checked={form.requireMemberPhoto}
              onChange={(v) => update("requireMemberPhoto", v)}
            />
          </div>
        </section>

        <section className="app-card settings-section">
          <h2 className="settings-section-title">Messaging &amp; access</h2>
          <p className="settings-section-desc">Administrator collaboration and system availability.</p>
          <div className="settings-toggles">
            <SettingsToggle
              id="enableDirectMessaging"
              label="Enable admin direct messaging"
              description="Allow administrators to message each other in the Messages area."
              checked={form.enableDirectMessaging}
              onChange={(v) => update("enableDirectMessaging", v)}
            />
            <SettingsToggle
              id="maintenanceMode"
              label="Maintenance mode"
              description="Show a notice to administrators that the system is under maintenance."
              checked={form.maintenanceMode}
              onChange={(v) => update("maintenanceMode", v)}
              variant="warning"
            />
          </div>
        </section>

        <div className="settings-form-footer">
          <button type="submit" className="app-btn app-btn-gold settings-save-btn" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                Save settings
              </>
            )}
          </button>
        </div>
      </form>

      <div className="app-info-banner settings-note">
        <AlertCircle className="h-4 w-4 shrink-0 text-gold-700" aria-hidden />
        <span>
          Changes apply system-wide for all administrators. Some options may require a page refresh to take full effect.
        </span>
      </div>
    </div>
  );
}

function SettingsToggle({
  id,
  label,
  description,
  checked,
  onChange,
  variant = "default",
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  variant?: "default" | "warning";
}) {
  return (
    <div className={cn("settings-toggle", variant === "warning" && "settings-toggle--warning")}>
      <div className="settings-toggle-text">
        <label htmlFor={id} className="settings-toggle-label">
          {label}
        </label>
        <p className="settings-toggle-desc">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={cn("settings-switch", checked && "settings-switch--on")}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-switch-thumb" aria-hidden />
      </button>
    </div>
  );
}
