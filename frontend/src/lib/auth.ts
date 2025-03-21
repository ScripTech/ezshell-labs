import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'

export const authOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [],
  callbacks: {
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session?.user) {
        session.user.id = token.sub!;
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
