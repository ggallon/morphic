import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const isSecurePath = (pathname: string) =>
  ["/search"].some((prefix) =>
    pathname === "/" ? true : pathname.startsWith(prefix),
  );

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    signIn({ user }) {
      console.log("signIn: ", user);
      return true;
    },
    session({ session }) {
      console.log("session: ", session);
      return session;
    },
    jwt({ token }) {
      console.log("session: ", token);
      return token;
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
