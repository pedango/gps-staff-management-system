import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSystemConfig, updateSystemConfig } from "@/lib/services/system-config";
import { systemConfigSchema } from "@/lib/validations/system-config.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getSystemConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = systemConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const config = await updateSystemConfig(parsed.data);
  return NextResponse.json(config);
}
