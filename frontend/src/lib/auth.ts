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
      if (session?.user && token.sub) {
        // Verify user still exists in database
        try {
          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, token.sub),
          });

          if (!user) {
            // User no longer exists in database, invalidate session
            return null;
          }

          session.user.id = token.sub;
          session.user.role = user.role ?? "admin";
          session.user.roles = token.roles ?? [];
        } catch (error) {
          console.error('Error verifying user in session callback:', error);
          return null;
        }
      }
      return session;
    },
    jwt: async ({ token, user }: { token: any; user: any }) => {
      if (user) {
        token.sub = user.id;
      }

      // For existing tokens, verify user still exists
      if (token.sub && !user) {
        try {
          const existingUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, token.sub),
          });

          if (!existingUser) {
            // User no longer exists, invalidate token
            return {};
          }
        } catch (error) {
          console.error('Error verifying user in JWT callback:', error);
          return {};
        }
      }

      return token;
    },
  },
};

export const isAdmin = (session: Session | null) => {
  return session?.user?.role === "admin";
};
