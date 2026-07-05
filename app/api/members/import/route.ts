import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseMemberImportBuffer } from "@/lib/member-import";
import { createMember } from "@/lib/repositories/member-repository";
import { invalidateMembersListCache } from "@/lib/redis";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 5MB or less" }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => filename.endsWith(ext))) {
    return NextResponse.json({ error: "Upload an .xlsx, .xls, or .csv file" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseMemberImportBuffer(buffer, file.name);

    for (const row of rows) {
      await createMember({
        firstName: row.firstName,
        lastName: row.lastName,
        otherNames: row.otherNames,
        dob: row.dob,
        sex: row.sex,
        rank: row.rank,
        contact: row.contact,
        department: row.department,
        division: row.division,
        district: row.district,
        station: row.station,
        status: row.status,
      });
    }

    await invalidateMembersListCache();

    return NextResponse.json({ imported: rows.length, failed: 0, errors: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
