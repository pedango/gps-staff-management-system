import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteCloudinaryBySecureUrl } from "@/lib/cloudinary";
import { parseMemberPayload } from "@/lib/member-request";
import { deleteMember, findMemberById, updateMember } from "@/lib/repositories/member-repository";
import { invalidateMembersListCache } from "@/lib/redis";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const member = await findMemberById(id);
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(member);
}

export async function PUT(req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await findMemberById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = await parseMemberPayload(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const data = parsed.data;

  const previousPhoto = existing.photo;
  const nextPhoto = data.photo ?? null;
  const member = await updateMember(id, {
    firstName: data.firstName,
    lastName: data.lastName,
    otherNames: data.otherNames,
    dob: data.dob,
    sex: data.sex,
    rank: data.rank,
    contact: data.contact,
    department: data.department,
    division: data.division,
    district: data.district,
    station: data.station,
    status: data.status,
    photo: nextPhoto,
  });

  if (previousPhoto && nextPhoto && previousPhoto !== nextPhoto) {
    try {
      await deleteCloudinaryBySecureUrl(previousPhoto);
    } catch {
      // best-effort cleanup; member record already updated
    }
  }

  await invalidateMembersListCache();
  return NextResponse.json(member);
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await findMemberById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await deleteMember(id);
  try {
    await deleteCloudinaryBySecureUrl(existing.photo);
  } catch {
    // best-effort
  }
  await invalidateMembersListCache();
  return NextResponse.json({ ok: true });
}
