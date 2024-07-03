import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: {
      /** The user's id. */
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id?: string;
  }
}

export const isSecurePath = (pathname: string) =>
  ["/search"].some((prefix) =>
    pathname === "/" ? true : pathname.startsWith(prefix),
  );

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ profile, token }) {
      if (profile?.id) {
        token.id = profile.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session?.user && token?.id) {
        session = {
          ...session,
          user: { ...session.user, id: String(token.id) },
        };
      }
      return session;
    },
    authorized({ auth, request }) {
      if (isSecurePath(request.nextUrl.pathname)) {
        return !!auth?.user;
      }
      // we explicitly allow our public pages to be accessed by anyone
      return true;
    },
  },
  pages: {
    signIn: "login",
  },
  logger: {
    debug: (message, metadata) => console.debug(message, { metadata }),
    error: (error) => console.error(error),
    warn: (message) => console.warn(message),
  },
});
