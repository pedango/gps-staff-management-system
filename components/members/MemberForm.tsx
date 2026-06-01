"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Member, Sex } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { DepartmentField } from "@/components/members/DepartmentField";
import { RankField } from "@/components/members/RankField";
import { formatDepartmentLabel } from "@/lib/departments";
import { MEMBER_STATUS_VALUES } from "@/lib/member-filter-options";
import { statusConfig } from "@/lib/member-status";
import { memberSchema, POLICE_RANKS, type MemberFormData } from "@/lib/validations/member.schema";
import { UI_BTN_PRIMARY, UI_BTN_SECONDARY, UI_INPUT, UI_LABEL, UI_SELECT } from "@/lib/ui-classes";
import { LABEL_ADD_STAFF, LABEL_EDIT_STAFF, LABEL_STAFF, LABEL_STAFFS } from "@/lib/ui-labels";
import { cn } from "@/lib/utils/cn";
import { AppPageHeader } from "@/components/ui/AppPageHeader";
import { PageActionOutline } from "@/components/ui/PageActions";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/members/PhotoUpload";

function toInputDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="app-field-error" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export function MemberForm({ mode, initial }: { mode: "add" | "edit"; initial?: Member }) {
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const defaults = useMemo<MemberFormData>(() => {
    if (initial) {
      return {
        firstName: initial.firstName,
        lastName: initial.lastName,
        otherNames: initial.otherNames ?? undefined,
        dob: initial.dob,
        sex: initial.sex,
        rank: initial.rank,
        contact: initial.contact,
        department: formatDepartmentLabel(initial.department),
        division: initial.division,
        district: initial.district,
        station: initial.station,
        status: initial.status,
        photo: initial.photo ?? undefined,
      };
    }
    return {
      firstName: "",
      lastName: "",
      otherNames: undefined,
      dob: new Date(),
      sex: "MALE" as Sex,
      rank: POLICE_RANKS[POLICE_RANKS.length - 1]!,
      contact: "+233",
      department: "General Duties",
      division: "",
      district: "",
      station: "",
      status: "ACTIVE",
      photo: undefined,
    };
  }, [initial]);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as Resolver<MemberFormData>,
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (photoFile) {
        const fd = new FormData();
        fd.append("firstName", values.firstName);
        fd.append("lastName", values.lastName);
        if (values.otherNames) fd.append("otherNames", values.otherNames);
        fd.append("dob", values.dob.toISOString());
        fd.append("sex", values.sex);
        fd.append("rank", values.rank);
        fd.append("contact", values.contact);
        fd.append("department", values.department);
        fd.append("division", values.division);
        fd.append("district", values.district);
        fd.append("station", values.station);
        fd.append("status", values.status);
        if (values.photo) fd.append("photo", values.photo);
        fd.append("photoFile", photoFile);

        const url = mode === "add" ? "/api/members" : `/api/members/${initial?.id ?? ""}`;
        const res = await fetch(url, { method: mode === "add" ? "POST" : "PUT", body: fd });
        if (!res.ok) {
          const body = (await res.json()) as { error?: unknown };
          throw new Error(typeof body.error === "string" ? body.error : "Request failed");
        }
      } else {
        const url = mode === "add" ? "/api/members" : `/api/members/${initial?.id ?? ""}`;
        const res = await fetch(url, {
          method: mode === "add" ? "POST" : "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: unknown };
          throw new Error(typeof body.error === "string" ? body.error : "Request failed");
        }
      }

      toast.success(mode === "add" ? `${LABEL_STAFF} created` : `${LABEL_STAFF} updated`);
      router.push("/members");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast.error(message);
    }
  });

  const subtitle =
    mode === "add"
      ? "Register a new personnel record. Required fields are marked with an asterisk."
      : "Update personnel details. Changes are saved to the regional directory.";

  return (
    <div className="app-page app-form-page">
      <AppPageHeader
        subtitle={subtitle}
        actions={
          <PageActionOutline href="/members">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to {LABEL_STAFFS}
          </PageActionOutline>
        }
      />

      <form onSubmit={onSubmit} className="app-form-card">
        <div className="app-form-hero">
          <h2 className="app-form-hero-title">{mode === "add" ? "New personnel record" : "Update personnel record"}</h2>
          <p className="app-form-hero-desc">Photo must be passport size. All service fields are required for audit compliance.</p>
        </div>

        <section className="app-form-section" aria-labelledby="photo-section">
          <h3 id="photo-section" className="app-form-section-title">
            Photo
          </h3>
          <PhotoUpload
            valueUrl={form.watch("photo")}
            onChangeFile={setPhotoFile}
            onClear={() => form.setValue("photo", undefined, { shouldValidate: true })}
          />
        </section>

        <section className="app-form-section" aria-labelledby="personal-section">
          <h3 id="personal-section" className="app-form-section-title">
            Personal information
          </h3>
          <div className="app-form-grid">
            <div>
              <label htmlFor="firstName" className={UI_LABEL}>
                First name<span className="text-red-500">*</span>
              </label>
              <input id="firstName" className={UI_INPUT} {...form.register("firstName")} />
              <FieldError message={form.formState.errors.firstName?.message} />
            </div>
            <div>
              <label htmlFor="lastName" className={UI_LABEL}>
                Last name<span className="text-red-500">*</span>
              </label>
              <input id="lastName" className={UI_INPUT} {...form.register("lastName")} />
              <FieldError message={form.formState.errors.lastName?.message} />
            </div>
            <div>
              <label htmlFor="otherNames" className={UI_LABEL}>
                Other names
              </label>
              <input id="otherNames" className={UI_INPUT} {...form.register("otherNames")} />
            </div>
            <div>
              <label htmlFor="dob" className={UI_LABEL}>
                Date of birth<span className="text-red-500">*</span>
              </label>
              <Controller
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <input
                    id="dob"
                    type="date"
                    className={UI_INPUT}
                    value={toInputDate(field.value)}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v ? new Date(v) : new Date());
                    }}
                  />
                )}
              />
              <FieldError message={form.formState.errors.dob?.message ? String(form.formState.errors.dob.message) : undefined} />
            </div>
            <div>
              <label htmlFor="sex" className={UI_LABEL}>
                Sex<span className="text-red-500">*</span>
              </label>
              <select id="sex" className={UI_SELECT} {...form.register("sex")}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact" className={UI_LABEL}>
                Contact<span className="text-red-500">*</span>
              </label>
              <input id="contact" className={cn(UI_INPUT, "font-mono-ui")} placeholder="+233XXXXXXXXX" {...form.register("contact")} />
              <FieldError message={form.formState.errors.contact?.message} />
            </div>
          </div>
        </section>

        <section className="app-form-section" aria-labelledby="service-section">
          <h3 id="service-section" className="app-form-section-title">
            Service record
          </h3>
          <div className="app-form-grid">
            <div>
              <label htmlFor="rank" className={UI_LABEL}>
                Rank<span className="text-red-500">*</span>
              </label>
              <Controller
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <RankField
                    id="rank"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    className={UI_INPUT}
                    aria-invalid={Boolean(form.formState.errors.rank)}
                  />
                )}
              />
              <p className="mt-1 text-xs text-navy-400">Choose from the list or type a custom rank.</p>
              <FieldError message={form.formState.errors.rank?.message} />
            </div>
            <div>
              <label htmlFor="department" className={UI_LABEL}>
                Department<span className="text-red-500">*</span>
              </label>
              <Controller
                control={form.control}
                name="department"
                render={({ field }) => (
                  <DepartmentField id="department" value={field.value} onChange={field.onChange} className={UI_INPUT} />
                )}
              />
              <FieldError message={form.formState.errors.department?.message} />
            </div>
            <div>
              <label htmlFor="status" className={UI_LABEL}>
                Status<span className="text-red-500">*</span>
              </label>
              <select id="status" className={UI_SELECT} {...form.register("status")}>
                {MEMBER_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="app-form-section" aria-labelledby="assignment-section">
          <h3 id="assignment-section" className="app-form-section-title">
            Assignment &amp; location
          </h3>
          <div className="app-form-grid">
            <div>
              <label htmlFor="division" className={UI_LABEL}>
                Division<span className="text-red-500">*</span>
              </label>
              <input id="division" className={UI_INPUT} {...form.register("division")} />
              <FieldError message={form.formState.errors.division?.message} />
            </div>
            <div>
              <label htmlFor="district" className={UI_LABEL}>
                District<span className="text-red-500">*</span>
              </label>
              <input id="district" className={UI_INPUT} {...form.register("district")} />
              <FieldError message={form.formState.errors.district?.message} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="station" className={UI_LABEL}>
                Station<span className="text-red-500">*</span>
              </label>
              <input id="station" className={UI_INPUT} {...form.register("station")} />
              <FieldError message={form.formState.errors.station?.message} />
            </div>
          </div>
        </section>

        <div role="group" aria-label="Form actions" className="app-form-actions">
          <Link href="/members" className={cn(UI_BTN_SECONDARY, "no-underline")}>
            Cancel
          </Link>
          <Button type="submit" className={UI_BTN_PRIMARY} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : mode === "add" ? "Save Personnel Record" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
