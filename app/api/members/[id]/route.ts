import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { memberSchema } from "@/lib/validations/member.schema";
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
  const json: unknown = await req.json();
  const parsed = memberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
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
    photo: data.photo,
  });
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
  await invalidateMembersListCache();
  return NextResponse.json({ ok: true });
}
