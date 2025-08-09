import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { Session, SessionStrategy, AuthOptions } from 'next-auth';
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PasswordService } from './password';

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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user in database
          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, credentials.email),
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await PasswordService.verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
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
    redirect: async ({ url, baseUrl }: { url: string; baseUrl: string }) => {
      // If the user is signing in and no specific redirect URL, redirect to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/user/dashboard`
      }

      // If it's a relative URL, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      // If it's an absolute URL to the same domain, allow it
      if (url.startsWith(baseUrl)) {
        return url
      }

      // Default fallback to user dashboard
      return `${baseUrl}/user/dashboard`
    },
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session?.user && token) {
        session.user.id = token.sub;
        session.user.role = token.role || "user";
      }
      return session;
    },
    jwt: async ({ token, user }: { token: any; user: any }) => {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        return token;
      }

      // For existing tokens, verify user still exists and get updated role
      if (token.sub) {
        try {
          const existingUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, token.sub),
          });

          if (!existingUser) {
            // User no longer exists, invalidate token
            return {};
          }

          // Update role in token if it changed
          token.role = existingUser.role;
        } catch (error) {
          console.error('Error verifying user in JWT callback:', error);
        }
      }

      return token;
    },
  },
};

export const isAdmin = (session: Session | null) => {
  return session?.user?.role === "admin";
};
