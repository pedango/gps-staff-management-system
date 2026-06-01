import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { peekLoginBlocked } from "@/lib/login-rate-limit";

/** Export Auth.js GET handler directly — wrapping it breaks /api/auth/session in v5. */
export const { GET } = handlers;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.includes("callback/credentials")) {
    const blocked = await peekLoginBlocked(clientIp(req));
    if (blocked) {
      return NextResponse.json(
        {
          error:
            "Too many failed login attempts from this network. Please wait up to 15 minutes before trying again.",
        },
        { status: 429 },
      );
    }
  }
  return handlers.POST(req);
}
