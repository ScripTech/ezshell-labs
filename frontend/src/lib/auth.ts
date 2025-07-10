import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { Session } from 'next-auth';

export const authOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [],
  callbacks: {
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.role = token.role ?? "admin";
        session.user.roles = token.roles ?? [];
      }
      return session;
    },
    jwt: async ({ token, user }: { token: any; user: any}) => {
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
