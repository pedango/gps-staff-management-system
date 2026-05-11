import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth.schema";
import { checkLoginRateLimit } from "@/lib/login-rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const forwarded = request.headers.get("x-forwarded-for");
        const ip =
          forwarded?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          request.headers.get("cf-connecting-ip") ??
          "unknown";

        const limit = await checkLoginRateLimit(ip);
        if (limit === "blocked") {
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: { email: parsed.data.email },
        });
        if (!admin) {
          await limit.recordFailure();
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, admin.password);
        if (!valid) {
          await limit.recordFailure();
          return null;
        }

        await limit.reset();
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          image: admin.avatar ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
