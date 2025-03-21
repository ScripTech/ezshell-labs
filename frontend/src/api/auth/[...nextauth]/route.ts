import NextAuth, { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { authOptions as baseAuthOptions } from "@/lib/auth";

// Create a new auth options object with providers
export const authOptions: AuthOptions = {
  ...baseAuthOptions,
  session: {
    strategy: "jwt" as const, // Ensure the strategy is of type 'SessionStrategy'
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
