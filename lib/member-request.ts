import { memberSchema, type MemberFormData } from "@/lib/validations/member.schema";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sniffMime } from "@/lib/mime-sniff";

const textFieldKeys = [
  "firstName",
  "lastName",
  "otherNames",
  "dob",
  "sex",
  "rank",
  "contact",
  "department",
  "division",
  "district",
  "station",
  "status",
] as const;

export type ParsedMemberPayload =
  | { ok: true; data: MemberFormData }
  | { ok: false; status: number; error: unknown };

export async function parseMemberPayload(req: Request): Promise<ParsedMemberPayload> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const record: Record<string, unknown> = {};
    for (const key of textFieldKeys) {
      const v = form.get(key);
      if (typeof v === "string") {
        record[key] = v;
      }
    }
    const photoExisting = form.get("photo");
    if (typeof photoExisting === "string" && photoExisting.trim().length > 0) {
      record.photo = photoExisting.trim();
    }
    const photoFile = form.get("photoFile");
    if (photoFile instanceof File && photoFile.size > 0) {
      const buf = Buffer.from(await photoFile.arrayBuffer());
      if (buf.length > 2 * 1024 * 1024) {
        return { ok: false, status: 400, error: { photo: "Photo must be 2MB or less" } };
      }
      const declared = photoFile.type;
      if (declared !== "image/jpeg" && declared !== "image/png") {
        return { ok: false, status: 400, error: { photo: "Only JPEG or PNG images are allowed" } };
      }
      const sniffed = sniffMime(buf);
      if (sniffed !== "image/jpeg" && sniffed !== "image/png") {
        return { ok: false, status: 400, error: { photo: "Invalid image data" } };
      }
      const uploaded = await uploadToCloudinary(buf, "gps-pms/members/photos", "image");
      record.photo = uploaded.url;
    }
    const parsed = memberSchema.safeParse(record);
    if (!parsed.success) {
      return { ok: false, status: 400, error: parsed.error.flatten() };
    }
    return { ok: true, data: parsed.data };
  }

  const json: unknown = await req.json();
  const parsed = memberSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.flatten() };
  }
  return { ok: true, data: parsed.data };
}
