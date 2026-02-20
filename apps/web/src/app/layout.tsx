import { Geist } from "next/font/google";
import {
  ConvexAuthNextjsServerProvider,
  convexAuthNextjsToken
} from "@convex-dev/auth/nextjs/server";
import { api } from "@pingchat/convex/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";

import { ConvexClientProvider } from "~/integrations/convex/provider";
import { CurrentUserProvider } from "~/integrations/convex/current-user-provider";
import { ThemeProvider } from "~/integrations/theme/provider";
import "~/styles/globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const token = await convexAuthNextjsToken();
  const preloadedCurrentUser = token
    ? await preloadQuery(api.users.getCurrentUser, {}, { token })
    : await preloadQuery(api.users.getCurrentUser);

  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>
        <html
          lang="en"
          className={`${geist.variable}`}
          suppressHydrationWarning
        >
          <body>
            <CurrentUserProvider preloadedCurrentUser={preloadedCurrentUser}>
              <ThemeProvider>{children}</ThemeProvider>
            </CurrentUserProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}
