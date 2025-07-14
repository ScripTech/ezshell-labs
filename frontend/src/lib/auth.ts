import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { Session, SessionStrategy, AuthOptions } from 'next-auth';
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.role = token.role ?? "admin";
        session.user.roles = token.roles ?? [];
      }
      return session;
    },
    jwt: async ({ token, user }: { token: any; user: any }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};

export const isAdmin = (session: Session | null) => {
  return session?.user?.role === "admin";
};
