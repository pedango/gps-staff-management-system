import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildMemberImportTemplateBuffer, MEMBER_IMPORT_TEMPLATE_FILENAME } from "@/lib/member-import";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buffer = buildMemberImportTemplateBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${MEMBER_IMPORT_TEMPLATE_FILENAME}"`,
      "Cache-Control": "no-store",
    },
  });
}
